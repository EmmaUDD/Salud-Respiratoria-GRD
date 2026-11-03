import type { LogisticPoint } from '../types/logistic.ts';
export function classificationMetrics(points:Pick<LogisticPoint,'observed'|'probability'>[],threshold:number) {
  let tp=0,tn=0,fp=0,fn=0;
  for(const p of points){if(p.probability>=threshold){if(p.observed)tp++;else fp++;}else{if(p.observed)fn++;else tn++;}}
  return {tp,tn,fp,fn,accuracy:points.length?(tp+tn)/points.length:null,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null};
}
