import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';
import { throwUnauthorized, throwValidationError } from '../middlewares/error.middleware';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    isSuper: boolean;
  };
}

export interface TokenPayload {
  id: number;
  email: string;
  isSuper: boolean;
}

/**
 * Autentica un usuario y devuelve un token JWT
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { email, password } = credentials;

  // Validar campos
  if (!email || !password) {
    throwValidationError({
      email: !email ? 'El email es requerido' : '',
      password: !password ? 'La contraseña es requerida' : '',
    });
  }

  // Buscar usuario
  const user = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!user) {
    throwUnauthorized('Credenciales inválidas');
  }

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throwUnauthorized('Credenciales inválidas');
  }

  // Generar token JWT
  const token = generateToken({
    id: user.id,
    email: user.email,
    isSuper: user.isSuper,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isSuper: user.isSuper,
    },
  };
}

/**
 * Obtiene los datos del usuario autenticado
 */
export async function getAuthenticatedUser(userId: number) {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isSuper: true,
    },
  });

  if (!user) {
    throwUnauthorized('Usuario no encontrado');
  }

  return user;
}

/**
 * Genera un token JWT
 */
function generateToken(payload: TokenPayload): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  const expiresIn: string = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(payload, jwtSecret, { expiresIn } as jwt.SignOptions);
}

/**
 * Cambia la contraseña del usuario autenticado
 */
export async function changeUserPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Buscar usuario
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throwUnauthorized('Usuario no encontrado');
  }

  // Verificar contraseña actual
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throwUnauthorized('La contraseña actual es incorrecta');
  }

  // Validar nueva contraseña
  if (!newPassword || newPassword.length < 6) {
    throwValidationError({ newPassword: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  // Hash de la nueva contraseña
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Actualizar contraseña
  await prisma.adminUser.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

/**
 * Restablece la contraseña de un usuario por email
 */
export async function resetUserPassword(email: string, newPassword: string): Promise<void> {
  // Buscar usuario por email
  const user = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!user) {
    throwUnauthorized('Usuario no encontrado con ese email');
  }

  // Validar nueva contraseña
  if (!newPassword || newPassword.length < 6) {
    throwValidationError({ newPassword: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  // Hash de la nueva contraseña
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Actualizar contraseña
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
}

/**
 * Crea un usuario admin (helper para seeds/setup)
 */
export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  isSuper?: boolean;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.adminUser.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      isSuper: data.isSuper || false,
    },
  });
}
