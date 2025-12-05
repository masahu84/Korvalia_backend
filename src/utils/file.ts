import fs from 'fs';
import path from 'path';

/**
 * Crea un directorio si no existe
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Guarda un archivo en el sistema de archivos
 */
export function saveFile(buffer: Buffer, filePath: string): void {
  const directory = path.dirname(filePath);
  ensureDirectoryExists(directory);
  fs.writeFileSync(filePath, buffer);
}

/**
 * Elimina un archivo del sistema de archivos
 */
export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Elimina un archivo por su URL relativa
 */
export function deleteFileByUrl(url: string): void {
  try {
    // Extraer la ruta del archivo desde la URL
    // Ej: /uploads/properties/image.jpg -> uploads/properties/image.jpg
    const relativePath = url.startsWith('/') ? url.substring(1) : url;
    const fullPath = path.join(process.cwd(), relativePath);
    deleteFile(fullPath);
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
  }
}

/**
 * Genera un nombre único para un archivo
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const safeName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  return `${safeName}-${timestamp}-${random}${extension}`;
}

/**
 * Valida el tipo MIME de un archivo de imagen
 */
export function isValidImageMimeType(mimetype: string): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(mimetype);
}

/**
 * Valida el tamaño de un archivo (en bytes)
 */
export function isValidFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}
