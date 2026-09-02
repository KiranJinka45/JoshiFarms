import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../../services/api';

// Create a mock localStorage implementation for Node test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock
  });
}

describe('Frontend API Client (api.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include Authorization Bearer token header when token is stored', async () => {
    localStorage.setItem('ffd_auth_token', 'test-jwt-bearer-token');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'healthy' }), { status: 200 })
    );

    const res = await api.get('/health');

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/health',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-jwt-bearer-token'
        })
      })
    );
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'healthy' });
  });

  it('should handle API 409 conflict responses cleanly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ detail: 'Booking has closed for this slot.' }),
        { status: 409 }
      )
    );

    const res = await api.post('/orders', { slot_id: 1 });

    expect(res.status).toBe(409);
    expect(res.error).toBe('Booking has closed for this slot.');
  });

  it('should handle network connection failure gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Failed to fetch'));

    const res = await api.get('/delivery-slots/availability');

    expect(res.status).toBe(500);
    expect(res.error).toContain('Cannot connect to backend server');
  });
});
