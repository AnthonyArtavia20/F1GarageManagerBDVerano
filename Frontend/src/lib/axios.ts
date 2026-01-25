import axios from 'axios';

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

const axiosInstance = axios.create({
  baseURL: `${API_BASE}/api`, // Add /api prefix for all routes
  withCredentials: true, // Incluir cookies en las peticiones
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging (opcional)
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`🌐 [axios] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('🚨 [axios] Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejo de respuestas
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 [axios] Error en response:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
