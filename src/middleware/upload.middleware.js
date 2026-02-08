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

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único y seguro
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Eliminar caracteres peligrosos
      .toLowerCase();
    cb(null, `inscripcion-${uniqueSuffix}-${sanitizedName}`);
  }
});

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
        
        // Leer el archivo y verificar el tipo real
        const buffer = await fs.readFile(file.path);
        const fileType = await fileTypeFromBuffer(buffer);

        if (!fileType) {
          console.log(`  ✗ ${file.originalname}: No se pudo determinar el tipo`);
          errors.push(`${file.originalname}: No se pudo determinar el tipo de archivo`);
          await fs.unlink(file.path); // Eliminar archivo inválido
          continue;
        }

        // Verificar que sea realmente una imagen
        const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
        if (!allowedTypes.includes(fileType.ext)) {
          console.log(`  ✗ ${file.originalname}: Tipo no permitido (${fileType.ext})`);
          errors.push(`${file.originalname}: Tipo de archivo no permitido (${fileType.ext}). Solo JPG, PNG y WebP.`);
          await fs.unlink(file.path);
          continue;
        }

        // Verificar que el MIME type coincida
        if (fileType.mime !== file.mimetype) {
          console.log(`  ✗ ${file.originalname}: MIME no coincide (${fileType.mime} vs ${file.mimetype})`);
          errors.push(`${file.originalname}: El archivo no coincide con su extensión declarada`);
          await fs.unlink(file.path);
          continue;
        }

        validatedFiles.push(file);
        console.log(`  ✓ ${file.originalname} validado correctamente`);
      } catch (error) {
        console.error(`  ✗ Error validando ${file.originalname}:`, error.message);
        errors.push(`${file.originalname}: Error al procesar el archivo`);
        try {
          await fs.unlink(file.path);
        } catch {}
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
 * Elimina archivos temporales después de enviar el email
 */
export const cleanupFiles = async (files) => {
  if (!files || files.length === 0) return;

  for (const file of files) {
    try {
      await fs.unlink(file.path);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`✓ Archivo temporal eliminado: ${file.filename}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`✗ Error eliminando archivo ${file.filename}:`, error);
      }
    }
  }
};

// ============================================
// EXPORTAR MIDDLEWARE
// ============================================

export const uploadMiddleware = upload.array('images', limits.files);
