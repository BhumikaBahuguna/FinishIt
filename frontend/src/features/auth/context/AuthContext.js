/**
 * AuthContext.js — AUTH CONTEXT DEFINITION
 *
 * Creates a React Context that holds authentication state (session, user, etc.).
 * AuthProvider fills this context; useAuth() reads from it.
 */

import { createContext } from "react";

export const AuthContext = createContext(null);
