import prisma from '../prisma/client';
import { throwValidationError } from '../middlewares/error.middleware';

export interface CreateLeadData {
  email: string;
  source?: string;
}

/**
 * Valida un email
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Crea un nuevo lead
 */
export async function createLead(data: CreateLeadData) {
  const { email, source = 'cta_home' } = data;

  // Validar email
  if (!email || !validateEmail(email)) {
    throwValidationError({ email: 'Email inválido' });
  }

  // Verificar si el email ya existe
  const existingLead = await prisma.lead.findFirst({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingLead) {
    // Si ya existe, actualizar la fecha
    return prisma.lead.update({
      where: { id: existingLead.id },
      data: { updatedAt: new Date() },
    });
  }

  // Crear nuevo lead
  return prisma.lead.create({
    data: {
      email: email.toLowerCase().trim(),
      source,
      status: 'NEW',
    },
  });
}

/**
 * Obtiene todos los leads
 */
export async function getAllLeads() {
  return prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtiene un lead por ID
 */
export async function getLeadById(id: number) {
  const lead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!lead) {
    throw new Error('Lead no encontrado');
  }

  return lead;
}

/**
 * Actualiza el estado de un lead
 */
export async function updateLeadStatus(id: number, status: string, notes?: string) {
  return prisma.lead.update({
    where: { id },
    data: {
      status: status as any,
      notes: notes || undefined,
    },
  });
}

/**
 * Elimina un lead
 */
export async function deleteLead(id: number) {
  return prisma.lead.delete({
    where: { id },
  });
}
