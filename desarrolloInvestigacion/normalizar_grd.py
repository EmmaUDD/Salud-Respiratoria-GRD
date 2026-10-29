"""Normaliza los archivos públicos GRD anuales sin modificar los originales.

La salida separa el evento hospitalario de sus diagnósticos repetidos. Las
reglas clínicas y territoriales que no pueden demostrarse desde los archivos
se mantienen como valores explícitos, no como inferencias silenciosas.
"""

from __future__ import annotations

import argparse
import re
import unicodedata
from pathlib import Path
from typing import Iterable

import pandas as pd


TAMANO_BLOQUE = 100_000
PATRON_ANIO = re.compile(r"GRD_PUBLICO_(\d{4})\.txt$", re.IGNORECASE)

COLUMNAS_EVENTOS = [
    "anio", "id_evento", "cod_hospital", "id_beneficiario", "sexo",
    "fecha_nacimiento", "edad", "provincia", "comuna", "region_codigo",
    "region_nombre", "servicio_salud", "tipo_procedencia", "tipo_ingreso",
    "especialidad_medica", "tipo_actividad", "fecha_ingreso", "fecha_alta",
    "dias_estancia", "tipo_alta", "cod_grd", "peso_grd", "severidad_grd",
    "mortalidad_grd", "hospital_procedencia", "diagnostico_principal",
    "diagnostico_principal_sistema", "respiratorio", "grupo_respiratorio",
    "cantidad_diagnosticos_respiratorios", "fuente_archivo",
]

COLUMNAS_DIAGNOSTICOS = [
    "anio", "id_evento", "posicion", "codigo_diagnostico",
    "sistema_diagnostico", "es_principal", "respiratorio",
    "grupo_respiratorio", "fuente_archivo",
]

ALIAS_COLUMNAS = {
    "cod_hospital": ["COD_HOSPITAL"],
    "id_beneficiario": ["ID_BENEFICIARIO"],
    "sexo": ["SEXO"],
    "fecha_nacimiento": ["FECHA_NACIMIENTO"],
    "provincia": ["PROVINCIA"],
    "comuna": ["COMUNA"],
    "servicio_salud": ["SERVICIO_SALUD"],
    "tipo_procedencia": ["TIPO_PROCEDENCIA"],
    "tipo_ingreso": ["TIPO_INGRESO"],
    "especialidad_medica": ["ESPECIALIDAD_MEDICA"],
    "tipo_actividad": ["TIPO_ACTIVIDAD"],
    "fecha_ingreso": ["FECHA_INGRESO"],
    "fecha_alta": ["FECHAALTA", "FECHA_ALTA"],
    "tipo_alta": ["TIPOALTA", "TIPO_ALTA"],
    "peso_grd": ["IR_29301_PESO", "PESO_GRD"],
    "severidad_grd": ["IR_29301_SEVERIDAD", "SEVERIDAD_GRD"],
    "mortalidad_grd": ["IR_29301_MORTALIDAD", "MORTALIDAD_GRD"],
    "cod_grd": ["IR_29301_COD_GRD", "COD_GRD"],
    "hospital_procedencia": ["HOSPPROCEDENCIA", "HOSP_PROCEDENCIA"],
}


def normalizar_nombre(valor: object) -> str:
    texto = unicodedata.normalize("NFKD", str(valor))
    texto = "".join(caracter for caracter in texto if not unicodedata.combining(caracter))
    return re.sub(r"[^A-Z0-9]+", "_", texto.upper()).strip("_")


def normalizar_columnas(columnas: Iterable[object]) -> dict[object, str]:
    resultado: dict[object, str] = {}
    vistos: dict[str, int] = {}
    for columna in columnas:
        base = normalizar_nombre(columna)
        cantidad = vistos.get(base, 0)
        vistos[base] = cantidad + 1
        resultado[columna] = base if cantidad == 0 else f"{base}_{cantidad + 1}"
    return resultado


def primera_columna(marco: pd.DataFrame, nombres: Iterable[str]) -> pd.Series:
    for nombre in nombres:
        if nombre in marco:
            return marco[nombre]
    return pd.Series(pd.NA, index=marco.index, dtype="object")


def limpiar_texto(valores: pd.Series) -> pd.Series:
    return valores.astype("string").str.strip().replace(
        {"": pd.NA, "NAN": pd.NA, "NONE": pd.NA, "NULL": pd.NA}
    )


def convertir_fecha(valores: pd.Series) -> pd.Series:
    return pd.to_datetime(limpiar_texto(valores), errors="coerce").dt.strftime("%d-%m-%Y")


def convertir_numero(valores: pd.Series) -> pd.Series:
    return pd.to_numeric(limpiar_texto(valores).str.replace(",", ".", regex=False), errors="coerce")


def columnas_diagnostico(marco: pd.DataFrame) -> list[str]:
    columnas = [columna for columna in marco.columns if re.fullmatch(r"DIAGNOSTICO\d+", columna)]
    return sorted(columnas, key=lambda valor: int(valor.removeprefix("DIAGNOSTICO")))


