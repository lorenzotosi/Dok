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

    static async getAllDocuments(ownerId: string | null, folderId: string | null = null) {
        if (!ownerId) {
            return await Document.find({ visibility: 'public', folderId }).sort({ createdAt: -1 });
        }
        return await Document.find({ 
            $or: [
                { ownerId, folderId },
                { visibility: 'public', folderId }
            ]
        }).sort({ createdAt: -1 });
    }

    static async deleteDocument(id: string) {
        return await Document.findByIdAndDelete(id)
    }

    static async renameDocument(id: string, newTitle: string) {
        return await Document.findByIdAndUpdate(id, { title: newTitle }, { new: true });
    }

    //da testare se va
    static async getSharedDocuments(userId: string) {
        return await Document.find({ 'sharedWith.userId': userId }).sort({ createdAt: -1 });
    }
}