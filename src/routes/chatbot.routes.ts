/**
 * Rutas del Chatbot
 */

import { Router } from 'express';
import * as chatbotController from '../controllers/chatbot.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (para el widget del chat)
// ============================================

/**
 * POST /api/chat/message
 * Procesar mensaje del usuario
 */
router.post('/message', chatbotController.processMessage);

/**
 * GET /api/chat/history/:sessionId
 * Obtener historial de conversación
 */
router.get('/history/:sessionId', chatbotController.getHistory);

/**
 * POST /api/chat/contact
 * Guardar información de contacto del visitante
 */
router.post('/contact', chatbotController.saveContact);

// ============================================
// RUTAS PROTEGIDAS (para el admin)
// ============================================

/**
 * GET /api/chat/conversations
 * Obtener todas las conversaciones
 */
router.get('/conversations', authMiddleware, chatbotController.getConversations);

/**
 * GET /api/chat/conversations/:id
 * Obtener detalle de una conversación
 */
router.get('/conversations/:id', authMiddleware, chatbotController.getConversation);

/**
 * PUT /api/chat/conversations/:id/status
 * Actualizar estado de una conversación
 */
router.put('/conversations/:id/status', authMiddleware, chatbotController.updateStatus);

export default router;
