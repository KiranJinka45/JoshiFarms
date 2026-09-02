import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, Order, Subscription, User, Address, Driver, Depot, Route, 
  DeliveryException, CartItem, UserRole, AuditLog, AppState 
} from '../types';
import { seedInitialState } from '../data/seedData';
import { loadPersistedState, savePersistedState, clearPersistedState } from '../domain/storage';
import { assignDepotForOrder, overrideDepotAssignment } from '../domain/depotAssignment';

import { api } from '../services/api';

interface StoreContextType extends AppState {
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, packSize: string) => void;
  updateCartQuantity: (productId: string, packSize: string, quantity: number) => void;
  clearCart: () => void;
  addOrder: (order: Order) => Order;
  updateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
  reassignOrderDepot: (orderId: string, newDepotId: string, reason: string, adminId: string) => void;
  addSubscription: (sub: Subscription) => void;
  addAddress: (address: Address) => void;
  setCurrentUserRole: (role: UserRole) => void;
  setSimulatedTime: (isoString: string | null) => void;
  setIsOfflineMode: (offline: boolean) => void;
  resetPrototypeData: () => void;
  seedUnassignedOrderException: () => void;
  seedFailedDeliveryException: () => void;
  createRoute: (depotId: string, driverId: string, slot: 'Morning' | 'Evening', orderIds: string[]) => void;
  topUpWallet: (amount: number, description?: string, paymentId?: string) => void;
  deductWallet: (amount: number, description?: string, orderId?: string) => boolean;
  requestOTP: (email: string) => Promise<{ success: boolean; devOtp?: string; error?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadPersistedState(seedInitialState));


  // Sync to versioned LocalStorage on state update
  useEffect(() => {
    savePersistedState(state);
  }, [state]);

  const addToCart = (item: CartItem) => {
    setState(prev => {
      const existing = prev.cart.find(i => i.productId === item.productId && i.packSize.size === item.packSize.size);
      let updatedCart: CartItem[];
      if (existing) {
        updatedCart = prev.cart.map(i => 
          i.productId === item.productId && i.packSize.size === item.packSize.size
            ? { ...i, quantity: i.quantity + item.quantity, totalPrice: (i.quantity + item.quantity) * i.unitPrice }
            : i
        );
      } else {
        updatedCart = [...prev.cart, item];
      }
      return { ...prev, cart: updatedCart };
    });
  };

  const removeFromCart = (productId: string, packSize: string) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.filter(i => !(i.productId === productId && i.packSize.size === packSize))
    }));
  };

  const updateCartQuantity = (productId: string, packSize: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, packSize);
      return;
    }
    setState(prev => ({
      ...prev,
      cart: prev.cart.map(i => 
        i.productId === productId && i.packSize.size === packSize
          ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
          : i
      )
    }));
  };

  const clearCart = () => setState(prev => ({ ...prev, cart: [] }));

  const setCart = (action: React.SetStateAction<CartItem[]>) => {
    setState(prev => ({
      ...prev,
      cart: typeof action === 'function' ? action(prev.cart) : action
    }));
  };

  const addOrder = (order: Order): Order => {
    // Run deterministic multi-depot assignment
    const depotResult = assignDepotForOrder(order.address, order.deliverySlot, state.depots);
    
    const enrichedOrder: Order = {
      ...order,
      depotAssignment: depotResult.assignment,
    };

    setState(prev => {
      // Update depot order count if assigned
      let updatedDepots = prev.depots;
      if (depotResult.selectedDepot) {
        updatedDepots = prev.depots.map(d => 
          d.id === depotResult.selectedDepot!.id 
            ? { ...d, currentOrderCount: d.currentOrderCount + 1 }
            : d
        );
      }

      // If assignment failed, create an unassigned order exception
      let updatedExceptions = prev.exceptions;
      if (!depotResult.success) {
        const newException: DeliveryException = {
          id: `EXC-${Math.floor(100000 + Math.random() * 900000)}`,
          orderId: order.id,
          type: 'Depot Assignment Failure',
          reason: depotResult.reason,
          description: `No eligible depot available for ${order.address.pincode} (${order.deliverySlot} slot)`,
          status: 'Open',
          createdAt: new Date().toISOString()
        };
        updatedExceptions = [newException, ...prev.exceptions];
      }

      return {
        ...prev,
        orders: [enrichedOrder, ...prev.orders],
        depots: updatedDepots,
        exceptions: updatedExceptions,
      };
    });

    return enrichedOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === orderId ? { ...o, orderStatus: status } : o)
    }));
  };

  const reassignOrderDepot = (orderId: string, newDepotId: string, reason: string, adminId: string) => {
    setState(prev => {
      const order = prev.orders.find(o => o.id === orderId);
      if (!order || !order.depotAssignment) return prev;

      const updatedAssignment = overrideDepotAssignment(order.depotAssignment, newDepotId, reason, adminId);
      
      const newAuditLog: AuditLog = {
        id: `AUD-${Math.floor(100000 + Math.random() * 900000)}`,
        actorId: adminId,
        actorRole: 'admin',
        action: 'DEPOT_REASSIGNMENT_OVERRIDE',
        entityType: 'Order',
        entityId: orderId,
        previousValue: order.depotAssignment.assignedDepotId,
        newValue: newDepotId,
        createdAt: new Date().toISOString()
      };

      return {
        ...prev,
        orders: prev.orders.map(o => o.id === orderId ? { ...o, depotAssignment: updatedAssignment } : o),
        auditLogs: [newAuditLog, ...prev.auditLogs]
      };
    });
  };

  const addSubscription = (sub: Subscription) => {
    setState(prev => ({
      ...prev,
      subscriptions: [sub, ...prev.subscriptions]
    }));
  };

  const addAddress = (address: Address) => {
    setState(prev => ({
      ...prev,
      savedAddresses: [...prev.savedAddresses, address]
    }));
  };

  const setCurrentUserRole = (role: UserRole) => {
    setState(prev => {
      let targetUser = prev.currentUser;
      if (role === 'customer') {
        targetUser = prev.users.find(u => u.role === 'customer') || prev.currentUser;
      } else if (role === 'driver') {
        targetUser = prev.drivers.find(d => d.role === 'driver') || prev.currentUser;
      } else {
        targetUser = {
          id: 'admin-1',
          name: 'Dispatcher Admin',
          phone: '9999999999',
          phoneVerified: true,
          role: 'admin',
          createdAt: new Date().toISOString()
        };
      }
      return { ...prev, currentUser: targetUser };
    });
  };

  const setSimulatedTime = (isoString: string | null) => {
    setState(prev => ({ ...prev, simulatedTimeISO: isoString }));
  };

  const setIsOfflineMode = (offline: boolean) => {
    setState(prev => ({ ...prev, isOfflineMode: offline }));
  };

  const resetPrototypeData = () => {
    clearPersistedState();
    setState(seedInitialState);
  };

  const seedUnassignedOrderException = () => {
    const unassignedOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const mockUnassignedOrder: Order = {
      id: unassignedOrderId,
      userId: state.currentUser?.id || 'u1',
      items: [
        {
          productId: 'p1',
          productName: 'Fresh Cow Milk',
          image: state.products[0].image,
          packSize: state.products[0].packSizes[1],
          quantity: 2,
          unitPrice: 68,
          totalPrice: 136
        }
      ],
      subtotal: 136,
      deliveryFee: 0,
      discount: 0,
      total: 136,
      address: {
        id: 'a99',
        houseOrFlat: 'Plot 99, Remote Sector',
        street: 'Outer Ring Road Pincode Boundary',
        landmark: 'Near Highway Toll',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560099', // Out of normal depot zone
        tag: 'Home',
        isDefault: false
      },
      deliveryDate: new Date().toISOString().split('T')[0],
      deliverySlot: 'Morning',
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      orderStatus: 'Placed',
      depotAssignment: {
        primaryDepotId: 'depot-1',
        assignmentType: 'fallback',
        assignmentReason: 'Out of standard depot service zone'
      },
      createdAt: new Date().toISOString()
    };

    const exception: DeliveryException = {
      id: `EXC-${Math.floor(100000 + Math.random() * 900000)}`,
      orderId: unassignedOrderId,
      type: 'Depot Assignment Failure',
      reason: 'No eligible depot serving pincode 560099',
      description: 'Order placed for remote pincode 560099 without an active depot zone match.',
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      orders: [mockUnassignedOrder, ...prev.orders],
      exceptions: [exception, ...prev.exceptions]
    }));
  };

  const seedFailedDeliveryException = () => {
    const failedOrderId = `ORD-FAIL-${Math.floor(100000 + Math.random() * 900000)}`;
    const exception: DeliveryException = {
      id: `EXC-${Math.floor(100000 + Math.random() * 900000)}`,
      orderId: failedOrderId,
      driverId: 'd1',
      type: 'Failed Delivery',
      reason: 'Customer Unavailable',
      description: 'Door locked, customer did not answer 3 phone calls at doorstep.',
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      exceptions: [exception, ...prev.exceptions]
    }));
  };

  const createRoute = (depotId: string, driverId: string, slot: 'Morning' | 'Evening', orderIds: string[]) => {
    const newRoute: Route = {
      id: `RT-${Math.floor(1000 + Math.random() * 9000)}`,
      routeDate: new Date().toISOString().split('T')[0],
      deliverySlot: slot,
      depotId,
      zone: 'Koramangala Zone',
      driverId,
      stops: orderIds.map((orderId, idx) => {
        const order = state.orders.find(o => o.id === orderId);
        return {
          id: `stp-${idx + 1}`,
          routeId: '',
          orderId,
          sequence: idx + 1,
          customerId: order?.userId || 'u1',
          address: order?.address || state.savedAddresses[0],
          deliveryStatus: 'Pending'
        };
      }),
      status: 'Assigned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      routes: [newRoute, ...prev.routes],
      orders: prev.orders.map(o => orderIds.includes(o.id) ? { ...o, orderStatus: 'Assigned', assignedDriverId: driverId } : o)
    }));
  };

  const requestOTP = async (email: string) => {
    const res = await api.post<{ status: string; email: string; dev_otp?: string }>('/auth/otp/request', {
      email: email.trim().toLowerCase(),
      purpose: 'login',
    });
    if (res.error) {
      return { success: false, error: res.error };
    }
    return { success: true, devOtp: res.data?.dev_otp };
  };

  const verifyOTP = async (email: string, otp: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const res = await api.post<{
      access_token: string;
      role: string;
      user_id: string;
      name?: string;
      email?: string;
    }>('/auth/otp/verify', {
      email: normalizedEmail,
      otp,
    });

    if (res.error) {
      return { success: false, error: res.error };
    }

    let token = res.data?.access_token || `dev_token_${Date.now()}`;
    let mappedRole: UserRole = 'customer';
    let userId = res.data?.user_id || 'u-customer-001';
    let name = res.data?.name || 'Kiran Joshi';

    if (res.data?.role === 'ROLE_DRIVER' || normalizedEmail === 'driver@joshidairy.com') mappedRole = 'driver';
    if (res.data?.role === 'ROLE_ADMIN' || normalizedEmail === 'admin@joshidairy.com') mappedRole = 'admin';

    localStorage.setItem('ffd_auth_token', token);

    const newUser: User = {
      id: userId,
      name,
      email: res.data?.email || normalizedEmail,
      phone: '+919876543210',
      phoneVerified: false,
      role: mappedRole,
      walletBalance: 500,
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      currentUser: newUser,
    }));

    return { success: true, role: mappedRole };
  };

  const topUpWallet = (amount: number, description: string = 'Wallet Top-Up via Razorpay', paymentId?: string) => {
    setState(prev => {
      const currentBalance = prev.currentUser?.walletBalance ?? 0;
      const updatedBalance = currentBalance + amount;
      const tx = {
        id: `tx-${Date.now()}`,
        userId: prev.currentUser?.id || 'u1',
        type: 'credit' as const,
        amount,
        description,
        razorpayPaymentId: paymentId,
        createdAt: new Date().toISOString()
      };

      return {
        ...prev,
        walletTransactions: [tx, ...(prev.walletTransactions || [])],
        currentUser: prev.currentUser ? { ...prev.currentUser, walletBalance: updatedBalance } : null,
        users: prev.users.map(u => u.id === prev.currentUser?.id ? { ...u, walletBalance: updatedBalance } : u)
      };
    });
  };

  const deductWallet = (amount: number, description: string = 'Milk Order Payment', orderId?: string): boolean => {
    let success = false;
    setState(prev => {
      const currentBalance = prev.currentUser?.walletBalance ?? 0;
      if (currentBalance < amount) {
        success = false;
        return prev;
      }
      success = true;
      const updatedBalance = currentBalance - amount;
      const tx = {
        id: `tx-${Date.now()}`,
        userId: prev.currentUser?.id || 'u1',
        type: 'debit' as const,
        amount,
        description,
        orderId,
        createdAt: new Date().toISOString()
      };

      return {
        ...prev,
        walletTransactions: [tx, ...(prev.walletTransactions || [])],
        currentUser: prev.currentUser ? { ...prev.currentUser, walletBalance: updatedBalance } : null,
        users: prev.users.map(u => u.id === prev.currentUser?.id ? { ...u, walletBalance: updatedBalance } : u)
      };
    });
    return success;
  };

  const logout = () => {
    localStorage.removeItem('ffd_auth_token');
    setState(prev => ({
      ...prev,
      currentUser: null,
    }));
  };

  return (
    <StoreContext.Provider value={{
      ...state,
      setCart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      addOrder,
      updateOrderStatus,
      reassignOrderDepot,
      addSubscription,
      addAddress,
      setCurrentUserRole,
      setSimulatedTime,
      setIsOfflineMode,
      resetPrototypeData,
      seedUnassignedOrderException,
      seedFailedDeliveryException,
      createRoute,
      topUpWallet,
      deductWallet,
      requestOTP,
      verifyOTP,
      logout
    }}>
      {children}
    </StoreContext.Provider>
  );
};


export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
