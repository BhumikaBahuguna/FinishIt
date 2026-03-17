import { supabase } from "./client";

function getClientOrThrow() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  return supabase;
}

export async function signInWithPassword({ email, password }) {
  const client = getClientOrThrow();
  return client.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const client = getClientOrThrow();
  return client.auth.signOut();
}

export async function getSession() {
  const client = getClientOrThrow();
  return client.auth.getSession();
}

export function subscribeToAuthChanges(callback) {
  const client = getClientOrThrow();
  return client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
