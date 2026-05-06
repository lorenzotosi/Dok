import { type Request, type Response } from 'express';
import { DocumentService } from '../services/document.service.js';
import { NotificationService } from '../services/notification.service.js';
import { type AuthRequest } from '../middlewares/auth.middleware.js';
import { UserModel } from '../models/User.js';
import Document from '../models/Document.js';


export const createDoc = async (req: AuthRequest, res: Response) => {
    try {
        const { title, folderId, visibility } = req.body;
        const ownerId = req.user!.id;
        const doc = await DocumentService.createDocument(title || 'Documento Senza Titolo', ownerId, folderId, visibility);

        const io = req.app.get('io');
        if (io) {
            if (visibility === 'public') {
                io.to('global-dashboard').emit('global-document-created', doc);
            } else {
                io.to(`user:${ownerId}`).emit('private-document-created', doc);
            }
        }

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
        const io = req.app.get('io');
        const isPublic = doc?.visibility === 'public';
        //console.log(doc)
        //console.log(ownerId)
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
        //console.log('Documento eliminato')
        if (io) {
            if (isPublic) {
                io.to('global-dashboard').emit('global-document-deleted', documentId);
            } else {
                io.to(`user:${ownerId}`).emit('private-document-deleted', documentId);
            }

            // Notifica tutti i collaboratori dell'eliminazione
            if (doc.sharedWith && doc.sharedWith.length > 0) {
                doc.sharedWith.forEach((share: any) => {
                    const collaboratorId = share.userId._id || share.userId;
                    io.to(`user:${collaboratorId.toString()}`).emit('document-deleted', documentId);
                });
            }
        }
        res.status(200).json(docOk)
    } catch (error) {
        res.status(500).json({ error: 'Errore eliminazione documento' })
    }
};

export const renameDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id, newTitle } = req.body;
        const userId = req.user!.id;
        const io = req.app.get('io');
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
        if (!updatedDoc) return;

        // Popoliamo per le notifiche real-time
        const fullDoc = await Document.findById(id)
            .populate('ownerId', 'firstName lastName')
            .populate('sharedWith.userId', 'firstName lastName email')
            .lean();

        if (io && fullDoc) {
            // Aggiorna tutti quelli che hanno aperto il documento
            io.to(id).emit('document-renamed', fullDoc);

            if (fullDoc.visibility === 'public') {
                io.to('global-dashboard').emit('global-document-renamed', fullDoc);
            }

            if (fullDoc.sharedWith && fullDoc.sharedWith.length > 0) {
                fullDoc.sharedWith.forEach((share: any) => {
                    const collaboratorId = share.userId._id || share.userId;
                    io.to(`user:${collaboratorId.toString()}`).emit('document-renamed', {
                        ...fullDoc,
                        myRole: share.role
                    });
                });
            }
        }
        res.status(200).json(fullDoc);
    } catch (error) {
        console.error("Errore rinomina documento:", error);
        res.status(500).json({ error: 'Errore rinomina documento' });
    }
};

export const getSharedDocs = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const docs = await DocumentService.getSharedDocuments(userId);
        //console.log(docs)
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
        if (!userToShareWith) {
            return res.status(404).json({ error: 'Utente non trovato con questa email' });
        }

        const userId = userToShareWith._id.toString();

        if (userId === requesterId) {
            return res.status(400).json({ error: 'Non puoi condividere un documento con te stesso' });
        }

        const doc = await DocumentService.getDocumentById(id);
        if (!doc) return res.status(404).json({ error: 'Documento non trovato' });

        if (doc.ownerId.toString() !== requesterId) {
            return res.status(403).json({ error: 'Solo il proprietario può condividere questo documento' });
        }

        const isAlreadyShared = doc.sharedWith.some((share: any) => 
            (share.userId._id || share.userId).toString() === userId
        );

        const updatedDoc = await DocumentService.shareDocument(id, userId, role);

        // Prepariamo l'oggetto per il real-time popolando TUTTO ciò che serve al frontend
        const docForNotify = await Document.findById(id)
            .populate('ownerId', 'firstName lastName')
            .populate('sharedWith.userId', 'firstName lastName email')
            .lean() as any;

        const io = req.app.get('io');
        if (io && docForNotify) {
            const notificationTitle = isAlreadyShared ? 'Permessi Aggiornati' : 'Nuova Condivisione';
            const notificationType = isAlreadyShared ? 'PERM_CHANGE' : 'SHARE';
            const actionVerb = isAlreadyShared ? 'ha aggiornato i tuoi permessi per' : 'ha condiviso con te';

            const notification = await NotificationService.createNotification(
                userId,
                requesterId,
                notificationType,
                notificationTitle,
                `${docForNotify.ownerId.firstName} ${docForNotify.ownerId.lastName} ${actionVerb} il documento: ${docForNotify.title}`,
                id,
                `/document/${id}`
            );

            const fullNotification = await notification.populate('sender', 'firstName lastName');

            io.to(`user:${userId}`).emit('new-notification', fullNotification);

            // Notifica tutti quelli che stanno guardando il documento
            io.to(id).emit('document-shared', docForNotify);

            docForNotify.sharedWith.forEach((share: any) => {
                const collaboratorId = share.userId._id || share.userId;
                
                io.to(`user:${collaboratorId.toString()}`).emit('document-shared', {
                    ...docForNotify,
                    myRole: share.role
                });
            });
        }
        res.json(docForNotify);
    } catch (error) {
        res.status(500).json({ error: 'Errore condivisione documento' });
    }
};

export const unshareDoc = async (req: AuthRequest, res: Response) => {
    try {
        const { id, userId } = req.body;
        const requesterId = req.user!.id;

        const doc = await DocumentService.getDocumentById(id);
        if (!doc) return res.status(404).json({ error: 'Documento non trovato' });

        if (doc.ownerId.toString() !== requesterId) {
            return res.status(403).json({ error: 'Solo il proprietario può rimuovere la condivisione' });
        }

        const updatedDoc = await DocumentService.unshareDocument(id, userId);
        const docForNotify = await Document.findById(id)
            .populate('ownerId', 'firstName lastName')
            .populate('sharedWith.userId', 'firstName lastName email')
            .lean() as any;

        const io = req.app.get('io');
        if (io) {
            // Crea una notifica nel database per l'utente rimosso
            const notification = await NotificationService.createNotification(
                userId,
                requesterId,
                'SYSTEM',
                'Accesso Rimosso',
                `${docForNotify.ownerId.firstName} ${docForNotify.ownerId.lastName} ha rimosso il tuo accesso al documento: ${docForNotify.title}`,
                id
            );

            const fullNotification = await notification.populate('sender', 'firstName lastName');

            // Notifica l'utente della nuova notifica
            io.to(`user:${userId}`).emit('new-notification', fullNotification);

            // Notifica chi è stato rimosso per gestire il redirect o la chiusura
            io.to(`user:${userId}`).emit('document-unshared', id);
            
            // Notifica tutti gli altri che sono nel documento per aggiornare la lista collaboratori
            if (docForNotify) {
                io.to(id).emit('document-shared', docForNotify);
            }
        }
        res.json(docForNotify);
    } catch (error) {
        res.status(500).json({ error: 'Errore rimozione condivisione' });
    }
};
