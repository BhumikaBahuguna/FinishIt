import { useEffect, useMemo, useState } from "react";
import {
  getSession,
  signInWithPassword,
  signOut,
  subscribeToAuthChanges
} from "../../../services/supabase/authApi";
import { isSupabaseConfigured } from "../../../services/supabase/client";
import { ensureUserProfile } from "../services/userProfileApi";
import { AuthContext } from "../context/AuthContext";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileReady, setIsProfileReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      setIsProfileReady(true);
      return undefined;
    }

    let isMounted = true;

    getSession()
      .then(async ({ data }) => {
        if (!isMounted) return;

        if (data.session?.user?.id) {
          const { error } = await ensureUserProfile(data.session.user);

          if (error) {
            console.error("Unable to synchronize user profile.", error.message);
          }
        }

        setSession(data.session ?? null);
        setIsProfileReady(true);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription }
    } = subscribeToAuthChanges(async (nextSession) => {
      if (nextSession?.user?.id) {
        setIsProfileReady(false);
        const { error } = await ensureUserProfile(nextSession.user);

        if (error) {
          console.error("Unable to synchronize user profile.", error.message);
        }
      }

      setSession(nextSession ?? null);
      setIsProfileReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isProfileReady,
      isSupabaseConfigured,
      signInWithPassword,
      signOut
    }),
    [isLoading, isProfileReady, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
