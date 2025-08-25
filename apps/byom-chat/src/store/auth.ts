import { useSyncExternalStore } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Simple reactive-ish store using a subscription pattern
export type AuthState = {
  session: Session | null;
  user: User | null;
};

let state: AuthState = {
  session: null,
  user: null,
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
  state = { session: data.session ?? null, user: data.session?.user ?? null };
  emit();
  supabase.auth.onAuthStateChange((_evt, session) => {
    state = { session: session ?? null, user: session?.user ?? null };
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
