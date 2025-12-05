import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../utils/response';

/**
 * Clase de error personalizada
 */
export class AppError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';

    // Mantener el stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware global de manejo de errores
 */
export default function errorHandler(
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log del error en el servidor
  console.error('Error capturado:', {
    message: error.message,
    stack: error.stack,
    url: _req.url,
    method: _req.method,
  });

  // Determinar el código de estado
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  // Determinar el mensaje de error
  const message =
    error instanceof AppError
      ? error.message
      : process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : error.message;

  // Construir respuesta de error
  const response: ErrorResponse = {
    success: false,
    error: message,
  };

  // Agregar detalles de validación
  if (error instanceof AppError && error.details) {
    response.details = error.details;
  }

  // En modo desarrollo, agregar stack trace separado
  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Helper para lanzar errores de validación
 */
export function throwValidationError(errors: Record<string, string>): never {
  throw new AppError('Error de validación', 400, errors);
}

/**
 * Helper para lanzar errores de no encontrado
 */
export function throwNotFound(resource: string = 'Recurso'): never {
  throw new AppError(`${resource} no encontrado`, 404);
}

/**
 * Helper para lanzar errores de no autorizado
 */
export function throwUnauthorized(message: string = 'No autorizado'): never {
  throw new AppError(message, 401);
}

/**
 * Helper para lanzar errores de prohibido
 */
export function throwForbidden(message: string = 'Acceso prohibido'): never {
  throw new AppError(message, 403);
}
