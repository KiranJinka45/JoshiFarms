import { AppState, PersistedState } from '../types';

export const CURRENT_STORAGE_VERSION = 1;
export const STORAGE_KEY = 'farmFreshDairyState_v1';

export function loadPersistedState(defaultState: AppState): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    const parsed: PersistedState = JSON.parse(raw);

    if (typeof parsed !== 'object' || parsed === null || !parsed.version) {
      console.warn('Invalid storage format, falling back to default seed data');
      return defaultState;
    }

    if (parsed.version !== CURRENT_STORAGE_VERSION) {
      console.info(`Migrating state from version ${parsed.version} to ${CURRENT_STORAGE_VERSION}`);
      // Migration hooks can be added here if version increases
    }

    return {
      ...defaultState,
      ...parsed.data,
      // Ensure arrays exist
      products: parsed.data.products || defaultState.products,
      orders: parsed.data.orders || defaultState.orders,
      subscriptions: parsed.data.subscriptions || defaultState.subscriptions,
      users: parsed.data.users || defaultState.users,
      drivers: parsed.data.drivers || defaultState.drivers,
      depots: parsed.data.depots || defaultState.depots,
      routes: parsed.data.routes || defaultState.routes,
      exceptions: parsed.data.exceptions || defaultState.exceptions,
      auditLogs: parsed.data.auditLogs || defaultState.auditLogs,
      cart: parsed.data.cart || defaultState.cart,
      currentUser: parsed.data.currentUser || defaultState.currentUser,
      savedAddresses: parsed.data.savedAddresses || defaultState.savedAddresses,
      simulatedTimeISO: parsed.data.simulatedTimeISO || (typeof window !== 'undefined' ? localStorage.getItem('prototypeCurrentTime') : null),
      isOfflineMode: parsed.data.isOfflineMode || false,
    };
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return defaultState;
  }
}

export function savePersistedState(state: AppState): void {
  try {
    const payload: PersistedState = {
      version: CURRENT_STORAGE_VERSION,
      data: state,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear state from localStorage:', error);
  }
}
