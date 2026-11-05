import { regions } from './data.ts';
import type { VaccinationQuery, VaccinationResponse } from '../types/vaccination.ts';
const season=[0,0,8,19,23,17,11,7,5,4,3,3];
export function vaccinationPreview(query:VaccinationQuery):VaccinationResponse {
  if (![2024,2025].includes(query.campaign) || (query.region!=='all'&&!regions.some(r=>r.id===query.region))) throw new Error('Campaña o región no disponible.');
  const rows=regions.filter(r=>query.region==='all'||r.id===query.region).map(r=>({...r,counts:season.map((weight,m)=>weight*(120+Number(r.id)*11+(query.campaign-2024)*17)+(weight?(Number(r.id)+m)%7:0))}));
  const monthly=season.map((_,i)=>({period:`${query.campaign}-${String(i+1).padStart(2,'0')}`,value:rows.reduce((s,r)=>s+r.counts[i],0),status:'available' as const,partial:false}));
  return {status:'ready',mode:'simulated',query:{...query},vaccine:'influenza',unit:'doses',monthly,total:monthly.reduce((s,p)=>s+p.value,0),territories:rows.map(r=>({id:r.id,label:r.label,value:r.counts.reduce((a,b)=>a+b,0),status:'available'})),coverage:{value:null,denominator:null,reason:'Denominador y dosis elegibles pendientes de validación. No se calcula cobertura.'},meta:{source:'Datos ficticios de demostración; no corresponden a las descargas DEIS',territorialBasis:'pending',campaignDefinition:'Ejemplo de interfaz agrupado por año calendario, no definición validada de campaña DEIS',warnings:['Dosis no equivale a personas vacunadas.','La relación con GRD no está integrada ni permite inferir eficacia individual.']}};
}
