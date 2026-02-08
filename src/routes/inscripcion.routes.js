import express from 'express';
import { enviarInscripcion } from '../controllers/inscripcion.controller.js';
import { uploadMiddleware, validateImageFiles } from '../middleware/upload.middleware.js';
import { 
  inscripcionValidationRules, 
  validate, 
  sanitizeInscripcionData 
} from '../middleware/validation.middleware.js';

const router = express.Router();

// ============================================
// MIDDLEWARE DE DEBUG
// ============================================

// Middleware para loggear los archivos recibidos por Multer
const logMulterFiles = (req, res, next) => {
  console.log('\n' + '='.repeat(60));
  console.log('📥 NUEVA SOLICITUD DE INSCRIPCIÓN');
  console.log('='.repeat(60));
  console.log('Timestamp:', new Date().toISOString());
  console.log('Body keys:', Object.keys(req.body));
  console.log('Files received by Multer:', req.files ? req.files.length : 0);
  if (req.files && req.files.length > 0) {
    console.log('Files details:');
    req.files.forEach((file, index) => {
      console.log(`  [${index + 1}] ${file.originalname}`);
      console.log(`      Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`      Type: ${file.mimetype}`);
      console.log(`      Path: ${file.path}`);
    });
  }
  console.log('='.repeat(60) + '\n');
  next();
};

// ============================================
// RUTAS DE INSCRIPCIÓN
// ============================================

/**
 * POST /api/inscripcion
 * Envía una nueva solicitud de inscripción
 * 
 * Body (multipart/form-data):
 * - nombre: string (requerido)
 * - apellido: string (requerido)
 * - dni: string (requerido)
 * - fechaNacimiento: date (requerido)
 * - email: email (requerido)
 * - telefono: string (requerido)
 * - pais: string (requerido)
 * - ciudad: string (requerido)
 * - profesion: string (requerido)
 * - formacionSolicitada: string (requerido)
 * - tieneConocimientosPrevios: boolean (opcional)
 * - images: File[] (opcional, máximo 5 archivos de 5MB cada uno)
 */
router.post(
  '/',
  uploadMiddleware,              // 1. Procesar archivos con Multer
  logMulterFiles,                // 2. Debug: Ver qué recibió Multer
  validateImageFiles,            // 3. Validar archivos (magic bytes, etc.)
  sanitizeInscripcionData,       // 4. Sanitizar datos del formulario
  inscripcionValidationRules,    // 5. Reglas de validación
  validate,                      // 6. Ejecutar validación
  enviarInscripcion              // 7. Controlador principal
);

// Ruta de prueba (solo desarrollo)
if (process.env.NODE_ENV === 'development') {
  router.get('/test', (req, res) => {
    res.json({
      success: true,
      message: 'Endpoint de inscripción funcionando',
      info: {
        method: 'POST',
        endpoint: '/api/inscripcion',
        contentType: 'multipart/form-data',
        maxFiles: process.env.MAX_FILES || 5,
        maxFileSize: `${(parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024}MB`,
        allowedFormats: ['JPG', 'JPEG', 'PNG', 'WebP']
      }
    });
  });
}

export default router;
