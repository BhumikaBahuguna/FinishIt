/**
 * authApi.js — AUTHENTICATION API WRAPPERS
 *
 * Provides simple functions for authentication operations using Supabase Auth.
 * These are called by the AuthProvider to manage user sessions.
 *
 * Functions: signInWithPassword, signOut, getSession, subscribeToAuthChanges
 */

import { supabase } from "./client";

/** Throws an error if Supabase is not configured (protects against null client) */
function getClientOrThrow() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }

  return supabase;
}

/** Sign in a user with email and password. Returns { data, error }. */
export async function signInWithPassword({ email, password }) {
  const client = getClientOrThrow();
  return client.auth.signInWithPassword({ email, password });
}

/** Sign out the current user. Clears the session. */
export async function signOut() {
  const client = getClientOrThrow();
  return client.auth.signOut();
}

/** Get the current active session (checks if user is still logged in). */
export async function getSession() {
  const client = getClientOrThrow();
  return client.auth.getSession();
}

/** Subscribe to auth state changes (login, logout, token refresh).
 *  The callback receives the new session whenever auth state changes. */
export function subscribeToAuthChanges(callback) {
  const client = getClientOrThrow();
  return client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
