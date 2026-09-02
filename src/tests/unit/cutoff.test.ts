import { describe, it, expect } from 'vitest';
import { getSlotAvailability } from '../../domain/cutoff';

describe('Seven-Hour Cutoff Business Rule', () => {
  it('should be AVAILABLE when current time is more than 7 hours before slot start', () => {
    // Delivery date: 2026-09-01, Morning slot start: 05:30 AM
    // Cutoff time: 2026-08-31 10:30 PM (22:30)
    // Current time: 2026-08-31 08:00 PM (20:00) -> 9.5 hours before slot start
    const deliveryDate = '2026-09-01';
    const currentTime = new Date('2026-08-31T20:00:00+05:30');
    
    const result = getSlotAvailability(deliveryDate, 'Morning', currentTime);
    expect(result.available).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should be AVAILABLE when current time is EXACTLY 7 hours before slot start (boundary condition)', () => {
    // Morning slot start: 2026-09-01 05:30 AM
    // Cutoff time: 2026-08-31 10:30 PM (22:30)
    // Current time: 2026-08-31 10:30 PM (22:30) -> Exactly 7 hours before
    const deliveryDate = '2026-09-01';
    const currentTime = new Date('2026-08-31T22:30:00+05:30');
    
    const result = getSlotAvailability(deliveryDate, 'Morning', currentTime);
    expect(result.available).toBe(true);
  });

  it('should show BOOKING CLOSED when current time is 6 hours 59 minutes before slot start', () => {
    // Current time: 2026-08-31 10:31 PM (22:31) -> 6h 59m before slot start
    const deliveryDate = '2026-09-01';
    const currentTime = new Date('2026-08-31T22:31:00+05:30');
    
    const result = getSlotAvailability(deliveryDate, 'Morning', currentTime);
    expect(result.available).toBe(false);
    expect(result.reason).toContain('Booking closed');
  });

  it('should show BOOKING CLOSED for tomorrow morning slot when checked at 11:00 PM today', () => {
    // Requirement test case: Tomorrow's 5:30 AM morning slot checked at 11:00 PM today
    const deliveryDate = '2026-09-01';
    const currentTime = new Date('2026-08-31T23:00:00+05:30'); // 11:00 PM
    
    const result = getSlotAvailability(deliveryDate, 'Morning', currentTime);
    expect(result.available).toBe(false);
  });

  it('should remain AVAILABLE for tomorrow evening slot when checked at 11:00 PM today', () => {
    // Requirement test case: Tomorrow's 5:30 PM evening slot checked at 11:00 PM today
    // Slot start: 2026-09-01 17:30. Cutoff: 2026-09-01 10:30 AM.
    // 11:00 PM today is 11.5 hours before cutoff time!
    const deliveryDate = '2026-09-01';
    const currentTime = new Date('2026-08-31T23:00:00+05:30');
    
    const result = getSlotAvailability(deliveryDate, 'Evening', currentTime);
    expect(result.available).toBe(true);
  });

  it('should reject delivery dates in the past', () => {
    const pastDate = '2026-08-25';
    const currentTime = new Date('2026-08-31T10:00:00+05:30');
    
    const result = getSlotAvailability(pastDate, 'Morning', currentTime);
    expect(result.available).toBe(false);
    expect(result.reason).toContain('past');
  });
});
