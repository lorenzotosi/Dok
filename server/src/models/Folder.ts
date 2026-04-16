import mongoose, { Schema, type Document } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
}

const FolderSchema: Schema = new Schema({
  name: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
}, { 
  timestamps: true,
  optimisticConcurrency: true //controllo sui conflitti usando __v
});

FolderSchema.index({ ownerId: 1 });

export default mongoose.model<IFolder>('Folder', FolderSchema);