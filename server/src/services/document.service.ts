import Document from '../models/Document.js';

export class DocumentService {
    static async createDocument(title: string, ownerId: string, folderId: string | null = null, visibility: 'private' | 'public' = 'private') {
        const doc = new Document({
            title,
            ownerId,
            folderId,
            visibility,
            // Inizializziamo il documento vuoto per Tiptap
            tiptapJson: { type: 'doc', content: [{ type: 'paragraph' }] }
        });
        return await doc.save();
    }

    static async getDocumentById(id: string) {
        return await Document.findById(id);
    }

    static async getPrivateDocumentById(id: string, userId: string) {
        return await Document.findOne({
            _id: id,
            $or: [
                { visibility: 'public' },
                { ownerId: userId },
                { 'sharedWith.userId': userId }
            ]
        });
    }

    static async getPublicDocumentById(id: string) {
        return await Document.findOne({ _id: id, visibility: 'public' });
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

    static async deleteDocument(id: string) {
        return await Document.findByIdAndDelete(id)
    }

    static async renameDocument(id: string, newTitle: string) {
        return await Document.findByIdAndUpdate(id, { title: newTitle }, { new: true });
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
}