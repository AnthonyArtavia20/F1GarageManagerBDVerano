// src/lib/api.ts
type ApiFetchResult<T> = {
  res: Response;
  data: T;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:9090";

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiFetchResult<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    // 🔥 ESTO ES CLAVE para que se guarde / envíe la cookie connect.sid
    credentials: "include",
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = { success: false, message: "Invalid JSON response" };
  }

  return { res, data };
}
