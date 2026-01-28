import { body, validationResult } from 'express-validator';

// ============================================
// REGLAS DE VALIDACIÓN
// ============================================

export const inscripcionValidationRules = [
  // Nombre
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras')
    .escape(),

  // Apellido
  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El apellido solo puede contener letras')
    .escape(),

  // DNI
  body('dni')
    .trim()
    .notEmpty().withMessage('El DNI es obligatorio')
    .isLength({ min: 6, max: 12 }).withMessage('DNI inválido')
    .matches(/^[0-9]+$/).withMessage('El DNI solo puede contener números')
    .escape(),

  // Fecha de Nacimiento
  body('fechaNacimiento')
    .notEmpty().withMessage('La fecha de nacimiento es obligatoria')
    .isISO8601().withMessage('Fecha inválida')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      
      if (age < 16 || age > 100) {
        throw new Error('Debe tener entre 16 y 100 años');
      }
      
      return true;
    }),

  // Email
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email demasiado largo'),

  // Teléfono
  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es obligatorio')
    .isLength({ min: 8, max: 20 }).withMessage('Teléfono inválido')
    .matches(/^[0-9+\s()-]+$/).withMessage('Formato de teléfono inválido')
    .escape(),

  // País
  body('pais')
    .trim()
    .notEmpty().withMessage('El país es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('País inválido')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El país solo puede contener letras')
    .escape(),

  // Ciudad
  body('ciudad')
    .trim()
    .notEmpty().withMessage('La ciudad es obligatoria')
    .isLength({ min: 2, max: 50 }).withMessage('Ciudad inválida')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('La ciudad solo puede contener letras')
    .escape(),

  // Profesión
  body('profesion')
    .trim()
    .notEmpty().withMessage('La profesión es obligatoria')
    .isLength({ min: 2, max: 100 }).withMessage('Profesión inválida')
    .escape(),

  // Formación Solicitada
  body('formacionSolicitada')
    .trim()
    .notEmpty().withMessage('Debe seleccionar una formación')
    .isLength({ min: 2, max: 100 }).withMessage('Formación inválida')
    .escape(),

  // Conocimientos Previos (opcional, booleano)
  body('tieneConocimientosPrevios')
    .optional()
    .isBoolean().withMessage('Valor inválido para conocimientos previos')
    .toBoolean()
];

// ============================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Agrupar errores por campo
    const formattedErrors = {};
    errors.array().forEach(error => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });

    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: formattedErrors
    });
  }

  next();
};

// ============================================
// SANITIZACIÓN ADICIONAL
// ============================================

export const sanitizeInscripcionData = (req, res, next) => {
  if (req.body) {
    // Eliminar campos no esperados (prevenir mass assignment)
    const allowedFields = [
      'nombre', 'apellido', 'dni', 'fechaNacimiento',
      'email', 'telefono', 'pais', 'ciudad',
      'profesion', 'formacionSolicitada', 'tieneConocimientosPrevios'
    ];

    Object.keys(req.body).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete req.body[key];
      }
    });

    // Asegurar que tieneConocimientosPrevios sea booleano
    if (req.body.tieneConocimientosPrevios !== undefined) {
      req.body.tieneConocimientosPrevios = 
        req.body.tieneConocimientosPrevios === true || 
        req.body.tieneConocimientosPrevios === 'true';
    } else {
      req.body.tieneConocimientosPrevios = false;
    }
  }

  next();
};
