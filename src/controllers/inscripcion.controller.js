import { Resend } from 'resend';
import { resendConfig, validateResendConfig } from '../config/resend.js';
import { generateEmailHTML, generateEmailText } from '../utils/email-template.js';
import { cleanupFiles } from '../middleware/upload.middleware.js';
import fs from 'fs/promises';

// ============================================
// CONTROLADOR DE INSCRIPCIÓN
// ============================================

export const enviarInscripcion = async (req, res) => {
  let resend;
  
  try {
    // 1. Validar configuración de Resend
    validateResendConfig();
    resend = new Resend(resendConfig.apiKey);

    // 2. Obtener datos del formulario
    const formData = req.body;
    
    // 3. Preparar archivos adjuntos
    const attachments = [];
    if (req.files && req.files.length > 0) {
      console.log(`📎 Procesando ${req.files.length} archivo(s) adjunto(s)...`);
      
      for (const file of req.files) {
        try {
          const fileBuffer = await fs.readFile(file.path);
          attachments.push({
            filename: file.originalname,
            content: fileBuffer,
          });
          console.log(`  ✓ ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
        } catch (error) {
          console.error(`  ✗ Error leyendo ${file.originalname}:`, error);
        }
      }
    }

    // 4. Generar contenido del email
    const emailHTML = generateEmailHTML(formData, req.fileValidationWarnings);
    const emailText = generateEmailText(formData);

    // 5. Configurar email
    const emailData = {
      from: resendConfig.from,
      to: resendConfig.to,
      replyTo: resendConfig.replyTo, // Las respuestas van a Proton Mail
      subject: `Nueva Inscripción: ${formData.nombre} ${formData.apellido} - ${formData.formacionSolicitada}`,
      html: emailHTML,
      text: emailText,
    };

    // Agregar adjuntos si existen
    if (attachments.length > 0) {
      emailData.attachments = attachments;
    }

    // 6. Enviar email con Resend
    console.log('\n📧 Enviando email...');
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('❌ Error de Resend:', error);
      
      // Limpiar archivos temporales
      await cleanupFiles(req.files);
      
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el email',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }

    console.log('✅ Email enviado exitosamente!');
    console.log(`   ID: ${data.id}`);

    // 7. Enviar email de confirmación al estudiante (opcional)
    try {
      await enviarConfirmacionEstudiante(resend, formData);
    } catch (confirmError) {
      console.error('⚠️ Error enviando confirmación al estudiante:', confirmError);
      // No fallar si esto falla
    }

    // 8. Limpiar archivos temporales
    await cleanupFiles(req.files);

    // 9. Responder con éxito
    return res.status(200).json({
      success: true,
      message: 'Inscripción enviada exitosamente',
      emailId: data.id,
      warnings: req.fileValidationWarnings
    });

  } catch (error) {
    console.error('❌ Error procesando inscripción:', error);

    // Limpiar archivos en caso de error
    if (req.files) {
      await cleanupFiles(req.files);
    }

    return res.status(500).json({
      success: false,
      message: 'Error procesando la solicitud',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// EMAIL DE CONFIRMACIÓN AL ESTUDIANTE
// ============================================

const enviarConfirmacionEstudiante = async (resend, formData) => {
  const confirmacionHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d3561 0%, #1a1f3a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✅ Inscripción Recibida
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Instituto ISDEP
              </p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #2d3561; font-size: 18px; font-weight: 600;">
                Hola ${formData.nombre},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #495057; font-size: 15px; line-height: 1.6;">
                ¡Gracias por tu interés en <strong>${formData.formacionSolicitada}</strong>!
              </p>
              
              <p style="margin: 0 0 20px 0; color: #495057; font-size: 15px; line-height: 1.6;">
                Hemos recibido tu solicitud de inscripción correctamente. Nuestro equipo la revisará y se pondrá en contacto contigo a la brevedad.
              </p>

              <div style="background-color: #e7f3ff; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #004085; font-size: 14px; font-weight: 600;">
                  📋 Resumen de tu solicitud:
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #004085; font-size: 14px; line-height: 1.8;">
                  <li><strong>Formación:</strong> ${formData.formacionSolicitada}</li>
                  <li><strong>Email:</strong> ${formData.email}</li>
                  <li><strong>Teléfono:</strong> ${formData.telefono}</li>
                </ul>
              </div>

              <p style="margin: 0 0 20px 0; color: #495057; font-size: 15px; line-height: 1.6;">
                Si tienes alguna consulta, no dudes en contactarnos.
              </p>

              <p style="margin: 30px 0 0 0; color: #495057; font-size: 15px;">
                Saludos cordiales,<br>
                <strong style="color: #2d3561;">Equipo ISDEP</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #2d3561; color: rgba(255, 255, 255, 0.8);">
              <p style="margin: 0 0 10px 0; font-size: 14px;">
                <strong style="color: #ffffff;">Instituto ISDEP</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const { data, error } = await resend.emails.send({
    from: resendConfig.from,
    to: formData.email,
    subject: `Confirmación de Inscripción - ${formData.formacionSolicitada} - ISDEP`,
    html: confirmacionHTML,
    text: `
Hola ${formData.nombre},

¡Gracias por tu interés en ${formData.formacionSolicitada}!

Hemos recibido tu solicitud de inscripción correctamente. Nuestro equipo la revisará y se pondrá en contacto contigo a la brevedad.

Resumen de tu solicitud:
- Formación: ${formData.formacionSolicitada}
- Email: ${formData.email}
- Teléfono: ${formData.telefono}

Si tienes alguna consulta, no dudes en contactarnos.

Saludos cordiales,
Equipo ISDEP

Instituto ISDEP
isdep@hotmail.com.ar
www.institutoisdep.com.ar
    `
  });

  if (error) {
    throw error;
  }

  console.log(`✅ Confirmación enviada a ${formData.email}`);
  return data;
};
