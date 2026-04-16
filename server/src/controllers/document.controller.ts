import { type Request, type Response } from 'express';
import { DocumentService } from '../services/document.service.js';
import { type AuthRequest } from '../middlewares/auth.middleware.js';

export const createDoc = async (req: AuthRequest, res: Response) => {
    try {
        const { title, folderId, visibility } = req.body;
        const ownerId = req.user!.id;
        const doc = await DocumentService.createDocument(title || 'Documento Senza Titolo', ownerId, folderId, visibility);
        res.status(201).json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Errore creazione documento' });
    }
};

export const getDoc = async (req: Request, res: Response) => {
    try {
        const doc = await DocumentService.getDocumentById(req.params.id as string);
        if (!doc) {
            res.status(404).json({ error: 'Documento non trovato' });
            return;
        }
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Errore recupero documento' });
    }
};

export const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const parentId = (req.query.parentId as string) || null;
        const docs = await DocumentService.getAllDocuments(parentId);
        if (!docs) {
            res.status(404).json({ error: 'Nessun documento trovato' });
            return;
        }
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: 'Errore recupero documenti' });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const documentId = req.params.id as string
        const doc = await DocumentService.deleteDocument(documentId)
        res.status(200).json(doc)
    } catch (error) {
        res.status(500).json({ error: 'Errore eliminazione documento' })
    }
};

export const renameDocument = async (req: Request, res: Response) => {
    try {
        const { id, newTitle } = req.body;
        const doc = await DocumentService.renameDocument(id, newTitle);
        res.status(200).json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Errore rinomina documento' });
    }
};