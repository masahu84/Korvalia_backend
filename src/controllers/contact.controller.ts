/**
 * Controlador para mensajes de contacto
 */

import { Request, Response, NextFunction } from 'express';
import * as contactService from '../services/contact.service';
import { sendSuccess } from '../utils/response';

/**
 * POST /api/contact
 * Recibe y procesa un mensaje del formulario de contacto
 */
export async function submitContactForm(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, surname, phone, email, city, message } = req.body;

    // Validaciones básicas
    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'El nombre es requerido',
      });
      return;
    }

    if (!email || email.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'El email es requerido',
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'El formato del email no es válido',
      });
      return;
    }

    console.log('[POST /api/contact] Procesando mensaje de:', name, email);

    const result = await contactService.sendContactMessage({
      name: name.trim(),
      surname: surname?.trim(),
      phone: phone?.trim(),
      email: email.trim(),
      city: city?.trim(),
      message: message?.trim(),
    });

    sendSuccess(res, result, 'Mensaje enviado correctamente');
  } catch (error) {
    next(error);
  }
}
