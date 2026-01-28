import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import inscripcionRoutes from './routes/inscripcion.routes.js';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE DE SEGURIDAD
// ============================================

// Helmet - Headers de seguridad HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS - Configuración estricta
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como Postman) en desarrollo
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting - Protección contra ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 solicitudes por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP. Por favor, intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip en desarrollo para facilitar testing
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '::1'
});

// Body parser con límites estrictos
app.use(express.json({ limit: '100kb' })); // Solo JSON pequeños
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ============================================
// RUTAS
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ISDEP Backend API está funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Aplicar rate limiting solo a rutas de inscripción
app.use('/api/inscripcion', limiter, inscripcionRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Error de CORS
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acceso no permitido desde este origen'
    });
  }

  // Error de Multer (archivos)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'El archivo es demasiado grande. Máximo 5MB por imagen.'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Demasiados archivos. Máximo 5 imágenes permitidas.'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Nombre de campo incorrecto para el archivo.'
    });
  }

  // Errores de validación
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'JSON mal formateado'
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🎓 ISDEP Backend API                 ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║   🚀 Servidor corriendo en puerto ${PORT}  ║`);
  console.log(`║   🌍 Entorno: ${process.env.NODE_ENV || 'development'}           ║`);
  console.log(`║   📧 Resend API: ${process.env.RESEND_API_KEY ? '✓ Configurado' : '✗ No configurado'}    ║`);
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n🔗 Health check: http://localhost:${PORT}/health\n`);
});

export default app;
