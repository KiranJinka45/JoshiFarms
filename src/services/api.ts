const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('ffd_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const status = response.status;
    if (status === 204) {
      return { status };
    }

    const data = await response.json();
    if (!response.ok) {
      return {
        status,
        error: data.detail || 'An unexpected error occurred.',
      };
    }

    return { status, data };
  } catch (err: any) {
    const isNetworkError = err?.message?.includes('fetch') || err?.name === 'TypeError';
    return {
      status: 500,
      error: isNetworkError
        ? 'Cannot connect to backend server at http://localhost:8000. Is the FastAPI server running?'
        : (err.message || 'Network connection failed.'),
    };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body?: any) => request<T>(endpoint, 'POST', body),
  put: <T>(endpoint: string, body?: any) => request<T>(endpoint, 'PUT', body),
  delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
};
