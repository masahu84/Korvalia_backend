import { Router, Request, Response, NextFunction } from 'express';
import * as leadService from '../services/lead.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * POST /api/leads
 * Crea un nuevo lead con email (público, no requiere autenticación)
 * Solo guarda en base de datos
 */
router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, source } = req.body;

      // Crear lead en la base de datos
      const lead = await leadService.createLead({ email, source });

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
 * POST /api/leads/phone
 * Crea un nuevo lead con teléfono (para el CTA)
 * Solo guarda en base de datos, se visualiza desde el panel admin
 */
router.post(
  '/phone',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, source = 'cta_home' } = req.body;

      // Crear lead en la base de datos
      const lead = await leadService.createPhoneLead(phone, source);

      // Responder al usuario
      res.status(201).json({
        success: true,
        message: '¡Gracias! Te llamaremos lo antes posible.',
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
