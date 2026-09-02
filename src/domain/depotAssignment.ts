import { Depot, DepotAssignment, Address, DeliverySlot } from '../types';

export type DepotAssignmentResult = {
  success: boolean;
  assignment: DepotAssignment;
  selectedDepot?: Depot;
  reason: string;
};

/**
 * Deterministic multi-depot assignment algorithm.
 * 
 * Rules:
 * 1. Filter active depots with slot support & available capacity.
 * 2. Check for depots serving the customer's pincode / zone.
 * 3. If primary zone depots exist and have capacity, pick the best primary depot.
 * 4. If primary zone depots are full/unavailable, fallback to eligible secondary depots with capacity.
 * 5. If no depot qualifies, mark assignment as failed -> creates exception.
 */
export function assignDepotForOrder(
  address: Address,
  deliverySlot: DeliverySlot,
  depots: Depot[]
): DepotAssignmentResult {
  const activeDepots = depots.filter(d => d.isActive);
  
  if (activeDepots.length === 0) {
    return {
      success: false,
      assignment: {
        primaryDepotId: '',
        assignmentType: 'fallback',
        assignmentReason: 'No active depots in the system',
      },
      reason: 'No active depots in the system',
    };
  }

  // Filter depots with available capacity & slot support
  const availableDepots = activeDepots.filter(d => 
    d.supportedSlots.includes(deliverySlot) &&
    d.currentOrderCount < d.dailyOrderCapacity
  );

  if (availableDepots.length === 0) {
    const primaryDepot = activeDepots[0];
    return {
      success: false,
      assignment: {
        primaryDepotId: primaryDepot.id,
        assignmentType: 'fallback',
        assignmentReason: 'All system depots are at full order capacity for this slot',
      },
      reason: 'All system depots are at full order capacity for this slot',
    };
  }

  // Check if any available depot serves the pincode/zone directly
  const primaryZoneDepots = availableDepots.filter(d => 
    d.serviceZones.includes(address.pincode) || 
    d.serviceZones.some(z => address.street.toLowerCase().includes(z.toLowerCase()) || address.city.toLowerCase().includes(z.toLowerCase()))
  );

  const isPrimaryMatch = primaryZoneDepots.length > 0;
  const candidateDepots = isPrimaryMatch ? primaryZoneDepots : availableDepots;

  // Pick candidate depot with lowest utilization ratio
  const bestDepot = candidateDepots.reduce((prev, curr) => {
    const prevRatio = prev.currentOrderCount / prev.dailyOrderCapacity;
    const currRatio = curr.currentOrderCount / curr.dailyOrderCapacity;
    return currRatio < prevRatio ? curr : prev;
  });

  return {
    success: true,
    selectedDepot: bestDepot,
    assignment: {
      primaryDepotId: isPrimaryMatch ? bestDepot.id : (activeDepots.find(d => d.serviceZones.includes(address.pincode))?.id || bestDepot.id),
      assignedDepotId: bestDepot.id,
      assignmentType: isPrimaryMatch ? 'automatic' : 'fallback',
      assignmentReason: isPrimaryMatch ? 'Optimal zone match & capacity' : 'Secondary fallback depot with capacity',
      assignedAt: new Date().toISOString(),
    },
    reason: `Assigned to ${bestDepot.name}`,
  };
}

/**
 * Manual Admin Override for Depot Reassignment.
 */
export function overrideDepotAssignment(
  currentAssignment: DepotAssignment,
  newDepotId: string,
  reason: string,
  adminId: string
): DepotAssignment {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Mandatory override reason is required');
  }

  return {
    ...currentAssignment,
    assignedDepotId: newDepotId,
    assignmentType: 'manual',
    assignmentReason: reason.trim(),
    assignedAt: new Date().toISOString(),
    assignedBy: adminId,
  };
}
