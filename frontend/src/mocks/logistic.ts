import { summarize, validateFilters } from './aggregate.ts';
import { events, type SimulatedEvent } from './data.ts';
import type { Filters } from '../types/dashboard.ts';
import type { LogisticPoint, LogisticPreview } from '../types/logistic.ts';
import { addMonths } from '../utils/months.ts';

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-35, Math.min(35, z))));
const dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);
export function quantile75(values: number[]): number {
  const sorted = [...values].sort((a,b)=>a-b), index = (sorted.length-1)*.75;
  return sorted[Math.floor(index)] + (index%1)*(sorted[Math.ceil(index)]-sorted[Math.floor(index)]);
}
// Local demonstrator only: penalized mean log-loss, deterministic gradient descent.
// The production model must be trained and validated separately by the data team.
export function fitBinary(x: number[][], y: number[]): {weights:number[]; converged:boolean} {
  const weights = x[0].map(()=>0);
  for (let iteration=0;iteration<8000;iteration++) {
    const gradient=weights.map(()=>0);
    x.forEach((row,i)=>{const error=sigmoid(dot(weights,row))-y[i];row.forEach((v,j)=>{gradient[j]+=error*v/x.length;});});
    for(let j=1;j<weights.length;j++) gradient[j]+=.05*weights[j];
    if (Math.max(...gradient.map(Math.abs))<1e-6) return {weights,converged:true};
    gradient.forEach((g,j)=>{weights[j]-=.4*g;});
  }
  return {weights,converged:false};
}
const featureLabels=['Intercepto','Trimestre 2 (vs. T1)','Trimestre 3 (vs. T1)','Trimestre 4 (vs. T1)','Mes de origen elevado','Mismo mes del año anterior elevado'];
function features(period:string, origin:number, seasonal:number, threshold:number) {
  const quarter=Math.ceil(Number(period.slice(5))/3);
  const originHigh=origin>threshold?1:0, seasonalHigh=seasonal>threshold?1:0;
  return { quarter, originHigh, seasonalHigh, x:[1,Number(quarter===2),Number(quarter===3),Number(quarter===4),originHigh,seasonalHigh] } as const;
}
export function logisticPreview(filters:Filters, source:readonly SimulatedEvent[]=events, horizon=1):LogisticPreview {
  validateFilters(filters);
  if(!Number.isInteger(horizon)||horizon<1||horizon>12)throw new Error('El horizonte debe ser un número entero entre 1 y 12 meses.');
  const end=new Date(`${filters.endDate}T00:00:00Z`);
  const monthEnd=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).toISOString().slice(0,10);
  const partial=filters.endDate!==monthEnd;
  if(partial) end.setUTCDate(0);
  const cutoff=end.toISOString().slice(0,10);
  const base={mode:'simulated' as const,filters:{...filters},cutoff,horizon,targetPeriod:addMonths(cutoff.slice(0,7),horizon),omittedPartialMonth:partial};
  const unavailable=(reason:string):LogisticPreview=>({...base,status:'unavailable',reason});
  if(cutoff<'2019-01-01')return unavailable('No hay meses completos anteriores a la fecha de corte.');
  // Deliberately use full pre-cutoff history; the chart's start date is not training truncation.
  const monthly=summarize({...filters,startDate:'2019-01-01',endDate:cutoff},source).monthly;
  if(monthly.length<47+horizon)return unavailable(`Este horizonte de ${horizon} meses necesita al menos ${47+horizon} meses completos: rezagos, separación temporal, 24 filas de entrenamiento y 12 de evaluación. Amplía la fecha final o reduce el horizonte.`);
  const split=monthly.length-12;
  const counts=monthly.map(p=>p.value!);
  // Last training target must already be observed at the FIRST evaluation origin.
  // Otherwise h>1 would train with months that are still future at that origin.
  const lastTrain=split-horizon;
  const threshold=quantile75(counts.slice(0,lastTrain+1));
  const train=monthly.slice(12,lastTrain+1).map((p,j)=>({f:features(p.period,counts[j+12-horizon],counts[j],threshold),y:Number(counts[j+12]>threshold)}));
  const positives=train.reduce((sum,r)=>sum+r.y,0);
  if(positives<5 || train.length-positives<5)return unavailable('La selección tiene menos de cinco meses de alguna clase en entrenamiento. Amplía territorio, edad, sexo o diagnóstico. No se calcula una probabilidad con esta selección.');
  const model=fitBinary(train.map(r=>[...r.f.x]),train.map(r=>r.y));
  if(!model.converged)return unavailable('El ajuste de demostración no convergió. No se muestran probabilidades de este ajuste.');
  const prediction=(i:number,period:string)=>{const f=features(period,counts[i-horizon],counts[i-12],threshold);return {period,originPeriod:addMonths(period,-horizon),quarter:f.quarter,originHigh:f.originHigh,seasonalHigh:f.seasonalHigh,probability:sigmoid(dot(model.weights,[...f.x]))};};
  // Frozen coefficients; direct h-month predictions from origins at t-h, not t-1.
  const test:LogisticPoint[]=monthly.slice(split).map((p,j)=>({...prediction(split+j,p.period),count:counts[split+j],observed:counts[split+j]>threshold?1:0}));
  const baseline=positives/train.length;
  const brier=test.reduce((sum,p)=>sum+(p.probability-p.observed)**2,0)/test.length;
  const baselineBrier=test.reduce((sum,p)=>sum+(baseline-p.observed)**2,0)/test.length;
  return {...base,status:'ready',countThreshold:threshold,trainStart:monthly[12].period,trainEnd:monthly[lastTrain].period,trainSize:train.length,trainPositive:positives,testStart:test[0].period,testEnd:test.at(-1)!.period,test,baselineProbability:baseline,brier,baselineBrier,next:prediction(counts.length-1+horizon,base.targetPeriod),coefficients:featureLabels.map((label,i)=>({label,value:model.weights[i]}))};
}

