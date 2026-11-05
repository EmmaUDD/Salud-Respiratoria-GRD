"""Exportación reproducible sin modificar fuentes. Ejecutar desde la raíz del repo."""
import json, re, hashlib, unicodedata
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'GRD_CIE_TM' / 'GRD_limpio' / 'v1'
PUBLIC = ROOT / 'frontend' / 'public' / 'data'
OUT.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)
nb = json.loads((ROOT/'Procesamiento/limpieza_basica_GRD.ipynb').read_text(encoding='utf-8'))
ns = {'OUT': OUT}
for i in [1,3,5,7]:
    code = ''.join(nb['cells'][i]['source'])
    code = code.replace("df = df.loc[~df['POSIBLE_DUPLICADO']].reset_index(drop=True)", "# Conservar candidatos para auditarlos antes de exportar")
    code = code.replace("rep['posibles_duplicados_eliminados'] = rep['posibles_duplicados_marcados']", "rep['posibles_duplicados_eliminados'] = 0")
    code = code.replace("df = df.drop_duplicates().reset_index(drop=True)", "df.loc[df.duplicated()].to_csv(OUT / f'excluidos_exactos_{anio}.csv.gz', index=False, compression='gzip')\n    df = df.drop_duplicates().reset_index(drop=True)")
    code = code.replace("df = df.dropna(subset=['FECHA_INGRESO']).reset_index(drop=True)", "df.loc[df['FECHA_INGRESO'].isna()].to_csv(OUT / f'excluidos_fecha_{anio}.csv.gz', index=False, compression='gzip')\n    df = df.dropna(subset=['FECHA_INGRESO']).reset_index(drop=True)")
    exec(compile(code, f'notebook-cell-{i}', 'exec'), ns)
    if i == 1: ns['DIR_GRD'] = ROOT/'GRD_CIE_TM'
