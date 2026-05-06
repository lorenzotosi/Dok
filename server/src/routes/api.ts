import { Router } from 'express';
import { createFolder, getFoldersInsideParent, getAllFolders, deleteFolder } from '../controllers/folder.controller.js';
import { createDoc, getDoc, getAllDocuments, deleteDocument, renameDocument, getSharedDocs, shareDoc, unshareDoc } from '../controllers/document.controller.js';
import { getNotifications, getUnreadNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller.js';
import { requireBodyField, validateMongoIdParam } from '../middlewares/validation.middleware.js';
import authRoutes from './auth.routes.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import adminRoutes from "./admin.routes.js";

const router = Router();

//rotte in cu-el file di nome auth.routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

// Endpoint per le Notifiche
router.get('/notifications', requireAuth, getNotifications);
router.get('/notifications/unread', requireAuth, getUnreadNotifications);
router.put('/notifications/read-all', requireAuth, markAllAsRead);
router.put('/notifications/:id/read', requireAuth, /*validateMongoIdParam('id'),*/ markAsRead);
router.delete('/notifications/:id', requireAuth, /*validateMongoIdParam('id'),*/ deleteNotification);

// Endpoint per le Cartelle
router.post('/folders', requireAuth, requireBodyField('name'), createFolder); // Crea una cartella, 'name' obbligatorio
router.get('/folders', optionalAuth, getFoldersInsideParent);    // Ottieni la lista delle cartelle
router.get('/folders/all', optionalAuth, getAllFolders);    // Ottieni la lista di tutte le cartelle
router.delete('/folders/:_id', requireAuth, validateMongoIdParam('_id'), deleteFolder);    // Elimina cartella (ID valido richiesto)

// Endpoint per i Documenti
router.post('/documents', requireAuth, requireBodyField('title'), createDoc);
router.get('/documents/shared', requireAuth, getSharedDocs);
router.get('/documents/:id', optionalAuth, getDoc);
router.get('/documents', optionalAuth, getAllDocuments);
router.delete('/documents/:id', requireAuth, validateMongoIdParam('id'), deleteDocument);
router.put('/documents/rename', requireAuth, requireBodyField('id'), requireBodyField('newTitle'), renameDocument);
router.put('/documents/share', requireAuth, requireBodyField('id'), requireBodyField('email'), requireBodyField('role'), shareDoc);
router.put('/documents/unshare', requireAuth, requireBodyField('id'), requireBodyField('userId'), unshareDoc);

export default router;