def sistema_diagnostico(codigo: object) -> str | None:
    if pd.isna(codigo):
        return None
    valor = str(codigo).strip().upper()
    if not valor:
        return None
    return "CIE10" if valor.startswith(("A", "B", "J")) else "CIE9" if valor[:1].isdigit() else "OTRO"


def grupo_respiratorio(codigo: object) -> str:
    if pd.isna(codigo) or not str(codigo).strip():
        return "unknown"
    valor = str(codigo).strip().upper().replace(".", "")
    if valor.startswith("J09") or valor.startswith("J1"):
        return "pneumonia"
    if valor.startswith(("J40", "J41", "J42")):
        return "bronchitis"
    if valor.startswith(("J43", "J44")):
        return "copd"
    if valor.startswith(("J45", "J46")):
        return "asthma"
    if valor.startswith("J"):
        return "other"
    digitos = re.match(r"\d+", valor)
    if not digitos:
        return "unknown"
    numero = int(digitos.group())
    if 480 <= numero <= 488:
        return "pneumonia"
    if 490 <= numero <= 492:
        return "bronchitis"
    if 493 <= numero <= 496:
        return "copd" if numero in (491, 492, 496) else "asthma"
    if 460 <= numero <= 519:
        return "other"
    return "non-respiratory"


def calcular_edad(nacimiento: pd.Series, ingreso: pd.Series) -> pd.Series:
    edad = ingreso.dt.year - nacimiento.dt.year
    antes_cumpleanos = (ingreso.dt.month < nacimiento.dt.month) | (
        (ingreso.dt.month == nacimiento.dt.month) & (ingreso.dt.day < nacimiento.dt.day)
    )
    return edad.where(~antes_cumpleanos, edad - 1).where(
        nacimiento.notna() & ingreso.notna() & (edad >= 0) & (edad <= 120)
    )


def valor_canonico(marco: pd.DataFrame, campo: str) -> pd.Series:
    return limpiar_texto(primera_columna(marco, ALIAS_COLUMNAS[campo]))

def transform_chunk(
    marco: pd.DataFrame, anio: int, nombre_fuente: str, desplazamiento_filas: int
) -> tuple[pd.DataFrame, pd.DataFrame]:
    marco = marco.rename(columns=normalizar_columnas(marco.columns))
    nacimiento = pd.to_datetime(valor_canonico(marco, "fecha_nacimiento"), errors="coerce")
    ingreso = pd.to_datetime(valor_canonico(marco, "fecha_ingreso"), errors="coerce")
    alta = pd.to_datetime(valor_canonico(marco, "fecha_alta"), errors="coerce")

    columnas_diagnostico_grd = columnas_diagnostico(marco)
    identificador_evento = pd.Series(
        [f"{anio}-{desplazamiento_filas + indice}" for indice in range(len(marco))],
        index=marco.index,
        dtype="string",
    )
    diagnostico_principal = limpiar_texto(marco[columnas_diagnostico_grd[0]]) if columnas_diagnostico_grd else pd.Series(pd.NA, index=marco.index, dtype="string")
    todos_diagnosticos = marco[columnas_diagnostico_grd].stack().dropna().astype("string") if columnas_diagnostico_grd else pd.Series(dtype="string")
    indicadores_respiratorios = todos_diagnosticos.map(lambda codigo: grupo_respiratorio(codigo) in {
        "pneumonia", "copd", "asthma", "bronchitis", "other"
    }).groupby(level=0).any().reindex(marco.index, fill_value=False)
    cantidad_respiratorios = todos_diagnosticos.map(lambda codigo: grupo_respiratorio(codigo) not in ("non-respiratory", "unknown")).groupby(level=0).sum().reindex(marco.index, fill_value=0)
    grupo_principal = diagnostico_principal.map(grupo_respiratorio)

    eventos = pd.DataFrame({
        "anio": anio,
        "id_evento": identificador_evento,
        **{campo: valor_canonico(marco, campo) for campo in ALIAS_COLUMNAS},
        "fecha_nacimiento": nacimiento.dt.strftime("%d-%m-%Y"),
        "fecha_ingreso": ingreso.dt.strftime("%d-%m-%Y"),
        "fecha_alta": alta.dt.strftime("%d-%m-%Y"),
        "edad": calcular_edad(nacimiento, ingreso),
        "dias_estancia": (alta - ingreso).dt.days.where(
            ingreso.notna() & alta.notna() & (alta >= ingreso)
        ),
        "diagnostico_principal": diagnostico_principal,
        "diagnostico_principal_sistema": diagnostico_principal.map(sistema_diagnostico),
        "respiratorio": indicadores_respiratorios.to_numpy(),
        "grupo_respiratorio": grupo_principal.where(grupo_principal != "non-respiratory", "unknown"),
        "cantidad_diagnosticos_respiratorios": cantidad_respiratorios.to_numpy().astype("int64"),
        "region_codigo": pd.NA,
        "region_nombre": pd.NA,
        "fuente_archivo": nombre_fuente,
    }, index=marco.index)
    eventos["sexo"] = eventos["sexo"].str.upper().replace({
        "MUJER": "female", "FEMENINO": "female", "F": "female",
        "HOMBRE": "male", "MASCULINO": "male", "M": "male",
    }).fillna("unknown")
    eventos["sexo"] = eventos["sexo"].where(eventos["sexo"].isin(["female", "male"]), "unknown")

    filas_diagnosticos = []
    for posicion, columna in enumerate(columnas_diagnostico_grd, start=1):
        valores = limpiar_texto(marco[columna])
        presentes = valores.notna()
        if not presentes.any():
            continue
        filas_diagnosticos.append(pd.DataFrame({
            "anio": anio,
            "id_evento": identificador_evento[presentes],
            "posicion": posicion,
            "codigo_diagnostico": valores[presentes],
            "sistema_diagnostico": valores[presentes].map(sistema_diagnostico),
            "es_principal": posicion == 1,
            "respiratorio": valores[presentes].map(lambda codigo: grupo_respiratorio(codigo) in {
                "pneumonia", "copd", "asthma", "bronchitis", "other"
            }),
            "grupo_respiratorio": valores[presentes].map(grupo_respiratorio),
            "fuente_archivo": nombre_fuente,
        }))
    diagnosticos = pd.concat(filas_diagnosticos, ignore_index=True) if filas_diagnosticos else pd.DataFrame(columns=COLUMNAS_DIAGNOSTICOS)
    return eventos[COLUMNAS_EVENTOS], diagnosticos[COLUMNAS_DIAGNOSTICOS]


