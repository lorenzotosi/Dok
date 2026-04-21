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

export const getDoc = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id || null;
        let doc;
        if (!userId) {
            doc = await DocumentService.getPublicDocumentById(req.params.id as string);
        } else {
            doc = await DocumentService.getPrivateDocumentById(req.params.id as string, userId);
        }
        if (!doc) {
            res.status(404).json({ error: 'Documento non trovato' });
            return;
        }
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Errore recupero documento' });
    }
};

export const getAllDocuments = async (req: AuthRequest, res: Response) => {
    try {
        const parentId = (req.query.parentId as string) || null;
        const userId = req.user?.id || null;
        const docs = await DocumentService.getAllDocuments(userId, parentId);
        if (!docs) {
            res.status(404).json({ error: 'Nessun documento trovato' });
            return;
        }
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: 'Errore recupero documenti' });
    }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
    try {
        const documentId = req.params.id as string
        const ownerId = req.user!.id;
        const doc = await DocumentService.getDocumentById(documentId);
        console.log(doc)
        console.log(ownerId)
        if (!doc) {
            console.log('Documento non trovato')
            res.status(404).json({ error: 'Documento non trovato' });
            return;
        }
        if (doc.ownerId.toString() !== ownerId) {
            console.log('Non hai il permesso di eliminare questo documento')
            res.status(403).json({ error: 'Non hai il permesso di eliminare questo documento' });
            return;
        }
        const docOk = await DocumentService.deleteDocument(documentId)
        console.log('Documento eliminato')
        res.status(200).json(docOk)
    } catch (error) {
        res.status(500).json({ error: 'Errore eliminazione documento' })
    }
};

export const renameDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id, newTitle } = req.body;
        const userId = req.user!.id;

        const doc = await DocumentService.getDocumentById(id);
        if (!doc) {
            res.status(404).json({ error: 'Documento non trovato' });
            return;
        }

        if (doc.ownerId.toString() !== userId) {
            res.status(403).json({ error: 'Non hai il permesso di rinominare questo documento' });
            return;
        }

        const updatedDoc = await DocumentService.renameDocument(id, newTitle);
        res.status(200).json(updatedDoc);
    } catch (error) {
        console.error("Errore rinomina documento:", error);
        res.status(500).json({ error: 'Errore rinomina documento' });
    }
};