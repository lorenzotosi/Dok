import Document, {type IDocument} from '../models/Document.js';
import {NotificationManager} from "../sockets/notificationManager.js";
import {NotificationService} from "./notification.service.js";

export class DocumentService {
    static async createDocument(title: string, ownerId: string, folderId: string | null = null, visibility: 'private' | 'public' = 'private') {
        const doc = new Document({
            title,
            ownerId,
            folderId,
            visibility,
            tiptapJson: { type: 'doc', content: [{ type: 'paragraph' }] }
        });
        const savedDoc = await doc.save();

        NotificationManager.notifyDocumentCreated(savedDoc);
        this.updateAdminMetricsAsync(ownerId).catch(err =>
            console.error('[Background Task] Errore update admin metrics:', err)
        );
        return savedDoc;
    }

    private static async updateAdminMetricsAsync(ownerId: string) {
        const docsCount = await Document.countDocuments({ ownerId });
        NotificationManager.notifyAdminMetricsUpdate(ownerId, { docsCreated: docsCount });
    }

    private static async updateSharingMetricsAsync(ownerId: string, targetUserId: string) {
        try {
            const [docsSharedByMe, docsSharedWithMe] = await Promise.all([
                Document.countDocuments({
                    ownerId: ownerId,
                    'sharedWith.0': { $exists: true }
                }),
                Document.countDocuments({
                    'sharedWith.userId': targetUserId
                })
            ]);
            NotificationManager.notifyAdminMetricsUpdate(ownerId, { docsSharedByMe });
            NotificationManager.notifyAdminMetricsUpdate(targetUserId, { docsSharedWithMe });
        } catch (err) {
            console.error('[Background Task] Errore update sharing metrics:', err);
        }
    }

    static async getDocumentById(id: string) {
        return Document.findById(id);
    }

    static async getPrivateDocumentById(id: string, userId: string) {
        return Document.findOne({
            _id: id,
            $or: [
                {visibility: 'public'},
                {ownerId: userId},
                {'sharedWith.userId': userId}
            ]
        }).populate('ownerId', 'firstName lastName email')
            .populate('sharedWith.userId', 'firstName lastName email')
            .populate('comments.userId', 'firstName lastName email');
    }

    static async getPublicDocumentById(id: string) {
        return Document.findOne({_id: id, visibility: 'public'})
            .populate('ownerId', 'firstName lastName email')
            .populate('comments.userId', 'firstName lastName email');
    }

