import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "../types/user";
import { AuthContext } from "./AuthContextBase";
import type { AuthContextValue } from "./AuthContextBase";
import {
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
  getSession,
} from "../services/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getSession();
        if (!active) return;
        setUser(res.user);
      } catch {
        if (!active) return;
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const signup = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      email: string;
      password: string;
    }) => {
      const res = await apiSignup(data);
      return res.message;
    },
    []
  );

  const value: AuthContextValue = useMemo(
    () => ({ user, isAuthenticated: !!user, loading, login, logout, signup }),
    [user, loading, login, logout, signup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
