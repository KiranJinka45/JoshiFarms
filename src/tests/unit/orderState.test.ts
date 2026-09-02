import { describe, it, expect } from 'vitest';
import { canTransitionOrderStatus, validateOrderStatusTransition } from '../../domain/orderState';

describe('Order Status State Machine', () => {
  it('should allow valid forward transitions', () => {
    expect(canTransitionOrderStatus('Placed', 'Confirmed')).toBe(true);
    expect(canTransitionOrderStatus('Confirmed', 'Ready for Dispatch')).toBe(true);
    expect(canTransitionOrderStatus('Ready for Dispatch', 'Assigned')).toBe(true);
    expect(canTransitionOrderStatus('Assigned', 'Driver En Route')).toBe(true);
    expect(canTransitionOrderStatus('Driver En Route', 'Arrived')).toBe(true);
    expect(canTransitionOrderStatus('Arrived', 'Delivered')).toBe(true);
  });

  it('should reject invalid backward or jump transitions', () => {
    expect(canTransitionOrderStatus('Placed', 'Delivered')).toBe(false);
    expect(canTransitionOrderStatus('Delivered', 'Placed')).toBe(false);
  });

  it('should throw error on invalid transition in validate function', () => {
    expect(() => validateOrderStatusTransition('Delivered', 'Placed')).toThrow('Invalid status transition');
  });
});
