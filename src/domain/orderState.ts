import { OrderStatus } from '../types';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Ready for Dispatch', 'Cancelled'],
  'Ready for Dispatch': ['Assigned', 'Cancelled'],
  Assigned: ['Driver En Route', 'Rescheduled', 'Cancelled'],
  'Driver En Route': ['Arrived', 'Failed Delivery', 'Rescheduled', 'Cancelled'],
  Arrived: ['Delivered', 'Failed Delivery', 'Returned', 'Rescheduled'],
  Delivered: [],
  Cancelled: [],
  'Failed Delivery': ['Rescheduled', 'Returned', 'Cancelled'],
  Rescheduled: ['Confirmed', 'Cancelled'],
  Returned: [],
};

export function canTransitionOrderStatus(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

export function validateOrderStatusTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): void {
  if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
    throw new Error(`Invalid status transition from "${currentStatus}" to "${nextStatus}"`);
  }
}
