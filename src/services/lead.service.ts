import prisma from '../prisma/client';
import { throwValidationError } from '../middlewares/error.middleware';

export interface CreateLeadData {
  email?: string;
  phone?: string;
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
 * Valida un teléfono español (9 dígitos, puede empezar con +34)
 */
function validatePhone(phone: string): boolean {
  // Eliminar espacios y guiones
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  // Aceptar formatos: 612345678, +34612345678, 0034612345678
  const phoneRegex = /^(\+34|0034)?[6789]\d{8}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Crea un nuevo lead (puede ser por email o por teléfono)
 */
export async function createLead(data: CreateLeadData) {
  const { email, phone, source = 'cta_home' } = data;

  // Debe tener al menos email o teléfono
  if (!email && !phone) {
    throwValidationError({ contact: 'Debes proporcionar un email o teléfono' });
  }

  // Validar email si se proporciona
  if (email && !validateEmail(email)) {
    throwValidationError({ email: 'Email inválido' });
  }

  // Validar teléfono si se proporciona
  if (phone && !validatePhone(phone)) {
    throwValidationError({ phone: 'Teléfono inválido. Introduce un número español válido.' });
  }

  // Normalizar datos
  const normalizedEmail = email ? email.toLowerCase().trim() : null;
  const normalizedPhone = phone ? phone.replace(/[\s\-]/g, '') : null;

  // Verificar si ya existe un lead con ese email o teléfono
  const existingLead = await prisma.lead.findFirst({
    where: {
      OR: [
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    },
  });

  if (existingLead) {
    // Si ya existe, actualizar la fecha y añadir el campo que faltaba
    return prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        updatedAt: new Date(),
        ...(normalizedEmail && !existingLead.email ? { email: normalizedEmail } : {}),
        ...(normalizedPhone && !existingLead.phone ? { phone: normalizedPhone } : {}),
      },
    });
  }

  // Crear nuevo lead
  return prisma.lead.create({
    data: {
      email: normalizedEmail,
      phone: normalizedPhone,
      source,
      status: 'NEW',
    },
  });
}

/**
 * Crea un lead solo con teléfono (para el CTA)
 */
export async function createPhoneLead(phone: string, source: string = 'cta_home') {
  // Validar teléfono
  if (!phone || !validatePhone(phone)) {
    throwValidationError({ phone: 'Teléfono inválido. Introduce un número español válido.' });
  }

  const normalizedPhone = phone.replace(/[\s\-]/g, '');

  // Verificar si ya existe
  const existingLead = await prisma.lead.findFirst({
    where: { phone: normalizedPhone },
  });

  if (existingLead) {
    // Actualizar fecha
    return prisma.lead.update({
      where: { id: existingLead.id },
      data: { updatedAt: new Date() },
    });
  }

  // Crear nuevo lead
  return prisma.lead.create({
    data: {
      phone: normalizedPhone,
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
