import { Router } from 'express';
import { createFolder, getFoldersInsideParent, getAllFolders, deleteFolder } from '../controllers/folder.controller.js';

const router = Router();

// Endpoint per le Cartelle
router.post('/folders', createFolder); // Crea una cartella
router.get('/folders', getFoldersInsideParent);    // Ottieni la lista delle cartelle
router.get('/folders/all', getAllFolders);    // Ottieni la lista di tutte le cartelle
router.delete('/folders/:_id', deleteFolder);    // Elimina una cartella

export default router;