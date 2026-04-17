// ============================================
// MIDDLEWARE DE IDEMPOTENCIA
// ============================================
// Previene que el mismo formulario se procese más de una vez,
// incluso si el cliente reintenta porque no recibió la respuesta.
//
// Funcionamiento:
// - El frontend genera un requestId único (UUID) por sesión de formulario.
// - Este middleware lo registra en memoria la primera vez que llega.
// - Si llega el mismo ID de nuevo, responde 200 silencioso sin procesar nada.
// - Si la respuesta final es un error (4xx/5xx), libera el ID para permitir
//   reintentos legítimos (ej: Resend caído, error de validación).
//
// Limitación conocida: el store es en memoria. Un reinicio del servidor
// limpia el registro. Es aceptable dado el TTL de 15 minutos.
// ============================================

const processedRequests = new Map(); // requestId -> timestamp (ms)

const TTL_MS = 15 * 60 * 1000; // 15 minutos

// Limpieza periódica para evitar memory leak en servidores de larga vida
setInterval(() => {
  const now = Date.now();
  for (const [id, timestamp] of processedRequests) {
    if (now - timestamp > TTL_MS) {
      processedRequests.delete(id);
    }
  }
}, 5 * 60 * 1000);

export const idempotencyMiddleware = (req, res, next) => {
  const requestId = req.body?.requestId;

  // Si no viene requestId (Postman, clientes legacy), dejar pasar sin restricción
  if (!requestId || typeof requestId !== 'string' || requestId.length > 50) {
    return next();
  }

  // Si ya fue procesado (o está en proceso), responder como éxito silencioso
  if (processedRequests.has(requestId)) {
    console.log(`⚡ Solicitud duplicada ignorada (id: ${requestId.slice(0, 8)}...)`);
    return res.status(200).json({
      success: true,
      message: 'Inscripción enviada exitosamente'
    });
  }

  // Registrar el ID antes de continuar con la cadena de middlewares
  processedRequests.set(requestId, Date.now());

  // Interceptar res.json: si la respuesta es un error, liberar el ID
  // para que el usuario pueda reintentar legítimamente
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode >= 400) {
      processedRequests.delete(requestId);
      console.log(`🔓 ID liberado por error ${res.statusCode} (id: ${requestId.slice(0, 8)}...)`);
    }
    return originalJson(body);
  };

  next();
};
