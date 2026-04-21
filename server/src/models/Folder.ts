import mongoose, { Schema, type Document } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
  visibility: 'private' | 'public';
}

const FolderSchema: Schema = new Schema({
  name: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
}, { 
  timestamps: true,
  optimisticConcurrency: true //controllo sui conflitti usando __v
});

FolderSchema.index({ ownerId: 1 });

export default mongoose.model<IFolder>('Folder', FolderSchema);