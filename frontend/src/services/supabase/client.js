/**
 * client.js — SUPABASE CLIENT INITIALIZATION
 *
 * This file creates the Supabase client used throughout the entire application.
 * Supabase acts as both our database (PostgreSQL) and authentication provider.
 *
 * The client needs two environment variables (set in .env file):
 *   - VITE_SUPABASE_URL: Your Supabase project URL
 *   - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous/public API key
 *
 * If these are missing, the app runs in "unconfigured" mode (no data features).
 */

import { createClient } from "@supabase/supabase-js";

// Read Supabase credentials from environment variables (defined in .env file)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured (both URL and key must be present)
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create the Supabase client instance (or null if not configured)
// This single instance is shared by all service files (tasksApi, habitsApi, etc.)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,      // Keep user logged in across page refreshes
        autoRefreshToken: true,     // Automatically renew expired tokens
        detectSessionInUrl: true    // Handle OAuth redirects
      }
    })
  : null;
