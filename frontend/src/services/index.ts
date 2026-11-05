import { mockService } from './mockService.ts';
import { realService } from './realService.ts';
import { isRealData } from './sourceMode.ts';
export const dashboardService = isRealData ? realService : mockService;
