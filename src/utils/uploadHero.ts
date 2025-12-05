import path from 'path';
import { saveFile, generateUniqueFileName } from './file';

export interface UploadedHeroImage {
  url: string;
  path: string;
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Valida que el archivo sea una imagen válida para el Hero
 */
export function validateHeroImage(file: Express.Multer.File): { valid: boolean; error?: string } {
  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Validar extensión
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Formato no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Validar MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: 'El archivo no es una imagen válida',
    };
  }

  return { valid: true };
}

/**
 * Guarda una imagen del Hero en /uploads/hero/
 */
export async function saveHeroImage(file: Express.Multer.File): Promise<UploadedHeroImage> {
  // Validar archivo
  const validation = validateHeroImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fileName = generateUniqueFileName(file.originalname);
  const relativePath = `uploads/hero/${fileName}`;
  const fullPath = path.join(process.cwd(), relativePath);

  saveFile(file.buffer, fullPath);

  return {
    url: `/${relativePath}`,
    path: fullPath,
  };
}

/**
 * Guarda múltiples imágenes del Hero
 */
export async function saveHeroImages(files: Express.Multer.File[]): Promise<UploadedHeroImage[]> {
  const uploadPromises = files.map((file) => saveHeroImage(file));
  return Promise.all(uploadPromises);
}
