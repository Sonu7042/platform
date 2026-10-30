import { Router } from 'express';
import authRoutes from './auth.routes.js';
import websiteRoutes from './website.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/websites', websiteRoutes);

export default router;