ns['DIR_GRD'] = ROOT/'GRD_CIE_TM'
catalog_path = next(ROOT.rglob('establecimientos_20261103.csv'))
cat = pd.read_csv(catalog_path, sep=';', dtype=str).fillna('')
communes = json.loads((ROOT/'frontend/src/assets/communes.json').read_text(encoding='utf-8-sig'))
norm = lambda s: ''.join(c for c in unicodedata.normalize('NFD',str(s).upper()) if unicodedata.category(c)!='Mn').strip()
cut = {norm(c['label']): c['id'] for c in communes}
cut['COIHAIQUE'] = '11101'
reports, cube, diagnoses, mappings = [], [], {}, {}
for year in range(2019,2026):
    df, rep = ns['limpiar_grd'](year)
    # Alta y actividad distinguen episodios que la clave anterior confundía.
    key=['ID_BENEFICIARIO','COD_HOSPITAL','FECHA_INGRESO','FECHAALTA','DIAGNOSTICO1','TIPO_ACTIVIDAD']
    df.loc[df.POSIBLE_DUPLICADO].to_csv(OUT/f'candidatos_revision_{year}.csv.gz',index=False,compression='gzip')
    repeated=df.duplicated(key,keep='first') & df['ID_BENEFICIARIO'].notna()
    df.loc[repeated].to_csv(OUT/f'excluidos_duplicados_{year}.csv.gz',index=False,compression='gzip')
    rep['duplicados_clave_ampliada_excluidos']=int(repeated.sum())
    df=df.loc[~repeated].copy()
    activity=df['TIPO_ACTIVIDAD'].fillna('').str.upper().str.strip()
    included=activity.isin(['HOSPITALIZACIÓN','HOSPITALIZACIÓN EN URGENCIA'])
    rep['actividad_excluida']=activity[~included].value_counts().to_dict()
    df.loc[~included].to_csv(OUT/f'excluidos_actividad_{year}.csv.gz',index=False,compression='gzip')
    df=df.loc[included].copy()
    df['COD_COMUNA_ATENCION']=pd.NA
    df['COD_REGION_ATENCION']=pd.NA
    df['ESTADO_TERRITORIO']='sin_correspondencia'
    for code, indexes in df.groupby('COD_HOSPITAL').groups.items():
        hits=cat[(cat['EstablecimientoCodigoAntiguo'].str.strip()==code)|(cat['EstablecimientoCodigo'].str.strip()==code)]
        codes=hits['ComunaCodigo'].str.zfill(5).unique()
        if len(codes)==1 and codes[0] in {c['id'] for c in communes}:
            df.loc[indexes,'COD_COMUNA_ATENCION']=codes[0]
            df.loc[indexes,'COD_REGION_ATENCION']=codes[0][:2]
            df.loc[indexes,'COMUNA']=next(c['label'] for c in communes if c['id']==codes[0])
            df.loc[indexes,'ESTADO_TERRITORIO']='catalogo_actual_historia_no_certificada'
            df.loc[indexes,'HOSPITAL']=hits['EstablecimientoGlosa'].iloc[0]
        mappings[code]={'comunas_catalogo':list(codes),'nombre':str(hits['EstablecimientoGlosa'].iloc[0]) if len(hits) else None}
    # Dos sedes previas y traslado en abril 2020: no inventar comuna histórica.
    unresolved=(df.COD_HOSPITAL=='110120') & (df.FECHA_INGRESO<pd.Timestamp('2020-04-23'))
    df.loc[unresolved,['COD_COMUNA_ATENCION','COD_REGION_ATENCION','COMUNA']]=pd.NA
    df.loc[unresolved,'ESTADO_TERRITORIO']='sede_historica_no_resuelta'
    df['ESTANCIA_DIAS']=(df.FECHAALTA-df.FECHA_INGRESO).dt.days
    df.loc[df.ESTANCIA_DIAS<0,'ESTANCIA_DIAS']=pd.NA
    rep['filas_intermedias_antes_universo']=rep['filas_finales']
    rep['filas_finales']=len(df)
    rep['filas_exportadas']=len(df)
    rep['source_sha256']=hashlib.file_digest(open(ROOT/'GRD_CIE_TM'/f'GRD_PUBLICO_{year}_ER.txt','rb'),'sha256').hexdigest()
    rep['sin_comuna_validable']=int(df.COD_COMUNA_ATENCION.isna().sum())
    rep['ingreso_min']=str(df.FECHA_INGRESO.min());rep['ingreso_max']=str(df.FECHA_INGRESO.max())
    rep['alta_min']=str(df.FECHAALTA.min());rep['alta_max']=str(df.FECHAALTA.max())
    df.to_csv(OUT/f'grd_hospitalizaciones_{year}.csv.gz',index=False,compression='gzip')
    cols=['FECHAALTA','COD_COMUNA_ATENCION','TRAMO_EDAD','SEXO','DIAGNOSTICO1','ESTANCIA_DIAS']
    grp=df.groupby(cols,dropna=False).size().reset_index(name='n')
    for row in grp.itertuples(index=False,name=None):
        date,commune,age,sex,diagnosis,stay,n=row
        match=re.search(r'\[(\d+)',str(age))
        age_id=f'{int(match[1])}to{int(match[1])+4}' if match else 'unknown'
        cube.append([date.strftime('%Y-%m-%d'),None if pd.isna(commune) else commune,age_id,{'MUJER':'female','HOMBRE':'male'}.get(sex,'unknown'),diagnosis,None if pd.isna(stay) else int(stay),int(n)])
    diagnoses.update(dict(zip(df.DIAGNOSTICO1,df.DIAGNOSTICO1_DESC)))
    reports.append(rep)
    print(year,rep['filas_exportadas'],flush=True)
payload={'version':'grd-v1','createdAt':datetime.now(timezone.utc).isoformat(),'minDate':'2019-01-01','maxDate':'2025-12-31','columns':['dischargeDate','commune','age','sex','diagnosis','stayDays','count'],'rows':cube,'diagnoses':[{'id':k,'label':f'{k} · {v}'} for k,v in sorted(diagnoses.items())],'reports':reports}
temporary=PUBLIC/'grd-cube.json.tmp'
temporary.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
temporary.replace(PUBLIC/'grd-cube.json')
(OUT/'reporte_calidad.json').write_text(json.dumps({'version':'grd-v1','years':reports,'mapping':mappings,'hospitalCatalogSha256':hashlib.sha256(catalog_path.read_bytes()).hexdigest(),'timeAxis':'FECHAALTA','includedActivity':['HOSPITALIZACIÓN','HOSPITALIZACIÓN EN URGENCIA'],'denominatorAllDischarges':None,'historicalSource':'https://ssmoc.redsalud.gob.cl/hospital-felix-bulnes/','vaccinationIntegration':'not_joined_incompatible_territorial_bases'},ensure_ascii=False,indent=2,default=str),encoding='utf-8')
assert sum(r[-1] for r in cube)==sum(r['filas_exportadas'] for r in reports)
print('Exportación verificada:',sum(r[-1] for r in cube))
