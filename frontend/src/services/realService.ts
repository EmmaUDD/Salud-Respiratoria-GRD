import type { DashboardService, FilterOptions } from '../types/dashboard.ts';
import { filterOptions, type SimulatedEvent } from '../mocks/data.ts';
import { summarize } from '../mocks/aggregate.ts';
type Cube = { version:string;createdAt:string;minDate:string;maxDate:string;diagnoses:{id:string;label:string}[];rows:[string,string|null,string,string,string,number|null,number][] };
let cached:Promise<{cube:Cube;events:SimulatedEvent[];options:FilterOptions}>|undefined;
async function load(signal?:AbortSignal) {
  if(signal?.aborted) throw new DOMException('Cancelado','AbortError');
  cached??=fetch('/data/grd-cube.json').then(async r=>{if(!r.ok)throw new Error('Falta exportar grd-cube.json. Ejecuta Procesamiento/exportar_dashboard.py.');const cube:Cube=await r.json();if(cube.version!=='grd-v1'||!Array.isArray(cube.rows))throw new Error('Contrato GRD incompatible.');
    const options:FilterOptions={...structuredClone(filterOptions),minDate:cube.minDate,maxDate:cube.maxDate,years:[2019,2020,2021,2022,2023,2024,2025],diagnoses:cube.diagnoses};
    options.regions.push({id:'unknown',label:'Territorio sin asignación validable'});options.communes.push({id:'unknown',label:'Comuna sin asignación validable',region:'unknown'});
    const events:SimulatedEvent[]=[];
    for(const [date,commune,age,sex,diagnosis,stay,count] of cube.rows){if(!Number.isInteger(count)||count<1||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Fila inválida en el agregado GRD.');for(let i=0;i<count;i++)events.push({id:`aggregate-${events.length}`,dischargeDate:date,region:commune?.slice(0,2)??'unknown',commune:commune??'unknown',age:age==='unknown'?null:Number(age.split('to')[0]),sex:sex as SimulatedEvent['sex'],respiratory:true,diagnosis,stayDays:stay});}
    return {cube,events,options};});
  try {const result=await cached;if(signal?.aborted)throw new DOMException('Cancelado','AbortError');return result;}catch(e){cached=undefined;throw e;}
}
export const realService:DashboardService={
  async getFilterOptions(signal){return structuredClone((await load(signal)).options);},
  async getOverview(filters,signal){const {cube,events,options}=await load(signal);const result=summarize(filters,events,options);result.indicators.proportion={value:null,status:'unavailable',reason:'missing_denominator',unit:'percent',validCount:0};result.meta={...result.meta,mode:'real',source:'GRD respiratorios locales · hospitalización y hospitalización en urgencia',version:cube.version,updatedAt:cube.createdAt,minDate:cube.minDate,maxDate:cube.maxDate,territorialBasis:'atencion',definition:'Egresos con diagnóstico principal J y actividad hospitalaria incluida. Fecha de referencia: FECHAALTA. No son pacientes únicos ni incidencia.',warnings:['Solo diagnóstico principal J; no se dispone del universo no respiratorio para calcular proporciones.','Territorios basados en catálogo actual; historia de establecimientos no certificada. Félix Bulnes anterior al 23/04/2020 permanece sin comuna asignada.','No se relaciona con vacunación por residencia sin compatibilidad territorial.']};return result;},
  async getVaccination(){throw new Error('Vacunación real no integrada: faltan validar unidad, campaña, población y base territorial. No se mezclan cifras ficticias con GRD.');},
  async getLogisticPreview(filters,horizon){return {mode:'simulated',filters,cutoff:filters.endDate,horizon,targetPeriod:filters.endDate.slice(0,7),omittedPartialMonth:false,status:'unavailable',reason:'El modelo real no está entrenado ni validado; no se ejecuta la demostración sobre GRD real.'};}
};
