import path from 'path';
import { saveFile, generateUniqueFileName, deleteFileByUrl } from '../utils/file';

export interface UploadedFile {
  url: string;
  path: string;
}

/**
 * Guarda una imagen en el sistema de archivos y devuelve la URL
 */
export async function savePropertyImage(file: Express.Multer.File): Promise<UploadedFile> {
  const fileName = generateUniqueFileName(file.originalname);
  const relativePath = `uploads/properties/${fileName}`;
  const fullPath = path.join(process.cwd(), relativePath);

  saveFile(file.buffer, fullPath);

  return {
    url: `/${relativePath}`,
    path: fullPath,
  };
}

/**
 * Guarda una imagen de configuración (hero) en el sistema de archivos
 */
export async function saveSettingsImage(file: Express.Multer.File): Promise<UploadedFile> {
  const fileName = generateUniqueFileName(file.originalname);
  const relativePath = `uploads/settings/${fileName}`;
  const fullPath = path.join(process.cwd(), relativePath);

  saveFile(file.buffer, fullPath);

  return {
    url: `/${relativePath}`,
    path: fullPath,
  };
}

/**
 * Guarda múltiples imágenes de propiedades
 */
export async function savePropertyImages(files: Express.Multer.File[]): Promise<UploadedFile[]> {
  const uploadPromises = files.map((file) => savePropertyImage(file));
  return Promise.all(uploadPromises);
}

/**
 * Elimina una imagen por su URL
 */
export function deleteImage(url: string): void {
  deleteFileByUrl(url);
}

/**
 * Elimina múltiples imágenes por sus URLs
 */
export function deleteImages(urls: string[]): void {
  urls.forEach((url) => deleteImage(url));
}
