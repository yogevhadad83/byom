import { useSyncExternalStore } from 'react';
import { api, ApiError } from '../lib/api';
import type { ProviderName, ProviderConfig, ProviderResponse } from '../types';

type ProviderState = {
  connected: boolean;
  provider?: ProviderName;
  maskedConfig?: ProviderConfig | null;
  loading: boolean;
  error: string | null;
};

let state: ProviderState = {
  connected: false,
  provider: undefined,
  maskedConfig: null,
  loading: false,
  error: null,
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function getProvider() {
  return state;
}

export function subscribeProvider(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProvider() {
  return useSyncExternalStore(subscribeProvider, () => getProvider());
}

function setState(partial: Partial<ProviderState>) {
  state = { ...state, ...partial };
  emit();
}

function applyResponse(resp: ProviderResponse | undefined) {
  if (resp?.provider?.provider) {
    setState({
      connected: true,
      provider: resp.provider.provider,
      maskedConfig: resp.provider.config ?? null,
      error: null,
    });
  } else {
    // No provider in response means not connected
    setState({ connected: false, provider: undefined, maskedConfig: null, error: null });
  }
}

export async function bootstrapProvider() {
  try {
    setState({ loading: true, error: null });
    const resp = await api.get<ProviderResponse | undefined>('/provider');
    applyResponse(resp);
  } catch (e: any) {
    // If 404, not connected; leave disconnected state
    if (e instanceof ApiError && e.status === 404) {
      setState({ connected: false, provider: undefined, maskedConfig: null, error: null });
    } else {
      const msg = String(e?.message || e);
      setState({ error: msg });
    }
  } finally {
    setState({ loading: false });
  }
}

export async function registerProvider(payload: {
  provider: ProviderName;
  config: ProviderConfig;
}) {
  setState({ loading: true, error: null });
  try {
    await api.post('/register-provider', payload);
    // Read back to get masked values
    const resp = await api.get<ProviderResponse>('/provider');
    applyResponse(resp);
  } catch (e: any) {
    const msg = e?.message || 'Failed to register provider';
    setState({ error: String(msg) });
    throw e;
  } finally {
    setState({ loading: false });
  }
}

export async function disconnectProvider() {
  setState({ loading: true, error: null });
  try {
    await api.del('/provider');
    setState({ connected: false, provider: undefined, maskedConfig: null });
  } catch (e: any) {
    const msg = e?.message || 'Failed to disconnect provider';
    setState({ error: String(msg) });
    throw e;
  } finally {
    setState({ loading: false });
  }
}

// Local-only reset, used on sign-out to avoid stale connected UI without
// deleting the server-side registration.
export function clearProviderLocal() {
  setState({ connected: false, provider: undefined, maskedConfig: null, error: null });
}
