import type { Server } from 'socket.io';
import type { IDocument } from '../models/Document.js';

let ioInstance: Server;

export const NotificationManager = {
    init(io: Server) {
        ioInstance = io;
    },

    notifyDocumentCreated(doc: IDocument) {
        if (!ioInstance) return;
        if (doc.visibility === 'public') {
            ioInstance.to('global-dashboard').emit('global-document-created', doc);
        } else {
            ioInstance.to(`user:${doc.ownerId}`).emit('private-document-created', doc);
        }
    },

    notifyDocumentDeleted(doc: IDocument) {
        if (!ioInstance) return;
        if (doc.visibility === 'public') {
            ioInstance.to('global-dashboard').emit('global-document-deleted', doc._id);
        } else {
            ioInstance.to(`user:${doc.ownerId}`).emit('private-document-deleted', doc._id);
        }

        if (doc.sharedWith && doc.sharedWith.length > 0) {
            doc.sharedWith.forEach((share: any) => {
                const collaboratorId = share.userId._id || share.userId;
                ioInstance.to(`user:${collaboratorId.toString()}`).emit('document-deleted', doc._id);
            });
        }
    },

    notifyDocumentRenamed(doc: IDocument) {
        if (!ioInstance) return;
        ioInstance.to(doc._id.toString()).emit('document-renamed', doc);

        if (doc.visibility === 'public') {
            ioInstance.to('global-dashboard').emit('global-document-renamed', doc);
        }

        if (doc.sharedWith && doc.sharedWith.length > 0) {
            doc.sharedWith.forEach((share: any) => {
                const collaboratorId = share.userId._id || share.userId;
                ioInstance.to(`user:${collaboratorId.toString()}`).emit('document-renamed', {
                    ...doc,
                    myRole: share.role
                });
            });
        }
    },

    notifyDocumentShared(doc: IDocument, targetUserId: string, notification: any) {
        if (!ioInstance) return;
        ioInstance.to(`user:${targetUserId}`).emit('new-notification', notification);

        ioInstance.to(doc._id.toString()).emit('document-shared', doc);

        doc.sharedWith.forEach((share: any) => {
            const collaboratorId = share.userId._id || share.userId;
            ioInstance.to(`user:${collaboratorId.toString()}`).emit('document-shared', {
                ...doc,
                myRole: share.role
            });
        });
    },

    notifyDocumentUnshared(docId: string, fullDoc: any, targetUserId: string, notification: any) {
        if (!ioInstance) return;
        ioInstance.to(`user:${targetUserId}`).emit('new-notification', notification);

        ioInstance.to(`user:${targetUserId}`).emit('document-unshared', docId);

        if (fullDoc) {
            ioInstance.to(docId.toString()).emit('document-shared', fullDoc);
        }
    },

    notifyAdminMetricsUpdate(userId: string, docsCount: number) {
        if (!ioInstance) return;
        ioInstance.to('admin:dashboard').emit('user_metrics_update', {
            userId,
            metrics: { docsCreated: docsCount }
        });
    }
};