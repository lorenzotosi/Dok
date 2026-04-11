import mongoose, { Schema, type Document } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  parentId: mongoose.Types.ObjectId | null;
  // ownerId: mongoose.Types.ObjectId; // Lo decommenteremo quando faremo il Login
}

const FolderSchema: Schema = new Schema({
  name: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
}, { 
  timestamps: true, // Crea createdAt e updatedAt in automatico
  optimisticConcurrency: true // FONDAMENTALE PER L'ESAME: Attiva il controllo sui conflitti usando __v
});

export default mongoose.model<IFolder>('Folder', FolderSchema);