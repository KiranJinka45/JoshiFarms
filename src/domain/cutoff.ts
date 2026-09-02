import { DeliverySlot } from '../types';

export type SlotAvailability = {
  available: boolean;
  slotStart: Date;
  cutoffTime: Date;
  reason?: string;
};

export interface TimeProvider {
  now: () => Date;
}

/**
 * Default time provider that checks localStorage for prototypeCurrentTime
 * (allowing Playwright E2E tests and prototype controls to override current time deterministically).
 */
export const defaultTimeProvider: TimeProvider = {
  now: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const overrideISO = localStorage.getItem('prototypeCurrentTime');
      if (overrideISO) {
        const parsed = new Date(overrideISO);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
    return new Date();
  },
};

/**
 * Calculates slot availability based on the strict 7-hour cutoff rule.
 * 
 * Rule: slotStartDateTime - currentDateTime >= 7 hours
 * If currentTime.getTime() <= cutoffTime.getTime(), the slot is available.
 * Exactly 7 hours before slot start is available. 6h 59m before is CLOSED.
 */
export function getSlotAvailability(
  deliveryDate: string, // YYYY-MM-DD
  slot: DeliverySlot,
  currentTime: Date,
  cutoffHours = 7
): SlotAvailability {
  if (!deliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
    return {
      available: false,
      slotStart: new Date(NaN),
      cutoffTime: new Date(NaN),
      reason: 'Invalid delivery date format',
    };
  }

  const startTimeStr = slot === 'Morning' ? '05:30' : '17:30';
  const slotStart = new Date(`${deliveryDate}T${startTimeStr}:00+05:30`);

  if (isNaN(slotStart.getTime())) {
    return {
      available: false,
      slotStart: new Date(NaN),
      cutoffTime: new Date(NaN),
      reason: 'Invalid slot date time',
    };
  }

  const cutoffTime = new Date(slotStart.getTime() - cutoffHours * 60 * 60 * 1000);
  
  // Check if delivery date itself is strictly in the past
  const startOfDayDate = new Date(`${deliveryDate}T00:00:00+05:30`);
  const startOfCurrentDay = new Date(currentTime);
  startOfCurrentDay.setHours(0, 0, 0, 0);

  if (startOfDayDate.getTime() < startOfCurrentDay.getTime()) {
    return {
      available: false,
      slotStart,
      cutoffTime,
      reason: 'Cannot select past delivery date',
    };
  }

  // currentTime <= cutoffTime -> available
  const available = currentTime.getTime() <= cutoffTime.getTime();

  return {
    available,
    slotStart,
    cutoffTime,
    reason: available ? undefined : `Booking closed (Must book at least ${cutoffHours} hours prior to slot start)`,
  };
}
