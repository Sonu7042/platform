import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createWebsiteSchema,
  updateWebsiteSchema,
  listWebsitesQuerySchema,
} from '../validators/website.validator.js';
import {
  createWebsiteHandler,
  listWebsitesHandler,
  getWebsiteHandler,
  updateWebsiteHandler,
  deleteWebsiteHandler,
  dashboardStatsHandler,
} from '../controllers/website.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/stats', dashboardStatsHandler);
router.get('/', validateQuery(listWebsitesQuerySchema), listWebsitesHandler);
router.post('/', validateBody(createWebsiteSchema), createWebsiteHandler);
router.get('/:id', getWebsiteHandler);
router.patch('/:id', validateBody(updateWebsiteSchema), updateWebsiteHandler);
router.delete('/:id', deleteWebsiteHandler);

export default router;
