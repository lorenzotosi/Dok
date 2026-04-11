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
  
  // Salviamo lo stato binario di Y.js. type: Buffer in Node si mappa su BinData in Mongo
  yjsState: { type: Buffer, default: Buffer.from('') }, 
  
  // Un oggetto flessibile per salvare la struttura JSON di Tiptap
  tiptapJson: { type: Schema.Types.Mixed, default: {} }
}, { 
  timestamps: true,
  optimisticConcurrency: true // Previene scritture sovrapposte accidentali
});

export default mongoose.model<IDocument>('Document', DocumentSchema);