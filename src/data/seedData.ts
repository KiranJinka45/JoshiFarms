import { Product, User, Address, Depot, Driver, Route, Order, DeliveryException, AppState } from '../types';

export const seedProducts: Product[] = [
  {
    id: 'p1',
    name: 'Fresh Cow Milk',
    category: 'Milk',
    description: 'Farm fresh raw cow milk, delivered within 12 hours of milking.',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isActive: true,
    qualityInformation: 'Farm to door in under 12 hours',
    packSizes: [
      { size: '500', unit: 'ml', price: 35, availableQuantity: 100 },
      { size: '1', unit: 'L', price: 68, availableQuantity: 100 }
    ],
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'p2',
    name: 'Fresh Buffalo Milk',
    category: 'Milk',
    description: 'Rich and creamy buffalo milk, perfect for making tea, curd, and ghee.',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isActive: true,
    qualityInformation: 'Farm to door in under 12 hours',
    packSizes: [
      { size: '500', unit: 'ml', price: 42, availableQuantity: 100 },
      { size: '1', unit: 'L', price: 82, availableQuantity: 100 }
    ],
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'p3',
    name: 'Farm Fresh Curd',
    category: 'Dairy',
    description: 'Thick, creamy, naturally set curd made from pure buffalo milk.',
    image: 'https://images.unsplash.com/photo-1577903525287-3d3ce6691458?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isActive: true,
    qualityInformation: 'Naturally set, no preservatives',
    packSizes: [
      { size: '400', unit: 'g', price: 45, availableQuantity: 50 },
      { size: '1', unit: 'kg', price: 105, availableQuantity: 50 }
    ],
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'p4',
    name: 'Soft Malai Paneer',
    category: 'Dairy',
    description: 'Fresh, soft, and hygienic malai paneer.',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isActive: true,
    qualityInformation: 'Made fresh daily',
    packSizes: [
      { size: '200', unit: 'g', price: 90, availableQuantity: 40 },
      { size: '500', unit: 'g', price: 210, availableQuantity: 40 }
    ],
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'p5',
    name: 'Pure Desi Ghee',
    category: 'Dairy',
    description: 'Traditional bilona churned pure desi ghee.',
    image: 'https://images.unsplash.com/photo-1648410260751-248c89b7ff9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isActive: true,
    qualityInformation: 'Traditional bilona method',
    packSizes: [
      { size: '250', unit: 'ml', price: 350, availableQuantity: 20 },
      { size: '500', unit: 'ml', price: 680, availableQuantity: 20 }
    ],
    createdAt: '2026-08-01T00:00:00.000Z'
  }
];

export const seedCustomer: User = {
  id: 'u1',
  name: 'Rahul Sharma',
  phone: '9876543210',
  phoneVerified: true,
  role: 'customer',
  walletBalance: 500,
  createdAt: '2026-08-01T00:00:00.000Z'
};

export const seedAddresses: Address[] = [
  {
    id: 'a1',
    houseOrFlat: 'Flat 402, Green Valley Apts',
    street: 'Koramangala 4th Block',
    landmark: 'Near Sony World Signal',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    tag: 'Home',
    isDefault: true
  },
  {
    id: 'a2',
    houseOrFlat: 'Villa 18, Palm Meadows',
    street: 'Whitefield Main Road',
    landmark: 'Near Forum Value Mall',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    tag: 'Work',
    isDefault: false
  }
];

export const seedDepots: Depot[] = [
  {
    id: 'depot-1',
    name: 'Koramangala Main Depot',
    address: '80 Feet Road, Koramangala, Bengaluru',
    latitude: 12.9345,
    longitude: 77.6242,
    serviceZones: ['560034', 'Koramangala', 'HSR Layout'],
    supportedSlots: ['Morning', 'Evening'],
    dailyOrderCapacity: 50,
    currentOrderCount: 12,
    isActive: true
  },
  {
    id: 'depot-2',
    name: 'Indiranagar Operations Hub',
    address: '100 Feet Road, Indiranagar, Bengaluru',
    latitude: 12.9784,
    longitude: 77.6408,
    serviceZones: ['560038', 'Indiranagar', 'Domlur'],
    supportedSlots: ['Morning', 'Evening'],
    dailyOrderCapacity: 40,
    currentOrderCount: 8,
    isActive: true
  },
  {
    id: 'depot-3',
    name: 'Whitefield Distribution Center',
    address: 'ITPL Main Road, Whitefield, Bengaluru',
    latitude: 12.9698,
    longitude: 77.7500,
    serviceZones: ['560066', 'Whitefield', 'Marathahalli'],
    supportedSlots: ['Morning', 'Evening'],
    dailyOrderCapacity: 60,
    currentOrderCount: 15,
    isActive: true
  }
];

export const seedDrivers: Driver[] = [
  {
    id: 'd1',
    name: 'Ramesh Kumar',
    phone: '9812345678',
    phoneVerified: true,
    role: 'driver',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    isActive: true,
    verificationStatus: 'Verified',
    serviceZones: ['560034', 'Koramangala'],
    vehicleId: 'KA-01-MJ-4321',
    currentStatus: 'On Route',
    lastKnownLocation: { lat: 12.9350, lng: 77.6250 },
    lastLocationUpdatedAt: new Date().toISOString(),
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'd2',
    name: 'Suresh Gowda',
    phone: '9823456789',
    phoneVerified: true,
    role: 'driver',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    isActive: true,
    verificationStatus: 'Verified',
    serviceZones: ['560066', 'Whitefield'],
    vehicleId: 'KA-03-HA-8822',
    currentStatus: 'Available',
    lastKnownLocation: { lat: 12.9700, lng: 77.7510 },
    lastLocationUpdatedAt: new Date().toISOString(),
    createdAt: '2026-08-01T00:00:00.000Z'
  }
];

export const seedInitialState: AppState = {
  products: seedProducts,
  orders: [],
  subscriptions: [],
  users: [seedCustomer],
  drivers: seedDrivers,
  depots: seedDepots,
  routes: [],
  exceptions: [],
  auditLogs: [],
  cart: [],
  walletTransactions: [
    {
      id: 'tx-seed-1',
      userId: 'u1',
      type: 'credit',
      amount: 500,
      description: 'Welcome Bonus Milk Pass Credit',
      createdAt: '2026-08-01T00:00:00.000Z'
    }
  ],
  currentUser: seedCustomer,
  savedAddresses: seedAddresses,
  simulatedTimeISO: null,
  isOfflineMode: false,
};
