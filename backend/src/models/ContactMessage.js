import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  subject: { type: String, trim: true, maxlength: 160, default: '' },
  message: { type: String, required: true, trim: true, maxlength: 10000 },
  status: { type: String, enum: ['new', 'read', 'archived'], default: 'new', index: true },
  emailStatus: { type: String, enum: ['not_configured', 'failed', 'accepted', 'delivered', 'bounced'], default: 'not_configured', index: true },
  providerMessageId: { type: String, default: '', index: true },
  emailErrorCode: { type: String, default: '' },
  emailAttemptCount: { type: Number, default: 0 },
  emailLastAttemptAt: { type: Date, default: null },
  emailDeliveredAt: { type: Date, default: null },
}, { timestamps: true });

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ status: 1, createdAt: -1, _id: -1 });

export default mongoose.model('ContactMessage', contactMessageSchema);
