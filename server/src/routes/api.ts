import { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from "./admin.routes.js";
import folderRoutes from "./folders.routes.js"
import llmRoutes from "./llm.routes.js";
import documentsRoutes from "./documents.routes.js";
import notificationsRoutes from "./notifications.routes.js";

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/folders', folderRoutes);
router.use('/documents', documentsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/llm', llmRoutes);

export default router;