import mongoose, { Schema, type Document as MongooseDocument } from 'mongoose';

export interface ISharedUser {
  userId: mongoose.Types.ObjectId;
  role: 'viewer' | 'editor' | 'commenter';
}

export interface IComment {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument extends MongooseDocument {
  title: string;
  ownerId: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId | null;
  visibility: 'private' | 'public';
  sharedWith: ISharedUser[];
  yjsState: Buffer;
  tiptapJson: Record<string, any>;
  comments: IComment[];
}

const CommentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }
}, {
  timestamps: true
});

const DocumentSchema: Schema = new Schema({
  title: { type: String, default: 'Documento Senza Titolo' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  sharedWith: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['viewer', 'editor', 'commenter'] }
  }],
  comments: [CommentSchema],
  yjsState: { type: Buffer, default: Buffer.from('') },
  tiptapJson: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  optimisticConcurrency: true
});

DocumentSchema.index({ ownerId: 1 });

export default mongoose.model<IDocument>('Document', DocumentSchema);