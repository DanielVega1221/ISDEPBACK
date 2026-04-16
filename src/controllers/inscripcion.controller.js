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
    if (process.env.NODE_ENV !== 'production') {
      console.log('📋 Datos del formulario recibidos:', {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        formacionSolicitada: formData.formacionSolicitada,
        observacion: formData.observacion || '(sin observaciones)'
      });
    }
    
    // 3. Preparar archivos adjuntos
    const attachments = [];
    if (req.files && req.files.length > 0) {
      console.log(`📎 Procesando ${req.files.length} archivo(s) adjunto(s)...`);
      console.log('Archivos recibidos:', req.files.map(f => ({ 
        name: f.originalname, 
        size: f.size,
        mimetype: f.mimetype,
        hasBuffer: !!f.buffer
      })));
      
      for (const file of req.files) {
        try {
          // Con memoryStorage, el buffer ya está disponible directamente
          const attachment = {
            filename: file.originalname,
            content: file.buffer,
          };
          
          attachments.push(attachment);
          console.log(`  ✓ ${file.originalname} (${(file.size / 1024).toFixed(2)} KB) - Buffer: ${file.buffer.length} bytes`);
        } catch (error) {
          console.error(`  ✗ Error procesando ${file.originalname}:`, error);
        }
      }
      
      console.log(`📎 Total de adjuntos preparados para enviar: ${attachments.length}`);
    } else {
      console.log('📎 No se recibieron archivos adjuntos');
    }

    // 4. Generar contenido del email
    const emailHTML = generateEmailHTML(formData, req.fileValidationWarnings);
    const emailText = generateEmailText(formData);

    // 5. Configurar email
    const emailData = {
      from: resendConfig.from,
      to: resendConfig.to,
      replyTo: resendConfig.replyTo,
      subject: `Nueva Inscripción: ${formData.nombre} ${formData.apellido} - ${formData.formacionSolicitada}`,
      html: emailHTML,
      text: emailText,
    };

    // Agregar adjuntos si existen
    if (attachments.length > 0) {
      emailData.attachments = attachments;
      console.log(`📎 Se agregarán ${attachments.length} archivo(s) adjunto(s) al email`);
      console.log('Detalles de adjuntos:', attachments.map(a => ({
        filename: a.filename,
        size: a.content.length
      })));
    } else {
      console.log('📎 Email sin archivos adjuntos');
    }

    // 6. Enviar email con Resend
    console.log('\n📧 Enviando email a Resend...');
    console.log('Configuración del email:', {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      attachmentsCount: emailData.attachments?.length || 0
    });
    
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('❌ Error de Resend:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el email',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }

    console.log('✅ Email enviado exitosamente a Resend!');
    console.log(`   ID: ${data.id}`);
    if (attachments.length > 0) {
      console.log(`   Con ${attachments.length} archivo(s) adjunto(s)`);
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
      console.log(`🧹 ${req.files.length} archivo(s) temporal(es) eliminado(s)`);
    }
  }
};
