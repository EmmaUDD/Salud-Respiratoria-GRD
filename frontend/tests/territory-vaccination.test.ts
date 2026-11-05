import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarize, validateFilters } from '../src/mocks/aggregate.ts';
import { defaultFilters } from '../src/app/defaults.ts';
import { vaccinationPreview } from '../src/mocks/vaccination.ts';
import geometry from '../src/assets/commune-map.json' with { type: 'json' };
import { filterOptions } from '../src/mocks/data.ts';

test('Comunas de regiones distintas: unión sin duplicar egresos y totales reconciliados',()=>{
  const ids=['13101','08101'];
  const combined=summarize({...defaultFilters,communes:ids});
  const individual=ids.map(id=>summarize({...defaultFilters,region:filterOptions.communes.find(c=>c.id===id)!.region,commune:id}));
  assert.equal(combined.meta.respiratoryTotal,individual.reduce((s,d)=>s+d.meta.respiratoryTotal,0));
  assert.equal(combined.meta.universeTotal,individual.reduce((s,d)=>s+d.meta.universeTotal,0));
  assert.equal(combined.communes.reduce((s,c)=>s+c.value,0),combined.meta.respiratoryTotal);
  assert.deepEqual(combined.communes.map(c=>c.id).sort(),ids.sort());
  assert.equal(combined.monthly.reduce((s,p)=>s+(p.value??0),0),combined.meta.respiratoryTotal);
  assert.equal(summarize({...defaultFilters,communes:[]}).meta.respiratoryTotal,summarize(defaultFilters).meta.respiratoryTotal);
});
test('No se aceptan códigos comunales desconocidos ni selecciones duplicadas',()=>{
  assert.throws(()=>validateFilters({...defaultFilters,communes:['99999']}));
  assert.throws(()=>validateFilters({...defaultFilters,communes:['13101','13101']}));
});
test('Las geometrías comunales tienen códigos únicos y corresponden a su región',()=>{
  const ids:string[]=[];
  for(const [region,features] of Object.entries(geometry)) for(const f of features){
    assert.equal(filterOptions.communes.find(c=>c.id===f.id)?.region,region);
    assert.ok(f.d.startsWith('M'));
    assert.ok(!f.d.includes('NaN'));
    ids.push(f.id);
  }
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(ids.length,344);
  assert.deepEqual(filterOptions.communes.filter(c=>!ids.includes(c.id)).map(c=>c.id).sort(),['05201','12202']);
});
test('Dosis mensuales y regionales reconcilian; filtrar región conserva la misma fuente',()=>{
  for(const campaign of [2024,2025] as const){
    const all=vaccinationPreview({campaign,region:'all'});
    assert.equal(all.total,all.monthly.reduce((s,p)=>s+(p.value??0),0));
    assert.equal(all.total,all.territories.reduce((s,p)=>s+(p.value??0),0));
    for(const territory of all.territories){
      const one=vaccinationPreview({campaign,region:territory.id});
      assert.equal(one.total,territory.value);
      assert.equal(one.coverage.value,null);
      assert.equal(one.coverage.denominator,null);
    }
    assert.equal(all.monthly[0].value,0);
    assert.equal(all.monthly[0].status,'available');
    assert.deepEqual(vaccinationPreview({campaign,region:'all'}),all);
  }
});
