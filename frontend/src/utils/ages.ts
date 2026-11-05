import type { AgeGroup } from '../types/dashboard.ts';

/** Tramos observados en TRAMO_EDAD de GRD 2025; contrato provisional. */
export const ageBands: { id: AgeGroup; label: string; min: number; max: number }[] =
  Array.from({ length: 22 }, (_, index) => {
    const min = index * 5;
    const max = min + 4;
    return { id: `${min}to${max}` as AgeGroup, label: `${min}–${max} años`, min, max };
  });
