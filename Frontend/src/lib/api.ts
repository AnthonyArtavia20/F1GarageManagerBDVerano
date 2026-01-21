type ApiFetchResult<T> = {
  res: Response;
  data: T;
};

// SOLUCIÓN DIRECTA: Obtiene la IP actual dinámicamente
const getAPIBase = (): string => {
  // 1. Si hay variable de entorno configurada, úsala
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // 2. Por defecto, usa la IP actual del frontend con puerto 9090
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Si accedes por: http://192.168.100.65:5173
    // Backend será: http://192.168.100.65:9090
    return `${protocol}//${hostname}:9090`;
  }
  
  // 3. Fallback por si acaso
  return "http://localhost:9090";
};

const API_BASE = getAPIBase();

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiFetchResult<T>> {
  console.log(`🌐 API Base: ${API_BASE}`); // Para depuración
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
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