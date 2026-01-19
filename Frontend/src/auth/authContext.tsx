// src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

export type UserRole = "admin" | "engineer" | "driver" | null;

export type SessionUser = {
  id: number;
  username: string;
  role: UserRole;
};

type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { res, data } = await apiFetch<{ success: boolean; user?: SessionUser; message?: string }>(
      "/api/auth/me",
      { method: "GET" }
    );

    if (res.ok && data?.success && data.user) setUser(data.user);
    else setUser(null);

    setLoading(false);
  };

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(() => ({ user, loading, refresh, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
