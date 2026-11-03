import type { FilterOptions, Option, Sex } from '../types/dashboard.ts';
import communeCatalog from '../assets/communes.json' with { type: 'json' };
export const communes = communeCatalog;

export interface SimulatedEvent {
  id: string;
  dischargeDate: string;
  region: string;
  commune: string;
  age: number | null;
  sex: Sex;
  respiratory: boolean;
  diagnosis: string;
  stayDays: number | null;
}

export const regions: Option[] = [
  ['15', 'Arica y Parinacota'], ['01', 'Tarapacá'], ['02', 'Antofagasta'],
  ['03', 'Atacama'], ['04', 'Coquimbo'], ['05', 'Valparaíso'],
  ['13', 'Metropolitana'], ['06', 'O’Higgins'], ['07', 'Maule'],
  ['16', 'Ñuble'], ['08', 'Biobío'], ['09', 'La Araucanía'],
  ['14', 'Los Ríos'], ['10', 'Los Lagos'], ['11', 'Aysén'], ['12', 'Magallanes'],
].map(([id, label]) => ({ id, label }));

export const diagnoses: Option[] = [
  { id: 'pneumonia', label: 'Neumonía' },
  { id: 'copd', label: 'EPOC' },
  { id: 'asthma', label: 'Asma' },
  { id: 'bronchitis', label: 'Bronquitis' },
  { id: 'other', label: 'Otras respiratorias' },
  { id: 'unknown', label: 'Grupo respiratorio no especificado' },
];

export const filterOptions: FilterOptions = {
  minDate: '2019-01-01', maxDate: '2024-12-31', years: [2019, 2020, 2021, 2022, 2023, 2024],
  regions, communes,
  ages: [
    { id: 'under18', label: 'Menores de 18 años' },
    { id: '18to64', label: '18–64 años' },
    { id: '65plus', label: '65 años o más' },
    { id: 'unknown', label: 'Edad desconocida' },
  ],
  sexes: [{ id: 'female', label: 'Femenino' }, { id: 'male', label: 'Masculino' }, { id: 'unknown', label: 'Sexo desconocido' }],
  diagnoses,
};

/** Una única fuente determinista. No representa registros ni patrones reales de GRD. */
function createEvents(): SimulatedEvent[] {
  const result: SimulatedEvent[] = [];
  const season = [0, 0, 0, 1, 1, 3, 4, 3, 1, 0, 0, 0];
  for (let year = 2019; year <= 2024; year++) {
    for (let month = 1; month <= 12; month++) {
      regions.forEach((region, r) => {
        communes.filter(c => c.region === region.id).forEach((commune, c) => {
        const count = 5 + ((r * 3 + c + year) % 5) + season[month - 1];
        for (let i = 0; i < count; i++) {
          const key = (year - 2018) * 7919 + month * 317 + r * 71 + c * 41 + i * 37;
          const respiratory = key % 100 < 31 + season[month - 1] * 5;
          result.push({
            id: `demo-${year}-${month}-${commune.id}-${i}`,
            dischargeDate: `${year}-${String(month).padStart(2, '0')}-${String(2 + key % 26).padStart(2, '0')}`,
            region: region.id,
            commune: commune.id,
            age: key % 23 === 0 ? null : (key * 7) % 96,
            sex: key % 31 === 0 ? 'unknown' : key % 2 === 0 ? 'female' : 'male',
            respiratory,
            diagnosis: respiratory ? (key % 29 === 0 ? 'unknown' : diagnoses[(key % 11) < 5 ? 0 : (key % 4) + 1].id) : 'non-respiratory',
            stayDays: key % 17 === 0 ? null : (key * 3) % 13,
          });
        }
        });
      });
    }
  }
  return result;
}

export const events: readonly SimulatedEvent[] = createEvents();
