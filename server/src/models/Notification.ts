import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['SHARE', 'PERM_CHANGE', 'DOCUMENT_DELETE', 'SYSTEM'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  
  read: {
    type: Boolean,
    default: false
  },
  link: { type: String } 
}, {
  timestamps: true
});

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);