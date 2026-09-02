export type DeliverySlot = 'Morning' | 'Evening';

export type PackSize = {
  size: string;
  unit: string;
  price: number;
  availableQuantity: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  isActive: boolean;
  qualityInformation: string;
  packSizes: PackSize[];
  createdAt: string;
};

export type CartItem = {
  productId: string;
  productName: string;
  image: string;
  packSize: PackSize;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type Address = {
  id: string;
  houseOrFlat: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  tag: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
};

export type Depot = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  serviceZones: string[]; // List of supported pincodes or zone names
  supportedSlots: DeliverySlot[];
  dailyOrderCapacity: number;
  currentOrderCount: number;
  isActive: boolean;
};

export type DepotAssignment = {
  primaryDepotId: string;
  assignedDepotId?: string;
  assignmentType: 'automatic' | 'manual' | 'fallback';
  assignmentReason?: string;
  assignedAt?: string;
  assignedBy?: string;
};

export type OrderStatus = 
  | 'Placed' 
  | 'Confirmed' 
  | 'Ready for Dispatch' 
  | 'Assigned' 
  | 'Driver En Route' 
  | 'Arrived' 
  | 'Delivered' 
  | 'Cancelled' 
  | 'Failed Delivery' 
  | 'Rescheduled' 
  | 'Returned';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export type PaymentMethod = 'UPI' | 'Card' | 'COD' | 'Wallet' | 'Cash';

export type WalletTransaction = {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  orderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
};

export type Order = {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  address: Address;
  deliveryDate: string; // YYYY-MM-DD
  deliverySlot: DeliverySlot;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  depotAssignment?: DepotAssignment;
  assignedRouteId?: string;
  assignedDriverId?: string;
  createdAt: string;
};

export type SubscriptionStatus = 'Active' | 'Paused' | 'Cancelled';

export type Subscription = {
  id: string;
  userId: string;
  products: CartItem[];
  frequency: 'Daily' | 'Specific Days';
  selectedDays: string[]; // e.g. ['Mon', 'Wed', 'Fri']
  deliverySlot: DeliverySlot;
  startDate: string;
  address: Address;
  status: SubscriptionStatus;
  nextDeliveryDate: string;
  createdAt: string;
};

export type UserRole = 'customer' | 'driver' | 'admin';

export type User = {
  id: string;
  name: string;
  phone: string;
  phoneVerified: boolean;
  email?: string;
  role: UserRole;
  walletBalance?: number;
  createdAt: string;
};

export type DriverStatus = 
  | 'Offline' 
  | 'Available' 
  | 'Shift Started' 
  | 'On Route' 
  | 'At Stop' 
  | 'Paused' 
  | 'Shift Completed';

export type Driver = User & {
  profileImage: string;
  isActive: boolean;
  verificationStatus: string;
  serviceZones: string[];
  vehicleId?: string;
  currentStatus: DriverStatus;
  lastKnownLocation?: { lat: number; lng: number };
  lastLocationUpdatedAt?: string;
};

export type RouteStatus = 
  | 'Draft' 
  | 'Ready for Assignment' 
  | 'Assigned' 
  | 'Published' 
  | 'In Progress' 
  | 'Completed' 
  | 'Paused' 
  | 'Cancelled';

export type RouteStopStatus = 
  | 'Pending' 
  | 'En Route' 
  | 'Arrived' 
  | 'Delivered' 
  | 'Failed' 
  | 'Skipped' 
  | 'Rescheduled';

export type RouteStop = {
  id: string;
  routeId: string;
  orderId: string;
  sequence: number;
  customerId: string;
  address: Address;
  estimatedArrivalTime?: string;
  actualArrivalTime?: string;
  deliveryStatus: RouteStopStatus;
  failureReason?: string;
  driverNotes?: string;
};

export type Route = {
  id: string;
  routeDate: string;
  deliverySlot: DeliverySlot;
  depotId: string;
  zone: string;
  driverId?: string;
  vehicleId?: string;
  stops: RouteStop[];
  status: RouteStatus;
  estimatedDistance?: string;
  estimatedDuration?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryException = {
  id: string;
  orderId: string;
  routeId?: string;
  driverId?: string;
  type: string;
  reason: string;
  description: string;
  photo?: string;
  status: 'Open' | 'Resolved';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

export type AuditLog = {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
};

export type AppState = {
  products: Product[];
  orders: Order[];
  subscriptions: Subscription[];
  users: User[];
  drivers: Driver[];
  depots: Depot[];
  routes: Route[];
  exceptions: DeliveryException[];
  auditLogs: AuditLog[];
  cart: CartItem[];
  walletTransactions: WalletTransaction[];
  currentUser: User | null;
  savedAddresses: Address[];
  simulatedTimeISO: string | null; // null = use real time
  isOfflineMode: boolean;
};

export type PersistedState = {
  version: number;
  data: AppState;
};
