// apps/server/src/models/FileModel.ts
import { Schema, model, Document } from 'mongoose';
import type { IFileNode } from 'shared';

// Estendiamo il Document di Mongoose con la nostra interfaccia condivisa
export interface IFileNodeDocument extends Omit<IFileNode, '_id'>, Document {}

const FileNodeSchema = new Schema<IFileNodeDocument>({
  name: { type: String, required: true },
  isFolder: { type: Boolean, required: true, default: false },
  parentId: { type: String, default: null }, // null = Root folder
  ownerId: { type: String, required: true },
  // Non definiamo __v qui, lo gestisce Mongoose, ma abilitiamo la concorrenza!
}, {
  timestamps: true, // Gestisce createdAt e updatedAt automaticamente
  optimisticConcurrency: true // <-- PATTERN: OPTIMISTIC LOCKING ATTIVATO
});

// Indici per velocizzare la ricerca (es. "Trovami tutti i file in questa cartella")
FileNodeSchema.index({ parentId: 1 });
FileNodeSchema.index({ ownerId: 1 });

export const FileModel = model<IFileNodeDocument>('FileNode', FileNodeSchema);