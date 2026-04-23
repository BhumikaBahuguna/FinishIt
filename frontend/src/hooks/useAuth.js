/**
 * useAuth.js — AUTHENTICATION HOOK
 *
 * Custom React hook that gives any component access to auth state.
 * Usage: const { user, session, signInWithPassword, signOut } = useAuth();
 * Must be used inside a component wrapped by AuthProvider.
 */

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
