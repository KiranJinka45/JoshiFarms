import { describe, it, expect } from 'vitest';
import { assignDepotForOrder, overrideDepotAssignment } from '../../domain/depotAssignment';
import { Address, Depot } from '../../types';

describe('Multi-Depot Routing & Assignment Engine', () => {
  const testAddress: Address = {
    id: 'a1',
    houseOrFlat: '402',
    street: 'Koramangala 4th Block',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    tag: 'Home',
    isDefault: true,
  };

  const testDepots: Depot[] = [
    {
      id: 'depot-koramangala',
      name: 'Koramangala Depot',
      address: 'Koramangala',
      latitude: 12.93,
      longitude: 77.62,
      serviceZones: ['560034'],
      supportedSlots: ['Morning', 'Evening'],
      dailyOrderCapacity: 50,
      currentOrderCount: 10,
      isActive: true,
    },
    {
      id: 'depot-whitefield',
      name: 'Whitefield Depot',
      address: 'Whitefield',
      latitude: 12.96,
      longitude: 77.75,
      serviceZones: ['560066'],
      supportedSlots: ['Morning', 'Evening'],
      dailyOrderCapacity: 50,
      currentOrderCount: 5,
      isActive: true,
    },
  ];

  it('should automatically assign primary depot matching customer pincode', () => {
    const result = assignDepotForOrder(testAddress, 'Morning', testDepots);
    expect(result.success).toBe(true);
    expect(result.selectedDepot?.id).toBe('depot-koramangala');
    expect(result.assignment.assignmentType).toBe('automatic');
  });

  it('should fallback to secondary depot if primary is at full capacity', () => {
    const fullDepots: Depot[] = [
      { ...testDepots[0], currentOrderCount: 50 }, // Koramangala FULL
      testDepots[1], // Whitefield available
    ];

    const result = assignDepotForOrder(testAddress, 'Morning', fullDepots);
    expect(result.success).toBe(true);
    expect(result.selectedDepot?.id).toBe('depot-whitefield');
    expect(result.assignment.assignmentType).toBe('fallback');
  });

  it('should allow admin manual override with mandatory reason', () => {
    const initialAssignment = {
      primaryDepotId: 'depot-koramangala',
      assignedDepotId: 'depot-koramangala',
      assignmentType: 'automatic' as const,
    };

    const overridden = overrideDepotAssignment(
      initialAssignment,
      'depot-whitefield',
      'Vehicle breakdown at Koramangala',
      'admin-1'
    );

    expect(overridden.assignedDepotId).toBe('depot-whitefield');
    expect(overridden.assignmentType).toBe('manual');
    expect(overridden.assignmentReason).toBe('Vehicle breakdown at Koramangala');
    expect(overridden.assignedBy).toBe('admin-1');
  });

  it('should throw error if override reason is empty', () => {
    const initialAssignment = {
      primaryDepotId: 'depot-koramangala',
      assignmentType: 'automatic' as const,
    };

    expect(() => 
      overrideDepotAssignment(initialAssignment, 'depot-whitefield', '   ', 'admin-1')
    ).toThrow('Mandatory override reason');
  });
});
