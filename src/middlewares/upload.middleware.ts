import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { isValidImageMimeType } from '../utils/file';

/**
 * Configuración de multer para almacenamiento en memoria
 */
const storage = multer.memoryStorage();

/**
 * Filtro de archivos para imágenes
 */
const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (isValidImageMimeType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, WebP, GIF)'));
  }
};

/**
 * Middleware para subir una sola imagen
 */
export const uploadSingleImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('image');

/**
 * Middleware para subir múltiples imágenes
 */
export const uploadMultipleImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por archivo
    files: 20, // Máximo 20 archivos
  },
}).array('images', 20);

/**
 * Middleware para subir imágenes con campos específicos
 */
export const uploadPropertyImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por archivo
    files: 20,
  },
}).fields([
  { name: 'images', maxCount: 20 },
]);

/**
 * Middleware opcional para subir múltiples imágenes
 * Si el Content-Type es JSON, lo omite
 */
export const uploadMultipleImagesOptional = (req: any, res: any, next: any): void => {
  // Si es JSON, continuar sin procesar archivos
  if (req.is('application/json')) {
    return next();
  }

  // Si es FormData, usar multer
  uploadMultipleImages(req, res, next);
};

/**
 * Wrapper para manejar errores de multer
 */
export function handleMulterError(err: any, _req: Request, res: any, next: any): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 5MB',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Demasiados archivos. Máximo: 20 archivos',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Campo de archivo inesperado',
      });
    }
    return res.status(400).json({
      success: false,
      error: `Error al subir archivo: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Error al subir archivo',
    });
  }

  next();
}