def procesar_archivo(origen: Path, directorio_salida: Path) -> dict[str, object]:
    puntero = origen.read_text(encoding="utf-8", errors="ignore")[:200]
    if puntero.startswith("version https://git-lfs.github.com/spec/v1"):
        raise RuntimeError(
            f"{origen.name} es un puntero Git LFS, no contiene filas GRD. "
            "Descarga los datos con 'git lfs pull' y vuelve a ejecutar."
        )
    coincidencia = PATRON_ANIO.search(origen.name)
    if not coincidencia:
        raise ValueError(f"Nombre de archivo no reconocido: {origen.name}")
    anio = int(coincidencia.group(1))
    ruta_eventos = directorio_salida / f"grd_eventos_{anio}.csv"
    ruta_diagnosticos = directorio_salida / f"grd_diagnosticos_{anio}.csv"
    ruta_calidad = directorio_salida / f"calidad_grd_{anio}.csv"
    for ruta in (ruta_eventos, ruta_diagnosticos):
        if ruta.exists():
            ruta.unlink()

    filas = diagnosticos = estancias_invalidas = identificadores_duplicados = 0
    primer_evento = True
    primer_diagnostico = True
    for bloque in pd.read_csv(
        origen, sep="|", encoding="latin-1", dtype="string",
        chunksize=TAMANO_BLOQUE, low_memory=False,
    ):
        eventos, tabla_diagnosticos = transform_chunk(bloque, anio, origen.name, filas)
        filas += len(eventos)
        diagnosticos += len(tabla_diagnosticos)
        estancias_invalidas += int(((eventos["fecha_ingreso"].notna()) & (eventos["fecha_alta"].notna()) & eventos["dias_estancia"].isna()).sum())
        identificadores_duplicados += int(eventos["id_evento"].duplicated(keep=False).sum())
        eventos.to_csv(ruta_eventos, mode="w" if primer_evento else "a", header=primer_evento, index=False)
        tabla_diagnosticos.to_csv(ruta_diagnosticos, mode="w" if primer_diagnostico else "a", header=primer_diagnostico, index=False)
        primer_evento = primer_diagnostico = False

    calidad = pd.DataFrame([{
        "anio": anio,
        "filas_entrada": filas,
        "diagnosticos_no_nulos": diagnosticos,
        "eventos_con_id_duplicado": identificadores_duplicados,
        "estancias_invalidas": estancias_invalidas,
        "region_no_inferida": "si",
        "observacion": "Validar región y clasificación clínica con catálogos oficiales antes de publicar resultados.",
    }])
    calidad.to_csv(ruta_calidad, index=False, encoding="utf-8")
    return {"anio": anio, "eventos": filas, "diagnosticos": diagnosticos}


def main() -> None:
    analizador_argumentos = argparse.ArgumentParser(description=__doc__)
    analizador_argumentos.add_argument("--input-dir", type=Path, default=Path(__file__).parents[1] / "datos_grd")
    analizador_argumentos.add_argument("--output-dir", type=Path, default=Path(__file__).parent / "salida_normalizada")
    argumentos = analizador_argumentos.parse_args()
    archivos_origen = sorted(argumentos.input_dir.glob("GRD_PUBLICO_*.txt"))
    if not archivos_origen:
        raise FileNotFoundError(f"No se encontraron archivos GRD en {argumentos.input_dir}")
    argumentos.output_dir.mkdir(parents=True, exist_ok=True)
    resumenes = [procesar_archivo(origen, argumentos.output_dir) for origen in archivos_origen]
    pd.DataFrame(resumenes).to_csv(argumentos.output_dir / "resumen_normalizacion.csv", index=False, encoding="utf-8")
    print(f"Procesados {len(resumenes)} archivos. Salida: {argumentos.output_dir}")


if __name__ == "__main__":
    main()
