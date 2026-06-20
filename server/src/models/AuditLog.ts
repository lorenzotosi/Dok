import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IAuditLog extends MongooseDocument {
    documentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: 'access' | 'modification';
    charactersInserted?: number;
    charactersDeleted?: number;
    createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['access', 'modification'], required: true },
    charactersInserted: { type: Number, default: 0 },
    charactersDeleted: { type: Number, default: 0 },
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

AuditLogSchema.index({ documentId: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);