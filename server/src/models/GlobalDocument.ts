import mongoose, { Schema, type Document as MongooseDocument } from 'mongoose';

// come il documento normale ma deve essere dentro una cartella perchè è globale
export interface IGlobalDocument extends MongooseDocument {
    title: string;
    folderId: mongoose.Types.ObjectId;
    yjsState: Buffer;
    tiptapJson: Record<string, any>;
}

const GlobalDocumentSchema: Schema = new Schema({
    title: { type: String, default: 'Documento Senza Titolo' },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
    yjsState: { type: Buffer, default: Buffer.from('') },
    tiptapJson: { type: Schema.Types.Mixed, default: {} }
}, {
    timestamps: true,
    optimisticConcurrency: true
});

export default mongoose.model<IGlobalDocument>('GlobalDocument', GlobalDocumentSchema);