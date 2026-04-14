import { Router } from 'express';
import { createFolder, getFoldersInsideParent, getAllFolders, deleteFolder } from '../controllers/folder.controller.js';
import { createDoc, getDoc, getAllDocuments, deleteDocument } from '../controllers/document.controller.js';
import { requireBodyField, validateMongoIdParam } from '../middlewares/validation.middleware.js';
import authRoutes from './auth.routes.js';

const router = Router();

//rotte in cu-el file di nome auth.routes
router.use('/auth', authRoutes);

// Endpoint per le Cartelle
router.post('/folders', requireBodyField('name'), createFolder); // Crea una cartella, 'name' obbligatorio
router.get('/folders', getFoldersInsideParent);    // Ottieni la lista delle cartelle
router.get('/folders/all', getAllFolders);    // Ottieni la lista di tutte le cartelle
router.delete('/folders/:_id', validateMongoIdParam('_id'), deleteFolder);    // Elimina cartella (ID valido richiesto)

// Endpoint per i Documenti
router.post('/documents', requireBodyField('title'), createDoc); // Crea documento, 'title' obbligatorio
router.get('/documents/:id', getDoc);
router.get('/documents', getAllDocuments);
router.delete('/documents/:id', validateMongoIdParam('id'), deleteDocument); // Elimina doc (ID valido richiesto)

export default router;