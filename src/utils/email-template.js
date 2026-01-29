/**
 * Genera el template HTML profesional para el email de inscripción
 */
export const generateEmailHTML = (formData, warnings = null) => {
  const { 
    nombre, apellido, dni, fechaNacimiento, 
    email, telefono, pais, ciudad, 
    profesion, formacionSolicitada, tieneConocimientosPrevios 
  } = formData;

  const warningsHTML = warnings && warnings.length > 0 
    ? `
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <strong style="color: #856404;">⚠️ Advertencias:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        ${warnings.map(w => `<li style="color: #856404;">${w}</li>`).join('')}
      </ul>
    </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Solicitud de Inscripción - ISDEP</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Contenedor principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d3561 0%, #1a1f3a 100%); padding: 40px 30px; text-align: center;">
              <div style="background-color: rgba(255, 255, 255, 0.1); display: inline-block; padding: 15px; border-radius: 50%; margin-bottom: 15px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12L12 8L21 12L12 16L3 12Z" fill="#ffffff" stroke="#ffffff" stroke-width="1.5"/>
                  <path d="M6 12V16C6 17.1046 8.68629 20 12 20C15.3137 20 18 17.1046 18 16V12" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Nueva Solicitud de Inscripción
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Instituto ISDEP - Sistema de Inscripciones
              </p>
            </td>
          </tr>

          <!-- Fecha y hora -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 14px; text-align: center;">
                📅 Recibido: ${new Date().toLocaleString('es-AR', { 
                  dateStyle: 'full', 
                  timeStyle: 'short',
                  timeZone: 'America/Argentina/Buenos_Aires'
                })}
              </p>
            </td>
          </tr>

          ${warningsHTML ? `
          <tr>
            <td style="padding: 20px 30px;">
              ${warningsHTML}
            </td>
          </tr>
          ` : ''}

          <!-- Curso solicitado destacado -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
              <p style="margin: 0 0 10px 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                Formación Solicitada
              </p>
              <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ${formacionSolicitada}
              </h2>
            </td>
          </tr>

          <!-- Datos Personales -->
          <tr>
            <td style="padding: 30px;">
              <h3 style="margin: 0 0 20px 0; color: #2d3561; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">👤</span>
                Datos Personales
              </h3>
              
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="color: #6c757d; font-size: 14px; font-weight: 600; width: 40%;">Nombre Completo:</td>
                  <td style="color: #2d3561; font-size: 15px; font-weight: 500;">${nombre} ${apellido}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="color: #6c757d; font-size: 14px; font-weight: 600;">DNI:</td>
                  <td style="color: #2d3561; font-size: 15px; font-weight: 500;">${dni}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="color: #6c757d; font-size: 14px; font-weight: 600;">Fecha de Nacimiento:</td>
                  <td style="color: #2d3561; font-size: 15px; font-weight: 500;">${new Date(fechaNacimiento).toLocaleDateString('es-AR')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Datos de Contacto -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa;">
              <h3 style="margin: 0 0 20px 0; color: #2d3561; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">📧</span>
                Datos de Contacto
              </h3>
              
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="color: #6c757d; font-size: 14px; font-weight: 600; width: 40%;">Email:</td>
                  <td style="color: #2d3561; font-size: 15px; font-weight: 500;">
                    <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="color: #6c757d; font-size: 14px; font-weight: 600;">Teléfono:</td>
                  <td style="color: #2d3561; font-size: 15px; font-weight: 500;">
                    <a href="tel:${telefono.replace(/\s/g, '')}" style="color: #667eea; text-decoration: none;">${telefono}</a>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="color: #6c757d; font-size: 14px; font-weight: 600;">País:</td>
                  <td style="color: #2d3561; font-size: 15px; font-weight: 500;">${pais}</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                  <td style="color: #6c757d; font-size: 14px; font-weight: 600;">Ciudad:</td>
                  <td style="color: #2d3561; font-size: 15px; font-weight: 500;">${ciudad}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Información Académica -->
          <tr>
            <td style="padding: 30px;">
              <h3 style="margin: 0 0 20px 0; color: #2d3561; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">🎓</span>
                Información Académica
              </h3>
              
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="color: #6c757d; font-size: 14px; font-weight: 600; width: 40%;">Nivel de educación:</td>
                  <td style="color: #2d3561; font-size: 15px; font-weight: 500;">${profesion}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="color: #6c757d; font-size: 14px; font-weight: 600;">Conocimientos Previos:</td>
                  <td style="color: #2d3561; font-size: 15px; font-weight: 500;">
                    ${tieneConocimientosPrevios 
                      ? '<span style="color: #28a745; font-weight: 600;">✓ Sí</span>' 
                      : '<span style="color: #6c757d;">✗ No</span>'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Nota sobre archivos adjuntos -->
          <tr>
            <td style="padding: 20px 30px; background-color: #e7f3ff; border-top: 2px solid #2d3561;">
              <p style="margin: 0; color: #004085; font-size: 14px; text-align: center;">
                📎 Los archivos adjuntos (títulos, DNI, etc.) se encuentran incluidos en este email
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #2d3561; color: rgba(255, 255, 255, 0.8);">
              <p style="margin: 0 0 10px 0; font-size: 14px;">
                <strong style="color: #ffffff;">Instituto ISDEP</strong>
              </p>
              <p style="margin: 0; font-size: 13px;">
                Sistema Automatizado de Inscripciones
              </p>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                📧 <a href="mailto:isdep@hotmail.com.ar" style="color: rgba(255, 255, 255, 0.8); text-decoration: none;">isdep@hotmail.com.ar</a> • 
                🌐 <a href="https://www.institutoisdep.com.ar" style="color: rgba(255, 255, 255, 0.8); text-decoration: none;">www.institutoisdep.com.ar</a>
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
};

/**
 * Genera el texto plano alternativo para el email
 */
export const generateEmailText = (formData) => {
  const { 
    nombre, apellido, dni, fechaNacimiento, 
    email, telefono, pais, ciudad, 
    profesion, formacionSolicitada, tieneConocimientosPrevios 
  } = formData;

  return `
═══════════════════════════════════════════════════
        NUEVA SOLICITUD DE INSCRIPCIÓN
              Instituto ISDEP
═══════════════════════════════════════════════════

Fecha: ${new Date().toLocaleString('es-AR')}

FORMACIÓN SOLICITADA
───────────────────────────────────────────────────
  ${formacionSolicitada}


DATOS PERSONALES
───────────────────────────────────────────────────
  Nombre Completo:    ${nombre} ${apellido}
  DNI:                ${dni}
  Fecha Nacimiento:   ${new Date(fechaNacimiento).toLocaleDateString('es-AR')}


DATOS DE CONTACTO
───────────────────────────────────────────────────
  Email:              ${email}
  Teléfono:           ${telefono}
  País:               ${pais}
  Ciudad:             ${ciudad}


INFORMACIÓN ACADÉMICA
───────────────────────────────────────────────────
  Profesión/Ocupación:    ${profesion}
  Conocimientos Previos:  ${tieneConocimientosPrevios ? 'Sí' : 'No'}


═══════════════════════════════════════════════════
Los archivos adjuntos están incluidos en este email.

Instituto ISDEP - Sistema Automatizado de Inscripciones
www.institutoisdep.com.ar
  `;
};
