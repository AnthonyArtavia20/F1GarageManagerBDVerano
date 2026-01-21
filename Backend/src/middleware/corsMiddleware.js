const cors = require('cors');

// CONFIGURACIÓN PERMISIVA PARA DESARROLLO
const corsOptions = {
  origin: function (origin, callback) {
    // EN DESARROLLO: PERMITE ABSOLUTAMENTE TODO (incluyendo null/undefined)
    if (process.env.NODE_ENV !== 'production') {
      // Log para debug
      console.log(`🌐 [CORS] Desarrollo - Origen recibido: ${origin || '(no-origin/null)'}`);
      
      // Permite TODO en desarrollo
      return callback(null, true);
    }
    
    // EN PRODUCCIÓN: Solo orígenes específicos
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://tudominio.com'
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log(`🚫 [CORS] Producción - Bloqueando origen: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
    
    // Por defecto, permitir
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'Set-Cookie'],
  exposedHeaders: ['set-cookie', 'Set-Cookie'],
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);