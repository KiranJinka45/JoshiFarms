import { describe, it, expect } from 'vitest';
import { calculateSubtotal, calculateDeliveryFee, calculateOrderTotal, formatCurrencyINR } from '../../domain/pricing';
import { CartItem } from '../../types';

describe('Pricing Domain Engine', () => {
  const sampleItems: CartItem[] = [
    {
      productId: 'p1',
      productName: 'Fresh Cow Milk',
      image: '',
      packSize: { size: '1', unit: 'L', price: 68, availableQuantity: 10 },
      quantity: 1,
      unitPrice: 68,
      totalPrice: 68,
    },
    {
      productId: 'p3',
      productName: 'Farm Fresh Curd',
      image: '',
      packSize: { size: '400', unit: 'g', price: 45, availableQuantity: 10 },
      quantity: 1,
      unitPrice: 45,
      totalPrice: 45,
    },
  ];

  it('should calculate correct subtotal', () => {
    const subtotal = calculateSubtotal(sampleItems);
    expect(subtotal).toBe(113); // 68 + 45
  });

  it('should apply delivery fee when subtotal is under threshold', () => {
    const fee = calculateDeliveryFee(68, 100, 15);
    expect(fee).toBe(15);
  });

  it('should waive delivery fee when subtotal is at or above threshold (100 INR)', () => {
    const fee = calculateDeliveryFee(113, 100, 15);
    expect(fee).toBe(0);
  });

  it('should format INR currency properly', () => {
    expect(formatCurrencyINR(150)).toBe('₹150');
  });
});
