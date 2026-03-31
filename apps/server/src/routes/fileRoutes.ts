// apps/server/src/routes/fileRoutes.ts
import { Router } from 'express';
import { fileController } from '../controllers/fileController.js';

const router = Router();

// Endpoint RESTful
router.post('/', fileController.createNode);
router.put('/:id', fileController.updateNode);

export default router;