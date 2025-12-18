/**
 * Servicio de envío de emails
 * Configurado con Nodemailer para envío real de emails
 */

import nodemailer from 'nodemailer';

// Configuración del transporter
// En producción, usar variables de entorno para las credenciales SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  // Ignorar errores de certificado en desarrollo
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
});

// Email de destino para leads del CTA
const CTA_LEAD_EMAIL = 'merchesilva@korvalia.es';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envía un email usando el transporter configurado
 */
async function sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string }> {
  const { to, subject, html } = options;

  // Verificar si tenemos credenciales SMTP configuradas
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ SMTP no configurado. Email simulado:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    return { success: true, message: 'Email simulado (SMTP no configurado)' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Korvalia Web" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email enviado:', info.messageId);
    return { success: true, message: `Email enviado: ${info.messageId}` };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, message: `Error enviando email: ${error}` };
  }
}

/**
 * Envía un email de bienvenida al lead
 */
export async function sendWelcomeEmail(
  userEmail: string,
  companyData: {
    companyName: string;
    email: string;
    phone: string;
    address: string;
    whatsappNumber: string;
  }
) {
  const { companyName, email, phone, address, whatsappNumber } = companyData;

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
          background: #c3a77a;
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background: #39505d;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .contact-info {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .contact-item {
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>¡Gracias por tu interés!</h1>
      </div>
      <div class="content">
        <p>Hola,</p>
        <p>Gracias por interesarte en <strong>${companyName}</strong>. Estamos encantados de que quieras conocer más sobre nuestros servicios inmobiliarios.</p>
        <p>En ${companyName} trabajamos para ayudarte a encontrar la propiedad perfecta o vender tu vivienda al mejor precio. Nuestro equipo estará encantado de atenderte.</p>

        <div style="text-align: center;">
          <a href="https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}" class="button">
            Contáctanos por WhatsApp
          </a>
        </div>

        <div class="contact-info">
          <h3 style="color: #39505d; margin-top: 0;">Datos de contacto:</h3>
          ${email ? `<div class="contact-item"><strong>📧 Email:</strong> ${email}</div>` : ''}
          ${phone ? `<div class="contact-item"><strong>📞 Teléfono:</strong> ${phone}</div>` : ''}
          ${address ? `<div class="contact-item"><strong>📍 Dirección:</strong> ${address}</div>` : ''}
        </div>

        <p style="margin-top: 30px;">¡Esperamos poder ayudarte pronto!</p>
        <p><strong>El equipo de ${companyName}</strong></p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `¡Gracias por tu interés en ${companyName}!`,
    html,
  });
}

/**
 * Notifica a la empresa sobre un nuevo lead (por email)
 */
export async function sendLeadNotificationToCompany(
  companyEmail: string,
  leadEmail: string,
  source: string
) {
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
        .alert {
          background: #d1fae5;
          border-left: 4px solid #10b981;
          padding: 20px;
          border-radius: 8px;
        }
        .info {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="alert">
        <h2 style="margin-top: 0; color: #065f46;">🎉 Nuevo Lead Recibido</h2>
        <p>Se ha registrado un nuevo contacto interesado en tus servicios.</p>
      </div>
      <div class="info">
        <p><strong>Email del lead:</strong> ${leadEmail}</p>
        <p><strong>Origen:</strong> ${source === 'cta_home' ? 'CTA Home Page' : source}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
      </div>
      <p style="margin-top: 20px; color: #6b7280;">
        Puedes gestionar tus leads desde el panel de administración.
      </p>
    </body>
    </html>
  `;

  return sendEmail({
    to: companyEmail,
    subject: '🎉 Nuevo lead desde la web',
    html,
  });
}

/**
 * Notifica sobre un nuevo lead con número de teléfono (CTA)
 * Este email se envía a merchesilva@korvalia.es
 */
export async function sendPhoneLeadNotification(
  phone: string,
  source: string
) {
  const sourceLabels: Record<string, string> = {
    'cta_home': 'CTA - Página Principal',
    'cta_about': 'CTA - Sobre Nosotros',
    'cta_contact': 'CTA - Contacto',
    'cta_properties': 'CTA - Listado de Propiedades',
    'cta_property_detail': 'CTA - Detalle de Propiedad',
  };

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
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #39505d 0%, #2d3f4a 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 10px 0 0;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .phone-box {
          background: #f0f9ff;
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          margin: 20px 0;
        }
        .phone-label {
          color: #0369a1;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .phone-number {
          color: #0c4a6e;
          font-size: 28px;
          font-weight: bold;
          margin: 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          color: #6b7280;
        }
        .info-value {
          color: #111827;
          font-weight: 500;
        }
        .cta-button {
          display: block;
          background: #c3a77a;
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          text-align: center;
          font-weight: bold;
          margin-top: 20px;
        }
        .footer {
          background: #f9fafb;
          padding: 20px 30px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nueva Persona Interesada</h1>
          <p>Un visitante ha dejado su telefono en la web</p>
        </div>
        <div class="content">
          <div class="phone-box">
            <p class="phone-label">Numero de telefono</p>
            <p class="phone-number">${phone}</p>
          </div>

          <div class="info-row">
            <span class="info-label">Origen</span>
            <span class="info-value">${sourceLabels[source] || source}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Fecha</span>
            <span class="info-value">${new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Hora</span>
            <span class="info-value">${new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>

          <a href="tel:${phone.replace(/[^0-9+]/g, '')}" class="cta-button">
            Llamar ahora
          </a>
        </div>
        <div class="footer">
          <p>Este email se ha generado automaticamente desde korvalia.es</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: CTA_LEAD_EMAIL,
    subject: `Nueva persona interesada: ${phone}`,
    html,
  });
}
