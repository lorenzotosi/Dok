import Document from '../models/Document.js';

export class DocumentService {
    static async createDocument(title: string, folderId: string | null = null, visibility: 'private' | 'public' = 'private') {
        const doc = new Document({
            title,
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
}