    static async getAllDocuments(userId: string | null, folderId: string | null = null) {
        let query: any = { folderId };
        if (!userId) {
            query.visibility = 'public';
        } else {
            query.$or = [
                { ownerId: userId, folderId },
                { visibility: 'public', folderId }
            ];
        }

        const docs = await Document.find(query)
            .populate('ownerId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .lean();

        if (userId) {
            return docs.map(doc => {
                const ownerIdStr = doc.ownerId._id ? doc.ownerId._id.toString() : doc.ownerId.toString();
                if (ownerIdStr === userId) return doc;

                const shareEntry = (doc.sharedWith as any[])?.find(s => s.userId.toString() === userId);
                return {
                    ...doc,
                    myRole: shareEntry ? shareEntry.role : null
                };
            });
        }
        return docs;
    }

    static async deleteDocument(doc: IDocument) {
        const docOK = await Document.findByIdAndDelete(doc._id)
        NotificationManager.notifyDocumentDeleted(doc)
        return docOK
    }

    static async renameDocument(id: string, newTitle: string) {
        const updatedDoc = await Document.findByIdAndUpdate(id, { title: newTitle }, { returnDocument: 'after' });
        if (!updatedDoc) return null;

        const fullDoc = await Document.findById(id)
            .populate('ownerId', 'firstName lastName')
            .populate('sharedWith.userId', 'firstName lastName email')
            .lean();

        if (fullDoc) {
            NotificationManager.notifyDocumentRenamed(fullDoc);
        }
        return fullDoc;
    }

    static async getSharedDocuments(userId: string) {
        const docs = await Document.find({ 'sharedWith.userId': userId })
            .populate('ownerId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .lean();

        return docs.map(doc => {
            const shareEntry = (doc.sharedWith as any[])?.find(s => s.userId.toString() === userId);
            return {
                ...doc,
                myRole: shareEntry ? shareEntry.role : null
            };
        });
    }

    static async shareDocument(id: string, requesterId: string, targetUserId: string, role: 'editor' | 'viewer' | 'commenter', isAlreadyShared: boolean) {
        if (isAlreadyShared) {
            await Document.findOneAndUpdate(
                { _id: id, 'sharedWith.userId': targetUserId },
                { $set: { 'sharedWith.$.role': role } },
                { returnDocument: 'after' }
            );
        } else {
            await Document.findByIdAndUpdate(
                id,
                { $push: { sharedWith: { userId: targetUserId, role } } },
                { returnDocument: 'after' }
            );
        }

        const docForNotify = await Document.findById(id)
            .populate('ownerId', 'firstName lastName')
            .populate('sharedWith.userId', 'firstName lastName email')
            .lean() as any;

        if (docForNotify) {
            const notificationTitle = isAlreadyShared ? 'Permessi Aggiornati' : 'Nuova Condivisione';
            const notificationType = isAlreadyShared ? 'PERM_CHANGE' : 'SHARE';
            const actionVerb = isAlreadyShared ? 'ha aggiornato i tuoi permessi per' : 'ha condiviso con te';

            const notification = await NotificationService.createNotification(
                targetUserId,
                requesterId,
                notificationType,
                notificationTitle,
                `${docForNotify.ownerId.firstName} ${docForNotify.ownerId.lastName} ${actionVerb} il documento: ${docForNotify.title}`,
                id,
                `/document/${id}`
            );

            const fullNotification = await notification.populate('sender', 'firstName lastName');

            NotificationManager.notifyDocumentShared(docForNotify, targetUserId, fullNotification);
            this.updateSharingMetricsAsync(requesterId, targetUserId).catch(err =>
                console.error('[Service] Errore aggiornamento metriche:', err)
            );
        }
        return docForNotify;
    }

    static async unshareDocument(id: string, requesterId: string, targetUserId: string) {
        await Document.findByIdAndUpdate(id, { $pull: { sharedWith: { userId: targetUserId } } }, { returnDocument: 'after' });

        const docForNotify = await Document.findById(id)
            .populate('ownerId', 'firstName lastName')
            .populate('sharedWith.userId', 'firstName lastName email')
            .lean() as any;

        if (docForNotify) {
            const notification = await NotificationService.createNotification(
                targetUserId,
                requesterId,
                'SYSTEM',
                'Accesso Rimosso',
                `${docForNotify.ownerId.firstName} ${docForNotify.ownerId.lastName} ha rimosso il tuo accesso al documento: ${docForNotify.title}`,
                id
            );

            const fullNotification = await notification.populate('sender', 'firstName lastName');
            NotificationManager.notifyDocumentUnshared(id, docForNotify, targetUserId, fullNotification);
            this.updateSharingMetricsAsync(requesterId, targetUserId).catch(err =>
                console.error('[Service] Errore aggiornamento metriche:', err)
            );
        }
        return docForNotify;
    }

    static async addComment(id: string, userId: string, content: string) {
        const doc = await Document.findById(id);
        if (!doc) throw new Error('Documento non trovato');

        const isOwner = doc.ownerId.toString() === userId;
        const isSharedWithWriteAccess = doc.sharedWith.some(
            s => s.userId.toString() === userId && (s.role === 'editor' || s.role === 'commenter')
        );

        if (!isOwner && !isSharedWithWriteAccess) {
            throw new Error('Non hai i permessi per aggiungere commenti a questo documento');
        }

        const comment = {
            userId,
            content
        };
        doc.comments.push(comment as any);
        await doc.save();

        const updatedDoc = await Document.findById(id)
            .populate('comments.userId', 'firstName lastName email');
        
        if (!updatedDoc) throw new Error('Errore durante il salvataggio del commento');

        const addedComment = updatedDoc.comments[updatedDoc.comments.length - 1];

        NotificationManager.notifyCommentAdded(id, addedComment);

        return addedComment;
    }

    static async deleteComment(id: string, commentId: string, userId: string) {
        const doc = await Document.findById(id);
        if (!doc) throw new Error('Documento non trovato');

        const commentIndex = doc.comments.findIndex(c => c._id.toString() === commentId);
        if (commentIndex === -1) throw new Error('Commento non trovato');

        const comment = doc.comments[commentIndex];

        const isCreator = comment.userId.toString() === userId;
        const isOwner = doc.ownerId.toString() === userId;
        const isEditor = doc.sharedWith.some(s => s.userId.toString() === userId && s.role === 'editor');

        if (!isCreator && !isOwner && !isEditor) {
            throw new Error('Non hai i permessi per eliminare questo commento');
        }

        doc.comments.splice(commentIndex, 1);
        await doc.save();

        NotificationManager.notifyCommentDeleted(id, commentId);

        return { success: true };
    }
}