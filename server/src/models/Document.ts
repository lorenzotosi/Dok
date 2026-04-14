import mongoose, { Schema, type Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
  title: string;
  folderId: mongoose.Types.ObjectId | null;
  yjsState: Buffer;
  tiptapJson: Record<string, any>;
}

const DocumentSchema: Schema = new Schema({
  title: { type: String, default: 'Documento Senza Titolo' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  
  yjsState: { type: Buffer, default: Buffer.from('') },
  tiptapJson: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  optimisticConcurrency: true
});

export default mongoose.model<IDocument>('Document', DocumentSchema);