import type { DashboardService } from '../types/dashboard.ts';
import { filterOptions } from '../mocks/data.ts';
import { summarize } from '../mocks/aggregate.ts';
import { logisticPreview } from '../mocks/logistic.ts';

function wait(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Consulta cancelada', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, 220);
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
  });
}
export const mockService: DashboardService = {
  async getFilterOptions(signal) { await wait(signal); return structuredClone(filterOptions); },
  async getOverview(filters, signal) { await wait(signal); return summarize(filters); },
  async getLogisticPreview(filters, horizon, signal) { await wait(signal); if(signal?.aborted) throw new DOMException('Consulta cancelada','AbortError'); return logisticPreview(filters, undefined, horizon); },
};
