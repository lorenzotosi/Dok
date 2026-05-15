import { Router } from 'express';
import {getAllUsers, getUserDetails, getUserFileSystem} from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/users', requireAuth, requireAdmin, getAllUsers);
router.get('/users/:id', requireAuth, requireAdmin, getUserDetails);
router.get('/users/:id/filesystem', requireAuth, requireAdmin, getUserFileSystem);

export default router;