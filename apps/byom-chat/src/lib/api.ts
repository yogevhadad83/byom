import { getAuthHeader, handleUnauthorized } from '../store/auth';

// Base URL for BYOM API. Use Vite env var, allow '/api' for dev proxy.
const BASE_URL: string = (import.meta as any).env?.VITE_BYOM_API_BASE || '/api';

type Json = any;

async function request<T = Json>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  // Attempt to parse JSON for errors or success.
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  if (res.status === 401) {
    // Force sign-out and notify UI to show login modal.
    handleUnauthorized();
    throw new Error('Unauthorized. Please sign in again.');
  }
  if (!res.ok) {
    const errMsg = (data as any)?.error || text || res.statusText;
    throw new Error(errMsg);
  }
  return data;
}

export const api = {
  get: <T = Json>(path: string) => request<T>('GET', path),
  post: <T = Json>(path: string, body?: unknown) => request<T>('POST', path, body),
  del: <T = Json>(path: string) => request<T>('DELETE', path),
  baseUrl: BASE_URL,
};

