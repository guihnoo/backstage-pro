import { calculateEventReceivableAmount, isCancelledEvent } from '../eventFinance';
import { dailyBaseValue } from '../workDay';

/** Cachê de um dia do trabalho (0 quando não há como saber). */
export function dailyBaseValueSafe(event) {
  try {
    return Number(dailyBaseValue(event)) || 0;
  } catch {
    return 0;
  }
}

export { calculateEventReceivableAmount, isCancelledEvent };
