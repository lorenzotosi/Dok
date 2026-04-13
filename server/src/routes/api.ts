import { Router } from 'express';
import { createFolder, getFoldersInsideParent, getAllFolders, deleteFolder } from '../controllers/folder.controller.js';
import { createDoc, getDoc, getAllDocuments, deleteDocument } from '../controllers/document.controller.js';

const router = Router();

// Endpoint per le Cartelle
router.post('/folders', createFolder); // Crea una cartella
router.get('/folders', getFoldersInsideParent);    // Ottieni la lista delle cartelle
router.get('/folders/all', getAllFolders);    // Ottieni la lista di tutte le cartelle
router.delete('/folders/:_id', deleteFolder);    // Elimina una cartella

// Endpoint per i Documenti
router.post('/documents', createDoc);
router.get('/documents/:id', getDoc);
router.get('/documents', getAllDocuments);
router.delete('/documents/:id', deleteDocument)

export default router;