import { httpError } from '../middleware/errors.js';
import { normalizeEmail } from '../utils/normalizeEmail.js';

export function normalizeContactInput(body = {}) {
  const { name, email, subject, type, message, website } = body;
  if (typeof website === 'string' && website.trim()) throw httpError(400, 'Message could not be accepted.');
  const normalizedName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
  const normalizedEmail = normalizeEmail(email);
  const normalizedMessage = typeof message === 'string' ? message.trim() : '';
  const rawSubject = subject === undefined || subject === null || subject === '' ? type : subject;
  if (rawSubject !== undefined && rawSubject !== null && typeof rawSubject !== 'string') throw httpError(400, 'Subject must be text.');
  const normalizedSubject = String(rawSubject || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

  if (normalizedName.length < 2 || normalizedName.length > 100) throw httpError(400, 'Name must be between 2 and 100 characters.');
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) throw httpError(400, 'Enter a valid email address.');
  if (normalizedMessage.length < 20 || normalizedMessage.length > 10000) throw httpError(400, 'Message must be between 20 and 10,000 characters.');

  return { name: normalizedName, email: normalizedEmail, subject: normalizedSubject, message: normalizedMessage };
}
