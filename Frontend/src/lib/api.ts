type ApiFetchResult<T = any> = {  // <-- Añadir valor por defecto
  res: Response;
  data: T;
};

// OBTENER LA URL BASE DE MANERA CONSISTENTE
const getAPIBase = (): string => {
  // 1. Variable de entorno (más confiable)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Si estamos en el navegador, usar la misma IP del frontend
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    
    // Si el frontend corre en 8080, backend en 9090
    const backendPort = '9090';
    
    // Construir URL del backend basado en la IP del frontend
    return `${protocol}//${hostname}:${backendPort}`;
  }
  
  // 3. Fallback
  return "http://localhost:9090";
};

const API_BASE = getAPIBase();

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiFetchResult<T>> {
  console.log(`🌐 [apiFetch] ${options.method || 'GET'} ${API_BASE}${path}`);
  
  const defaultOptions: RequestInit = {
    credentials: "include" as RequestCredentials, // <-- Cast explícito
    headers: {
      "Content-Type": "application/json",
    },
  };
  
  // Merge options más seguro
  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    // Sobrescribir credentials para asegurar que sea 'include'
    credentials: "include" as RequestCredentials,
    // Merge headers manualmente
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, mergedOptions);
    
    console.log(`🌐 [apiFetch] Response: ${res.status} ${res.statusText}`);
    
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // Usar 'as T' para satisfacer TypeScript
      data = { success: false, message: "Invalid JSON response" } as T;
    }

    return { res, data } as ApiFetchResult<T>;
  } catch (error: any) {
    console.error('❌ [apiFetch] Network error:', error);
    
    // Crear una respuesta fallback tipada
    return {
      res: new Response(null, { status: 0, statusText: 'Network Error' }),
      data: { success: false, message: 'Network error: ' + error.message } as T
    } as ApiFetchResult<T>;
  }
}

// Exportar la URL base para usar en otros componentes
export { API_BASE };