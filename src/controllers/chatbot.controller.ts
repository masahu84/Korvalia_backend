/**
 * Controlador del Chatbot
 */

import { Request, Response, NextFunction } from 'express';
import * as chatbotService from '../services/chatbot.service';
import { sendSuccess, sendError } from '../utils/response';
import { ChatStatus } from '../generated/prisma/client';

/**
 * POST /api/chat/message
 * Procesar mensaje del usuario
 */
export async function processMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId, message, propertyId } = req.body;

    if (!sessionId || !message) {
      sendError(res, 'sessionId y message son requeridos', 400);
      return;
    }

    const response = await chatbotService.processMessage(
      sessionId,
      message,
      propertyId ? parseInt(propertyId) : undefined
    );

    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/chat/history/:sessionId
 * Obtener historial de conversación
 */
export async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId } = req.params;

    const history = await chatbotService.getConversationHistory(sessionId);

    sendSuccess(res, history);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/chat/contact
 * Guardar información de contacto
 */
export async function saveContact(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId, name, email, phone } = req.body;

    if (!sessionId) {
      sendError(res, 'sessionId es requerido', 400);
      return;
    }

    if (!email && !phone) {
      sendError(res, 'Se requiere al menos email o teléfono', 400);
      return;
    }

    await chatbotService.saveVisitorContact(sessionId, { name, email, phone });

    sendSuccess(res, { message: 'Contacto guardado correctamente' });
  } catch (error) {
    next(error);
  }
}

// ============================================
// ENDPOINTS PARA ADMIN
// ============================================

/**
 * GET /api/chat/conversations
 * Obtener todas las conversaciones (admin)
 */
export async function getConversations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, hasContact, limit, offset } = req.query;

    const result = await chatbotService.getAllConversations({
      status: status as ChatStatus,
      hasContact: hasContact === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/chat/conversations/:id
 * Obtener detalle de una conversación (admin)
 */
export async function getConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const conversation = await chatbotService.getConversationById(id);

    if (!conversation) {
      sendError(res, 'Conversación no encontrada', 404);
      return;
    }

    sendSuccess(res, conversation);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/chat/conversations/:id/status
 * Actualizar estado de una conversación (admin)
 */
export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'LEAD_CAPTURED', 'CLOSED', 'ESCALATED'].includes(status)) {
      sendError(res, 'Estado no válido', 400);
      return;
    }

    await chatbotService.updateConversationStatus(id, status as ChatStatus);

    sendSuccess(res, { message: 'Estado actualizado' });
  } catch (error) {
    next(error);
  }
}
