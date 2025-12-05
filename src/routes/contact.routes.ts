import { Router } from 'express';
import * as contactController from '../controllers/contact.controller';

const router = Router();

/**
 * POST /api/contact
 * Envía un mensaje desde el formulario de contacto (público)
 */
router.post('/', contactController.submitContactForm);

export default router;
