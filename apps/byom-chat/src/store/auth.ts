import { useSyncExternalStore } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Simple reactive-ish store using a subscription pattern
export type AuthState = {
  session: Session | null;
  user: User | null;
  accessToken: string | null;
  // When true, trigger login modal due to 401
  unauthorized: boolean;
};

let state: AuthState = {
  session: null,
  user: null,
  accessToken: null,
  unauthorized: false,
};

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function getAuth() {
  return state;
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Initialize: read current session and subscribe to changes
(async () => {
  const { data } = await supabase.auth.getSession();
  state = {
    session: data.session ?? null,
    user: data.session?.user ?? null,
    accessToken: data.session?.access_token ?? null,
    unauthorized: false,
  };
  emit();
  supabase.auth.onAuthStateChange((_evt, session) => {
    state = {
      session: session ?? null,
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
      unauthorized: false,
    };
    emit();
  });
})();

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function useAuth() {
  return useSyncExternalStore(subscribeAuth, () => getAuth());
}

export function getAccessToken() {
  return state.accessToken ?? null;
}

export function getAuthHeader(): { Authorization: string } | {} {
  return state.accessToken ? { Authorization: `Bearer ${state.accessToken}` } : {};
}

// Called by API client on 401 to sign out and prompt login
export async function handleUnauthorized() {
  try {
    await supabase.auth.signOut();
  } catch {}
  state = { ...state, session: null, user: null, accessToken: null, unauthorized: true };
  emit();
}

export function consumeUnauthorizedFlag() {
  if (state.unauthorized) {
    state = { ...state, unauthorized: false };
    emit();
  }
}
