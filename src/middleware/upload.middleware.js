import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================

// Usar memoryStorage en lugar de diskStorage para evitar problemas con sistemas de archivos efímeros (Render, Heroku, etc.)
const storage = multer.memoryStorage();

// Límites de archivos
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB por defecto
  files: parseInt(process.env.MAX_FILES) || 5 // 5 archivos máximo
};

// Filtro de archivos - Primera validación (por extensión)
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Formato no permitido: ${file.mimetype}. Solo se permiten JPG, PNG y WebP.`), false);
  }
};

const upload = multer({
  storage,
  limits,
  fileFilter
});

// ============================================
// MIDDLEWARE DE VALIDACIÓN AVANZADA
// ============================================

/**
 * Verifica los "magic bytes" del archivo para confirmar que es una imagen real
 * Esta validación NO se puede falsificar cambiando la extensión
 */
export const validateImageFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      // No hay archivos, permitir continuar (son opcionales)
      console.log('✓ Validación: No hay archivos para validar (opcionales)');
      return next();
    }

    console.log(`🔍 Validando ${req.files.length} archivo(s)...`);
    const validatedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        console.log(`  Validando: ${file.originalname} (${file.mimetype})`);
        
        // Con memoryStorage, el buffer ya está disponible en file.buffer
        const fileType = await fileTypeFromBuffer(file.buffer);

        if (!fileType) {
          console.log(`  ✗ ${file.originalname}: No se pudo determinar el tipo`);
          errors.push(`${file.originalname}: No se pudo determinar el tipo de archivo`);
          continue;
        }

        // Verificar que sea realmente una imagen
        const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
        if (!allowedTypes.includes(fileType.ext)) {
          console.log(`  ✗ ${file.originalname}: Tipo no permitido (${fileType.ext})`);
          errors.push(`${file.originalname}: Tipo de archivo no permitido (${fileType.ext}). Solo JPG, PNG y WebP.`);
          continue;
        }

        // Verificar que el MIME type coincida
        if (fileType.mime !== file.mimetype) {
          console.log(`  ✗ ${file.originalname}: MIME no coincide (${fileType.mime} vs ${file.mimetype})`);
          errors.push(`${file.originalname}: El archivo no coincide con su extensión declarada`);
          continue;
        }

        validatedFiles.push(file);
        console.log(`  ✓ ${file.originalname} validado correctamente`);
      } catch (error) {
        console.error(`  ✗ Error validando ${file.originalname}:`, error.message);
        errors.push(`${file.originalname}: Error al procesar el archivo`);
      }
    }

    console.log(`✓ Validación completa: ${validatedFiles.length} válido(s), ${errors.length} error(es)`);

    if (errors.length > 0 && validatedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ningún archivo es válido',
        errors
      });
    }

    // Actualizar req.files solo con archivos validados
    req.files = validatedFiles;
    
    if (errors.length > 0) {
      req.fileValidationWarnings = errors;
      console.log('⚠️ Warnings de validación:', errors);
    }

    next();
  } catch (error) {
    console.error('❌ Error en validación de archivos:', error);
    
    // Limpiar archivos en caso de error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch {}
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Error al validar los archivos'
    });
  }
};

// ============================================
// LIMPIEZA DE ARCHIVOS TEMPORALES
// ============================================

/**
 * Con memoryStorage no hay archivos temporales que limpiar
 * Esta función se mantiene para compatibilidad pero no hace nada
 */
export const cleanupFiles = async (files) => {
  // No hay archivos en disco que limpiar cuando usamos memoryStorage
  if (process.env.NODE_ENV !== 'production') {
    console.log('✓ Limpieza de archivos omitida (usando memoryStorage)');
  }
};

// ============================================
// EXPORTAR MIDDLEWARE
// ============================================

export const uploadMiddleware = upload.array('images', limits.files);
