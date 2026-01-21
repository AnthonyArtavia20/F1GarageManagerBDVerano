const cors = require('cors');

// Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080', 
  'http://localhost:9090',
  'http://192.168.100.65:5173',
  'http://192.168.100.65:8080',
  'http://192.168.100.65:9090',
  // Agrega tu variable de entorno también
  process.env.FRONTEND_URL
].filter(Boolean); // Filtra valores undefined

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origen
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si el origen está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('❌ CORS bloqueado para origen:', origin);
    console.log('✅ Orígenes permitidos:', allowedOrigins);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;