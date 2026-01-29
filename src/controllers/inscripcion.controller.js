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
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📎 Procesando ${req.files.length} archivo(s) adjunto(s)...`);
      }
      
      for (const file of req.files) {
        try {
          const fileBuffer = await fs.readFile(file.path);
          attachments.push({
            filename: file.originalname,
            content: fileBuffer,
          });
          if (process.env.NODE_ENV !== 'production') {
            console.log(`  ✓ ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
          }
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
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 Enviando email...');
    }
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('❌ Error de Resend:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el email',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Email enviado exitosamente!');
      console.log(`   ID: ${data.id}`);
    }

    // 7. Responder con éxito
    return res.status(200).json({
      success: true,
      message: 'Inscripción enviada exitosamente',
      emailId: data.id,
      warnings: req.fileValidationWarnings
    });

  } catch (error) {
    console.error('❌ Error procesando inscripción:', error);

    return res.status(500).json({
      success: false,
      message: 'Error procesando la solicitud',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Siempre limpiar archivos temporales después de procesar (éxito o error)
    if (req.files && req.files.length > 0) {
      await cleanupFiles(req.files);
      if (process.env.NODE_ENV !== 'production') {
        console.log('🧹 Archivos temporales eliminados');
      }
    }
  }
};
