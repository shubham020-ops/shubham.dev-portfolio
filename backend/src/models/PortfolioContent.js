import mongoose from 'mongoose';
import { CONTENT_KEYS } from '../config/contentKeys.js';
export { CONTENT_KEYS };

const contentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, enum: CONTENT_KEYS },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true, minimize: false });

export default mongoose.model('PortfolioContent', contentSchema);
