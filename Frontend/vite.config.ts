import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",  // Mejor que "::" para compatibilidad
    port: 8080,
    strictPort: true,  // Fuerza el puerto 8080
    cors: true,        // Habilita CORS en dev server de Vite
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Define variables de entorno
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://192.168.100.65:9090')
  }
});