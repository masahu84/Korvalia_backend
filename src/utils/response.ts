import { Response } from 'express';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  stack?: string;
}

/**
 * Envía una respuesta exitosa
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return res.status(statusCode).json(response);
}

/**
 * Envía una respuesta de error
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 500,
  details?: any
): Response {
  const response: ErrorResponse = {
    success: false,
    error,
    ...(details && { details }),
  };
  return res.status(statusCode).json(response);
}

/**
 * Envía una respuesta de validación de error
 */
export function sendValidationError(
  res: Response,
  errors: Record<string, string>
): Response {
  return sendError(res, 'Error de validación', 400, errors);
}

/**
 * Envía una respuesta de no encontrado
 */
export function sendNotFound(res: Response, resource: string = 'Recurso'): Response {
  return sendError(res, `${resource} no encontrado`, 404);
}

/**
 * Envía una respuesta de no autorizado
 */
export function sendUnauthorized(res: Response, message: string = 'No autorizado'): Response {
  return sendError(res, message, 401);
}

/**
 * Envía una respuesta de prohibido
 */
export function sendForbidden(res: Response, message: string = 'Acceso prohibido'): Response {
  return sendError(res, message, 403);
}
