/**
 * Servicio para gestionar mensajes de contacto
 * Envía emails usando Nodemailer
 */

import nodemailer from 'nodemailer';
import { getSettings } from './settings.service';

export interface ContactFormData {
  name: string;
  surname?: string;
  phone?: string;
  email: string;
  city?: string;
  message?: string;
}

// Verificar si SMTP está configurado correctamente (no con valores de ejemplo)
const isSmtpConfigured = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Verificar que no sean valores de ejemplo
  if (!user || !pass) return false;
  if (user.includes('tu_email') || user.includes('your_email')) return false;
  if (pass.includes('tu_contraseña') || pass.includes('your_password')) return false;

  return true;
};

// Crear transporter de Nodemailer
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('⚠️ Configuración SMTP incompleta. Verifica las variables de entorno.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true para 465, false para otros puertos
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Envía un email con el mensaje de contacto a la empresa
 */
export async function sendContactMessage(data: ContactFormData) {
  // Obtener email de la empresa desde settings
  const settings = await getSettings();
  const companyEmail = settings.email;
  const companyName = settings.companyName || 'Korvalia';

  if (!companyEmail) {
    console.error('❌ No hay email de empresa configurado en los ajustes.');
    throw new Error('No hay email de destino configurado. Configura el email de la empresa en el panel de administración.');
  }

  // Construir el HTML del email
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: #39505d;
          color: white;
          padding: 25px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 25px;
          border-radius: 0 0 8px 8px;
        }
        .field {
          margin-bottom: 15px;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border-left: 3px solid #39505d;
        }
        .field-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .field-value {
          font-size: 15px;
          color: #111827;
        }
        .message-box {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          margin-top: 15px;
        }
        .footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin: 0;">Nuevo mensaje de contacto</h2>
      </div>
      <div class="content">
        <p>Has recibido un nuevo mensaje desde el formulario de contacto de tu web.</p>

        <div class="field">
          <div class="field-label">Nombre completo</div>
          <div class="field-value">${data.name}${data.surname ? ' ' + data.surname : ''}</div>
        </div>

        <div class="field">
          <div class="field-label">Email</div>
          <div class="field-value"><a href="mailto:${data.email}">${data.email}</a></div>
        </div>

        ${data.phone ? `
        <div class="field">
          <div class="field-label">Telefono</div>
          <div class="field-value"><a href="tel:${data.phone}">${data.phone}</a></div>
        </div>
        ` : ''}

        ${data.city ? `
        <div class="field">
          <div class="field-label">Ciudad</div>
          <div class="field-value">${data.city}</div>
        </div>
        ` : ''}

        ${data.message ? `
        <div class="field">
          <div class="field-label">Mensaje</div>
          <div class="message-box">${data.message.replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Este mensaje fue enviado desde el formulario de contacto de ${companyName}.</p>
          <p>Fecha: ${new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Log del mensaje
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📧 NUEVO MENSAJE DE CONTACTO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Para:', companyEmail);
  console.log('De:', data.name, data.surname || '', `<${data.email}>`);
  console.log('Teléfono:', data.phone || '(no proporcionado)');
  console.log('Ciudad:', data.city || '(no proporcionada)');
  console.log('Mensaje:', data.message || '(sin mensaje)');
  console.log('═══════════════════════════════════════════════════════════');

  // Verificar si SMTP está configurado
  if (!isSmtpConfigured()) {
    console.warn('⚠️ SMTP no configurado - Modo desarrollo activado');
    console.log('✅ Mensaje registrado correctamente (no se envió email real)');
    console.log('ℹ️ Para enviar emails reales, configura las variables SMTP en .env');

    // En modo desarrollo, simular éxito para que el formulario funcione
    return {
      success: true,
      message: 'Mensaje recibido correctamente',
      messageId: `dev-${Date.now()}`,
      note: 'Modo desarrollo - Email no enviado (SMTP no configurado)',
    };
  }

  // Crear transporter
  const transporter = createTransporter();

  if (!transporter) {
    console.error('❌ No se pudo crear el transporter de email. Verifica la configuración SMTP.');
    throw new Error('Error de configuración del servidor de email. Contacta con el administrador.');
  }

  try {
    // Enviar email
    const info = await transporter.sendMail({
      from: `"${companyName} Web" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: companyEmail,
      replyTo: data.email,
      subject: `Nuevo contacto de ${data.name} - ${companyName}`,
      html: html,
    });

    console.log('✅ Email enviado correctamente:', info.messageId);

    return {
      success: true,
      message: 'Mensaje enviado correctamente',
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Error al enviar email:', error.message);

    // Dar mensajes de error más específicos
    if (error.code === 'EAUTH') {
      throw new Error('Error de autenticación SMTP. Verifica las credenciales de email.');
    }
    if (error.code === 'ECONNECTION' || error.code === 'ESOCKET') {
      throw new Error('No se pudo conectar al servidor de email. Verifica la configuración SMTP.');
    }

    throw new Error('No se pudo enviar el mensaje. Por favor, inténtalo de nuevo más tarde.');
  }
}
