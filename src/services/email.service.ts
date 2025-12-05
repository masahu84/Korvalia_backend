/**
 * Servicio de envío de emails
 * Por ahora solo registra los emails en consola
 * En el futuro se puede configurar con Nodemailer y un servidor SMTP
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
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

  // Por ahora solo registramos en consola
  console.log('📧 Email de bienvenida preparado para:', userEmail);
  console.log('Asunto: ¡Gracias por tu interés en', companyName, '!');

  // En el futuro aquí iría la lógica de envío real con Nodemailer
  // Por ejemplo:
  // await transporter.sendMail({
  //   from: email,
  //   to: userEmail,
  //   subject: `¡Gracias por tu interés en ${companyName}!`,
  //   html: html
  // });

  return { success: true, message: 'Email preparado (pendiente configuración SMTP)' };
}

/**
 * Notifica a la empresa sobre un nuevo lead
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

  console.log('📧 Notificación de nuevo lead preparada para:', companyEmail);
  console.log('Lead email:', leadEmail);

  // En el futuro aquí iría la lógica de envío real
  return { success: true, message: 'Notificación preparada (pendiente configuración SMTP)' };
}
