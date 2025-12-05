import { Router, Request, Response, NextFunction } from 'express';
import * as leadService from '../services/lead.service';
import * as emailService from '../services/email.service';
import * as settingsService from '../services/settings.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * POST /api/leads
 * Crea un nuevo lead (público, no requiere autenticación)
 */
router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
    const { email, source } = req.body;

    // Crear lead en la base de datos
    const lead = await leadService.createLead({ email, source });

    // Obtener datos de la empresa para el email
    const settings = await settingsService.getSettings();

    // Preparar emails (por ahora solo se registran en consola)
    if (settings.email && settings.companyName) {
      // Email de bienvenida al usuario
      await emailService.sendWelcomeEmail(email, {
        companyName: settings.companyName || 'Korvalia',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        whatsappNumber: settings.whatsappNumber || '',
      });

      // Notificación a la empresa
      await emailService.sendLeadNotificationToCompany(
        settings.email,
        email,
        source || 'cta_home'
      );
    }

    res.status(201).json({
      success: true,
      message: '¡Gracias por tu interés! Pronto te contactaremos.',
      data: lead,
    });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leads
 * Obtiene todos los leads (requiere autenticación)
 */
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leads = await leadService.getAllLeads();

      res.json({
        success: true,
        data: leads,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/leads/:id
 * Obtiene un lead por ID (requiere autenticación)
 */
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await leadService.getLeadById(id);

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/leads/:id
 * Actualiza el estado de un lead (requiere autenticación)
 */
router.put(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;

      const lead = await leadService.updateLeadStatus(id, status, notes);

      res.json({
        success: true,
        message: 'Lead actualizado exitosamente',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/leads/:id
 * Elimina un lead (requiere autenticación)
 */
router.delete(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      await leadService.deleteLead(id);

      res.json({
        success: true,
        message: 'Lead eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
