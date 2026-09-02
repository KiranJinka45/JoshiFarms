import { CartItem } from '../types';

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.totalPrice, 0);
}

export function calculateDeliveryFee(subtotal: number, freeDeliveryThreshold = 100, standardFee = 15): number {
  if (subtotal <= 0) return 0;
  return subtotal >= freeDeliveryThreshold ? 0 : standardFee;
}

export function calculateOrderTotal(subtotal: number, deliveryFee: number, discount = 0): number {
  return Math.max(0, subtotal + deliveryFee - discount);
}

export function formatCurrencyINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
