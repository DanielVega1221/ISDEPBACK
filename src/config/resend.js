import dotenv from 'dotenv';

dotenv.config();

// ============================================
// CONFIGURACIÓN DE RESEND
// ============================================

export const resendConfig = {
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM || 'Instituto ISDEP <onboarding@resend.dev>',
  replyTo: process.env.EMAIL_REPLY_TO || 'consultasisdep@proton.me',
  to: process.env.EMAIL_TO || 'isdep@hotmail.com.ar',
};

// Validar que la API key esté configurada
export const validateResendConfig = () => {
  if (!resendConfig.apiKey) {
    throw new Error('RESEND_API_KEY no está configurada en las variables de entorno');
  }

  if (resendConfig.apiKey.length < 20) {
    throw new Error('RESEND_API_KEY parece inválida (demasiado corta)');
  }

  return true;
};
