# Backend ISDEP - Sistema de Inscripciones

Backend API para el sistema de inscripciones del Instituto ISDEP. Desarrollado con Node.js, Express y Resend para el envío profesional de emails con adjuntos.

## 🚀 Características

- ✅ **Envío de emails con Resend** - Servicio profesional de envío de emails
- ✅ **Upload seguro de imágenes** - Hasta 5 imágenes (JPG, PNG, WebP)
- ✅ **Validación robusta** - Verificación de MIME types y magic bytes
- ✅ **Sanitización de inputs** - Protección contra XSS y SQL Injection
- ✅ **Rate Limiting** - Protección contra spam (5 requests cada 15 min)
- ✅ **Headers de seguridad** - Helmet configurado
- ✅ **CORS configurado** - Solo dominios permitidos
- ✅ **Confirmación automática** - Email de confirmación al estudiante

> **💡 Tip importante:** Si deployás en Render (gratis), tu backend se dormirá después de 15 min. 
> Usá [UptimeRobot](https://uptimerobot.com) (gratis) para mantenerlo despierto. Ver [KEEP_ALIVE.md](./KEEP_ALIVE.md)

## 📋 Requisitos

- Node.js >= 18.0.0
- Cuenta en [Resend](https://resend.com) (plan gratuito: 3,000 emails/mes)

## 🔧 Instalación

1. **Instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Server
PORT=3000
NODE_ENV=development

# Resend API Key (obtener en https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Emails
EMAIL_FROM=Instituto ISDEP <inscripciones@institutoisdep.com.ar>
EMAIL_TO=isdep@hotmail.com.ar

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://www.institutoisdep.com.ar

# Uploads
MAX_FILE_SIZE=5242880
MAX_FILES=5
```

## 🎯 Obtener API Key de Resend

1. Crea una cuenta en [resend.com](https://resend.com)
2. Ve a **API Keys** en el dashboard
3. Crea una nueva API key
4. Copia la key y pégala en `.env`

⚠️ **Importante:** Para usar un dominio personalizado (como `@institutoisdep.com.ar`), debes:
- Agregar y verificar tu dominio en Resend
- Configurar los registros DNS (SPF, DKIM, etc.)
- Si usas el dominio por defecto (`onboarding@resend.dev`), funciona sin configuración adicional

## 🏃 Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /health
```

Respuesta:
```json
{
  "success": true,
  "message": "ISDEP Backend API está funcionando correctamente",
  "timestamp": "2026-01-28T12:00:00.000Z"
}
```

### Enviar Inscripción
```
POST /api/inscripcion
Content-Type: multipart/form-data
```

**Campos del formulario:**
- `nombre` (string, requerido)
- `apellido` (string, requerido)
- `dni` (string, requerido)
- `fechaNacimiento` (date, requerido)
- `email` (email, requerido)
- `telefono` (string, requerido)
- `pais` (string, requerido)
- `ciudad` (string, requerido)
- `profesion` (string, requerido)
- `formacionSolicitada` (string, requerido)
- `tieneConocimientosPrevios` (boolean, opcional)
- `images` (File[], opcional, máximo 5 archivos de 5MB c/u)

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/inscripcion \
  -F "nombre=Juan" \
  -F "apellido=Pérez" \
  -F "dni=12345678" \
  -F "fechaNacimiento=1990-05-15" \
  -F "email=juan@example.com" \
  -F "telefono=+54 9 11 1234-5678" \
  -F "pais=Argentina" \
  -F "ciudad=Buenos Aires" \
  -F "profesion=Psicólogo" \
  -F "formacionSolicitada=Psicografología" \
  -F "tieneConocimientosPrevios=false" \
  -F "images=@titulo.jpg" \
  -F "images=@dni.jpg"
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Inscripción enviada exitosamente",
  "emailId": "abc123...",
  "warnings": []
}
```

## 🔒 Seguridad

### Medidas implementadas:

1. **Rate Limiting**
   - Máximo 5 solicitudes cada 15 minutos por IP
   - Previene ataques de fuerza bruta

2. **Validación de archivos**
   - Verificación de MIME types
   - Comprobación de magic bytes (no se puede falsificar)
   - Límite de tamaño: 5MB por archivo
   - Formatos permitidos: JPG, JPEG, PNG, WebP

3. **Sanitización de inputs**
   - Express-validator con escape de HTML
   - Validación de tipos de datos
   - Límites de longitud

4. **CORS configurado**
   - Solo dominios autorizados pueden hacer requests

5. **Headers de seguridad (Helmet)**
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - etc.

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── resend.js              # Configuración de Resend
│   ├── controllers/
│   │   └── inscripcion.controller.js  # Lógica de negocio
│   ├── middleware/
│   │   ├── upload.middleware.js   # Multer + validación de archivos
│   │   └── validation.middleware.js   # Express-validator
│   ├── routes/
│   │   └── inscripcion.routes.js  # Definición de rutas
│   ├── utils/
│   │   └── email-template.js      # Templates HTML de emails
│   └── server.js                  # Punto de entrada
├── uploads/                       # Archivos temporales (git ignored)
├── .env                           # Variables de entorno (git ignored)
├── .env.example                   # Ejemplo de configuración
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Deploy

### Recomendaciones para producción:

**Plataformas sugeridas:**
- Railway
- Render
- Fly.io
- Heroku
- VPS (DigitalOcean, AWS, etc.)

**Variables de entorno necesarias:**
```env
NODE_ENV=production
PORT=3000
RESEND_API_KEY=tu_api_key_aqui
EMAIL_FROM=Instituto ISDEP <inscripciones@institutoisdep.com.ar>
EMAIL_TO=isdep@hotmail.com.ar
ALLOWED_ORIGINS=https://www.institutoisdep.com.ar
MAX_FILE_SIZE=5242880
MAX_FILES=5
```

**Consideraciones:**
- Configurar HTTPS en producción
- Usar variables de entorno (no hardcodear secretos)
- Configurar dominio personalizado en Resend
- Monitorear logs y errores

## 🧪 Testing

### Test manual con Postman/Insomnia:

1. Importa la colección (crear una request POST)
2. URL: `http://localhost:3000/api/inscripcion`
3. Body: `form-data`
4. Agrega todos los campos requeridos
5. Adjunta archivos en el campo `images`

## 📧 Configuración de Email Personalizado

Para usar tu dominio `@institutoisdep.com.ar`:

1. Ve a Resend Dashboard → Domains
2. Agrega tu dominio
3. Configura los registros DNS proporcionados por Resend:
   - SPF
   - DKIM
   - DMARC
4. Verifica el dominio
5. Actualiza `EMAIL_FROM` en `.env`

Mientras tanto, puedes usar `onboarding@resend.dev` para testing.

## � Mantener el Backend Activo en Render (Gratis)

Render **GRATIS** pone tu servicio a dormir después de 15 minutos de inactividad, causando un "cold start" de ~30 segundos en la primera request.

**Solución Recomendada:** Usar **UptimeRobot** (gratis para siempre)

### Setup rápido (2 minutos):

1. Registrate en [uptimerobot.com](https://uptimerobot.com)
2. Agregar monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://isdepback.onrender.com/health`
   - **Interval**: 5 minutes
3. ¡Backend siempre activo! 🎉

📖 **Ver guía completa:** [KEEP_ALIVE.md](./KEEP_ALIVE.md) - Incluye 4 opciones gratuitas diferentes.

## �🐛 Troubleshooting

### Error: "No permitido por CORS"
- Verifica que el origen esté en `ALLOWED_ORIGINS`
- En desarrollo, asegúrate de incluir `http://localhost:5173`

### Error: "RESEND_API_KEY no está configurada"
- Verifica que el archivo `.env` existe
- Verifica que la API key es válida

### Los archivos no se suben
- Verifica que el campo se llame `images`
- Verifica que sean máximo 5 archivos
- Verifica que cada archivo sea menor a 5MB

### Rate limit alcanzado
- Espera 15 minutos o reinicia el servidor en desarrollo

## 📄 Licencia

ISC

## 👥 Soporte

Para consultas: isdep@hotmail.com.ar
