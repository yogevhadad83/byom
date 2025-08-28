import { getAuthHeader, handleUnauthorized } from '../store/auth';

// Base URL for BYOM API. Use Vite env var, allow '/api' for dev proxy.
const BASE_URL: string = (import.meta as any).env?.VITE_BYOM_API_BASE || '/api';

type Json = any;

export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

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
  let parsed: any = undefined;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }
  if (res.status === 401) {
    // Force sign-out and notify UI to show login modal.
    await handleUnauthorized();
    throw new ApiError('Unauthorized. Please sign in again.', 401, parsed);
  }
  if (!res.ok) {
    const errMsg = (parsed as any)?.error || text || res.statusText;
    throw new ApiError(String(errMsg), res.status, parsed);
  }
  return parsed as T;
}

export const api = {
  get: <T = Json>(path: string) => request<T>('GET', path),
  post: <T = Json>(path: string, body?: unknown) => request<T>('POST', path, body),
  del: <T = Json>(path: string) => request<T>('DELETE', path),
  baseUrl: BASE_URL,
};
