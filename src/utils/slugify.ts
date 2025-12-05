import prisma from '../prisma/client';

/**
 * Genera un slug a partir de un texto
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .replace(/^-|-$/g, ''); // Eliminar guiones al inicio y final
}

/**
 * Genera un slug único para una propiedad
 */
export async function generateUniquePropertySlug(title: string, excludeId?: number): Promise<string> {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.property.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Genera un slug único para una ciudad
 */
export async function generateUniqueCitySlug(name: string, excludeId?: number): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.city.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
