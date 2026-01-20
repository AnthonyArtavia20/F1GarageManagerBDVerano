// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type SessionUser = {
  id: number;
  username: string;
  role: "admin" | "engineer" | "driver" | "none";
};

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { res, data } = await apiFetch("/api/auth/me", { method: "GET" });
    if (res.ok && data.success) setUser(data.user);
    else setUser(null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return { user, loading, refresh, setUser };
}
