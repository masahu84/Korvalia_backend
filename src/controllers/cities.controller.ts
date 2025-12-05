import { Request, Response, NextFunction } from 'express';
import * as citiesService from '../services/cities.service';
import { sendSuccess } from '../utils/response';

/**
 * GET /api/cities
 * Obtiene todas las ciudades
 */
export async function getAllCities(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cities = await citiesService.getAllCities();
    sendSuccess(res, cities);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/cities/:id
 * Obtiene una ciudad por ID
 */
export async function getCityById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const city = await citiesService.getCityById(id);
    sendSuccess(res, city);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/cities
 * Crea una nueva ciudad
 */
export async function createCity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const city = await citiesService.createCity(req.body);
    sendSuccess(res, city, 'Ciudad creada exitosamente', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/cities/:id
 * Actualiza una ciudad
 */
export async function updateCity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const city = await citiesService.updateCity(id, req.body);
    sendSuccess(res, city, 'Ciudad actualizada exitosamente');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/cities/:id
 * Elimina una ciudad
 */
export async function deleteCity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    await citiesService.deleteCity(id);
    sendSuccess(res, null, 'Ciudad eliminada exitosamente');
  } catch (error) {
    next(error);
  }
}
