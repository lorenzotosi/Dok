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

    static async getAllDocuments(folderId: string | null = null) {
        return await Document.find({ folderId }).sort({ createdAt: -1 });
    }

    static async deleteDocument(id: string) {
        return await Document.findByIdAndDelete(id)
    }

    static async renameDocument(id: string, newTitle: string) {
        return await Document.findByIdAndUpdate(id, { title: newTitle }, { new: true });
    }

    static async getSharedDocuments(userId: string) {
        return await Document.find({ 'sharedWith.userId': userId }).sort({ createdAt: -1 });
    }

    static async getPublicDocuments() {
        return await Document.find({ visibility: 'public' }).sort({ createdAt: -1 });
    }

    static async getMyDocuments(userId: string) {
        return await Document.find({ ownerId: userId }).sort({ createdAt: -1 });
    }
}