import { Router } from 'express';
import propertiesRoutes from './properties.routes';
import citiesRoutes from './cities.routes';
import settingsRoutes from './settings.routes';
import authRoutes from './auth.routes';
import uploadRoutes from './upload.routes';
import heroImagesRoutes from './hero-images.routes';
import pageSettingsRoutes from './page-settings.routes';
import leadRoutes from './lead.routes';
import contactRoutes from './contact.routes';
import chatbotRoutes from './chatbot.routes';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Rutas de la API
 */
router.use('/auth', authRoutes);
router.use('/properties', propertiesRoutes);
router.use('/cities', citiesRoutes);
router.use('/settings', settingsRoutes);
router.use('/upload', uploadRoutes);
router.use('/hero-images', heroImagesRoutes);
router.use('/pages', pageSettingsRoutes);
router.use('/leads', leadRoutes);
router.use('/contact', contactRoutes);
router.use('/chat', chatbotRoutes);

export default router;
