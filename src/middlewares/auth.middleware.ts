import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendUnauthorized } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    isSuper: boolean;
  };
}

/**
 * Middleware para validar JWT y autenticar usuario
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'Token no proporcionado');
      return;
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no configurado');
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      id: number;
      email: string;
      isSuper: boolean;
    };

    // Agregar usuario a la request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendUnauthorized(res, 'Token expirado');
    } else if (error instanceof jwt.JsonWebTokenError) {
      sendUnauthorized(res, 'Token inválido');
    } else {
      sendUnauthorized(res, 'Error de autenticación');
    }
  }
}

/**
 * Middleware opcional para validar JWT (no falla si no hay token)
 */
export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;

      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as {
          id: number;
          email: string;
          isSuper: boolean;
        };
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // En modo opcional, continuamos aunque el token sea inválido
    next();
  }
}
