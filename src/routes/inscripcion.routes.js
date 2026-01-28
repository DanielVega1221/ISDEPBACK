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
  validateImageFiles,            // 2. Validar archivos (magic bytes, etc.)
  sanitizeInscripcionData,       // 3. Sanitizar datos del formulario
  inscripcionValidationRules,    // 4. Reglas de validación
  validate,                      // 5. Ejecutar validación
  enviarInscripcion              // 6. Controlador principal
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
