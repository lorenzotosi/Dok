import type { Response } from 'express';
import { DocumentService } from '../services/document.service.js';
import { type AuthRequest } from '../middlewares/auth.middleware.js';
import { UserModel } from '../models/User.js';


export const createDoc = async (req: AuthRequest, res: Response) => {
    try {
        const { title, folderId, visibility } = req.body;
        const ownerId = req.user!.id;
        const doc = await DocumentService.createDocument(
            title || 'Documento Senza Titolo',
            ownerId,
            folderId,
            visibility
        );

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
        const documentId = req.params.id as string;
        const ownerId = req.user!.id;
        const doc = await DocumentService.getDocumentById(documentId);

        if (!doc) return res.status(404).json({ error: 'Documento non trovato' });

        if (doc.ownerId.toString() !== ownerId) {
            return res.status(403).json({ error: 'Non hai il permesso di eliminare questo documento' });
        }

        const docOk = await DocumentService.deleteDocument(doc);
        res.status(200).json(docOk);
    } catch (error) {
        res.status(500).json({ error: 'Errore eliminazione documento' });
    }
};

export const renameDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id, newTitle } = req.body;
        const userId = req.user!.id;
        const doc = await DocumentService.getDocumentById(id);

        if (!doc) return res.status(404).json({ error: 'Documento non trovato' });
        if (doc.ownerId.toString() !== userId) return res.status(403).json({ error: 'Non hai i permessi' });

        const fullDoc = await DocumentService.renameDocument(id, newTitle);
        res.status(200).json(fullDoc);
    } catch (error) {
        res.status(500).json({ error: 'Errore rinomina documento' });
    }
};

export const getSharedDocs = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const docs = await DocumentService.getSharedDocuments(userId);
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: 'Errore recupero documenti condivisi' });
    }
};

export const shareDoc = async (req: AuthRequest, res: Response) => {
    try {
        const { id, email, role } = req.body;
        const requesterId = req.user!.id;

        const userToShareWith = await UserModel.findOne({ email });
        if (!userToShareWith) return res.status(404).json({ error: 'Utente non trovato' });

        const targetUserId = userToShareWith._id.toString();
        if (targetUserId === requesterId) return res.status(400).json({ error: 'Impossibile condividere con se stessi' });

        const doc = await DocumentService.getDocumentById(id);
        if (!doc) return res.status(404).json({ error: 'Documento non trovato' });
        if (doc.ownerId.toString() !== requesterId) return res.status(403).json({ error: 'Solo il proprietario può condividere' });

        const isAlreadyShared = doc.sharedWith.some((share: any) =>
            (share.userId._id || share.userId).toString() === targetUserId
        );

        const docForNotify = await DocumentService.shareDocument(id, requesterId, targetUserId, role, isAlreadyShared);
        res.json(docForNotify);
    } catch (error) {
        res.status(500).json({ error: 'Errore condivisione documento' });
    }
};

export const unshareDoc = async (req: AuthRequest, res: Response) => {
    try {
        const { id, userId: targetUserId } = req.body;
        const requesterId = req.user!.id;

        const doc = await DocumentService.getDocumentById(id);
        if (!doc) return res.status(404).json({ error: 'Documento non trovato' });
        if (doc.ownerId.toString() !== requesterId) return res.status(403).json({ error: 'Solo il proprietario può rimuovere la condivisione' });

        const docForNotify = await DocumentService.unshareDocument(id, requesterId, targetUserId);
        res.json(docForNotify);
    } catch (error) {
        res.status(500).json({ error: 'Errore rimozione condivisione' });
    }
};

export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user!.id;

        if (!content || content.trim() === '') {
            res.status(400).json({ error: 'Il contenuto del commento non può essere vuoto' });
            return;
        }

        const comment = await DocumentService.addComment(id, userId, content);
        res.status(201).json(comment);
    } catch (error: any) {
        if (error.message === 'Documento non trovato') {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes('permessi')) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Errore durante l\'aggiunta del commento' });
        }
    }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id, commentId } = req.params;
        const userId = req.user!.id;

        await DocumentService.deleteComment(id, commentId, userId);
        res.status(200).json({ success: true });
    } catch (error: any) {
        if (error.message === 'Documento non trovato' || error.message === 'Commento non trovato') {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes('permessi')) {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Errore durante l\'eliminazione del commento' });
        }
    }
};