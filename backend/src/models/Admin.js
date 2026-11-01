import mongoose from 'mongoose';
import { normalizeEmail } from '../utils/normalizeEmail.js';

const adminSchema = new mongoose.Schema({
  singletonKey: { type: String, default: 'admin', unique: true, immutable: true, select: false },
  email: { type: String, required: true, unique: true, set: normalizeEmail },
  resendFromEmail: { type: String, default: '', select: false, set: normalizeEmail },
  passwordHash: { type: String, required: true, select: false },
  sessionVersion: { type: Number, default: 0 },
  role: { type: String, enum: ['admin'], default: 'admin', immutable: true },
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema);
