import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import Admin from '../models/Admin.js';
import ContactMessage from '../models/ContactMessage.js';
import PortfolioContent, { CONTENT_KEYS } from '../models/PortfolioContent.js';
import { authTtlSeconds, clearSessionCookie, issueSession, requireAdmin, requireCsrf, setSessionCookie } from '../middleware/auth.js';
import { httpError } from '../middleware/errors.js';
import { sendContactNotification, verifyResendWebhook } from '../services/emailService.js';
import { normalizeContactInput } from '../services/contactValidation.js';
import { getHealthResponse } from '../services/healthStatus.js';
import { assertContentKey, stripPrivateSamples, validateContentValue } from '../services/contentValidation.js';
import { normalizeEmail } from '../utils/normalizeEmail.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { isRedisConfigured, isRedisReady } from '../config/redis.js';
import { decodeMessageCursor, encodeMessageCursor } from '../services/messagePagination.js';
import { trustedIn, trustedLessThan } from '../services/trustedMongoOperators.js';

const router = Router();
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, error: 'Too many login attempts. Please wait and try again.' } }, 'login');
const contactLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, error: 'Too many messages were sent. Please wait before trying again.' } }, 'contact');
const passwordChangeLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, error: 'Too many password change attempts. Please wait and try again.' } }, 'password-change');
const noCache = (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };
const send = (res, data, status = 200) => res.status(status).json({ success: true, data });
const hasArrayValue = (value) => Array.isArray(value);
const sortProjects = (items = []) => [...items].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || Number(a.order || 0) - Number(b.order || 0));

router.get('/health', (_req, res) => {
  const result = getHealthResponse(globalThis.mongooseConnection?.readyState, undefined, undefined, {
    redisConfigured: isRedisConfigured(),
    redisReady: isRedisReady(),
  });
  return res.status(result.statusCode).json(result.body);
});

router.get('/portfolio', async (_req, res) => {
  const docs = await PortfolioContent.find({ key: trustedIn(CONTENT_KEYS) }).lean();
  const content = Object.fromEntries(docs.map((doc) => [doc.key, stripPrivateSamples(doc.value)]));
  if (Array.isArray(content.projects)) content.projects = sortProjects(content.projects);
  if (Array.isArray(content.skillGroups)) content.skillGroups.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  return send(res, content);
});
router.get('/projects', async (_req, res) => {
  const doc = await PortfolioContent.findOne({ key: 'projects' }).lean();
  return send(res, stripPrivateSamples(sortProjects((doc?.value || []).filter((project) => project.published !== false && project.isSample !== true))));
});
router.get('/skills', async (_req, res) => {
  const doc = await PortfolioContent.findOne({ key: 'skillGroups' }).lean();
  return send(res, stripPrivateSamples((doc?.value || []).filter((group) => group.published !== false)));
});

router.post('/contact', contactLimiter, async (req, res) => {
  const contact = normalizeContactInput(req.body || {});
  const saved = await ContactMessage.create(contact);
  const emailResult = await sendContactNotification(saved);
  return send(res, { id: saved.id, stored: true, emailStatus: emailResult.status }, 201);
});

router.post('/webhooks/resend', async (req, res) => {
  if (!env.resendWebhookSecret) throw httpError(503, 'Email event tracking is not configured.');
  if (!env.resendApiKey) throw httpError(503, 'Resend API configuration is required for webhook verification.');
  const payload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  const headers = {
    'svix-id': req.get('svix-id'),
    'svix-timestamp': req.get('svix-timestamp'),
    'svix-signature': req.get('svix-signature'),
  };
  let event;
  try { event = verifyResendWebhook(payload, headers); }
  catch { throw httpError(400, 'Webhook signature could not be verified.'); }
  const providerId = event?.data?.email_id || event?.data?.id;
  if (!providerId) return send(res, { received: true });
  const changes = {
    'email.delivered': { emailStatus: 'delivered', emailDeliveredAt: new Date(), emailErrorCode: '' },
    'email.bounced': { emailStatus: 'bounced', emailErrorCode: 'delivery_bounced' },
    'email.complained': { emailStatus: 'bounced', emailErrorCode: 'recipient_complaint' },
  }[event.type];
  if (changes) await ContactMessage.updateOne({ providerMessageId: providerId }, { $set: changes });
  return send(res, { received: true });
});

router.post('/auth/login', loginLimiter, noCache, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password || email.length > 254 || Buffer.byteLength(password, 'utf8') > 72) throw httpError(400, 'Enter your email and password.');
  const admin = await Admin.findOne({ email }).select('+passwordHash');
  const valid = admin ? await bcrypt.compare(password, admin.passwordHash) : false;
  if (!valid) throw httpError(401, 'Email or password is incorrect.');
  const session = issueSession(admin._id, admin.sessionVersion ?? 0);
  setSessionCookie(res, session.token);
  return send(res, { admin: { email: admin.email }, csrfToken: session.csrfToken, expiresIn: authTtlSeconds });
});

router.get('/auth/me', noCache, requireAdmin, async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select('email').lean();
  if (!admin) { clearSessionCookie(res); throw httpError(401, 'Admin account is no longer available.'); }
  return send(res, { admin, csrfToken: req.admin.csrfToken, expiresIn: authTtlSeconds });
});

router.post('/auth/logout', noCache, requireAdmin, requireCsrf, async (req, res) => {
  await Admin.updateOne({ _id: req.admin.id }, { $inc: { sessionVersion: 1 } });
  clearSessionCookie(res);
  return send(res, { loggedOut: true });
});

router.put('/auth/password', passwordChangeLimiter, noCache, requireAdmin, requireCsrf, async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  if (newPassword.length < 14 || Buffer.byteLength(newPassword, 'utf8') > 72) throw httpError(400, 'New password must contain at least 14 characters and at most 72 UTF-8 bytes.');
  const admin = await Admin.findById(req.admin.id).select('+passwordHash');
  if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) throw httpError(401, 'Current password is incorrect.');
  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  admin.sessionVersion = (admin.sessionVersion ?? 0) + 1;
  await admin.save();
  clearSessionCookie(res);
  return send(res, { passwordChanged: true });
});

router.use('/admin', noCache, requireAdmin, requireCsrf);

router.get('/admin/dashboard', async (_req, res) => {
  const docs = await PortfolioContent.find({ key: trustedIn(['projects', 'skillGroups']) }).lean();
  const values = Object.fromEntries(docs.map((doc) => [doc.key, doc.value]));
  const [totalMessages, newMessages, emailFailures, recentMessages] = await Promise.all([
    ContactMessage.countDocuments(),
    ContactMessage.countDocuments({ status: 'new' }),
    ContactMessage.countDocuments({ emailStatus: trustedIn(['failed', 'not_configured']) }),
    ContactMessage.find().sort({ createdAt: -1 }).limit(5).select('name email subject status emailStatus createdAt').lean(),
  ]);
  return send(res, {
    projects: (values.projects || []).length,
    skillGroups: (values.skillGroups || []).length,
    contactMessages: totalMessages,
    newMessages,
    unreadMessages: newMessages,
    emailFailures,
    recentMessages,
  });
});

router.get('/admin/content/:key', async (req, res) => {
  assertContentKey(req.params.key);
  const doc = await PortfolioContent.findOne({ key: req.params.key }).lean();
  const defaultValue = ['navLinks', 'socials', 'skillGroups', 'projects', 'experience', 'testimonials', 'contactTypes'].includes(req.params.key) ? [] : null;
  return send(res, doc ? { key: doc.key, value: doc.value, updatedAt: doc.updatedAt } : { key: req.params.key, value: defaultValue });
});

router.put('/admin/content/:key', async (req, res) => {
  const key = req.params.key;
  const value = validateContentValue(key, req.body?.value);
  const doc = await PortfolioContent.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true, runValidators: true });
  return send(res, { key: doc.key, value: doc.value, updatedAt: doc.updatedAt });
});

router.post('/admin/content/:key/items', async (req, res) => {
  const key = req.params.key;
  assertContentKey(key);
  const item = req.body?.item;
  if (!item || Array.isArray(item) || typeof item !== 'object') throw httpError(400, 'A content record is required.');
  const doc = await PortfolioContent.findOne({ key });
  if (doc && !hasArrayValue(doc.value)) throw httpError(400, 'This section does not contain a list.');
  const value = doc?.value || [];
  const newItem = { ...item, recordId: randomUUID(), published: item.published !== false, order: Number(item.order ?? value.length + 1) };
  validateContentValue(key, [...value, newItem]);
  const saved = await PortfolioContent.findOneAndUpdate({ key }, { $set: { value: [...value, newItem] } }, { upsert: true, new: true, runValidators: true });
  return send(res, { item: newItem, value: saved.value }, 201);
});

router.put('/admin/content/:key/items/:itemId', async (req, res) => {
  const { key, itemId } = req.params;
  assertContentKey(key);
  const doc = await PortfolioContent.findOne({ key });
  if (!doc || !hasArrayValue(doc.value)) throw httpError(404, 'Content record not found.');
  const index = doc.value.findIndex((item) => item.recordId === itemId);
  if (index < 0) throw httpError(404, 'Content record not found.');
  const replacement = { ...req.body?.item, recordId: itemId };
  const value = doc.value.map((item, i) => i === index ? replacement : item);
  validateContentValue(key, value);
  doc.value = value;
  await doc.save();
  return send(res, { item: replacement, value: doc.value });
});

router.delete('/admin/content/:key/items/:itemId', async (req, res) => {
  const { key, itemId } = req.params;
  assertContentKey(key);
  const doc = await PortfolioContent.findOne({ key });
  if (!doc || !hasArrayValue(doc.value)) throw httpError(404, 'Content record not found.');
  const value = doc.value.filter((item) => item.recordId !== itemId);
  if (value.length === doc.value.length) throw httpError(404, 'Content record not found.');
  doc.value = value;
  await doc.save();
  return send(res, { value: doc.value });
});

router.put('/admin/content/:key/reorder', async (req, res) => {
  const key = req.params.key;
  assertContentKey(key);
  const ids = req.body?.ids;
  const doc = await PortfolioContent.findOne({ key });
  if (!doc || !hasArrayValue(doc.value) || !Array.isArray(ids) || ids.length !== doc.value.length) throw httpError(400, 'Invalid order request.');
  const index = new Map(doc.value.map((item) => [item.recordId, item]));
  if (new Set(ids).size !== ids.length || ids.some((id) => !index.has(id))) throw httpError(400, 'Invalid order request.');
  doc.value = ids.map((id, order) => ({ ...index.get(id), order: order + 1 }));
  await doc.save();
  return send(res, { value: doc.value });
});

router.get('/admin/messages', async (req, res) => {
  const requestedLimit = Number(req.query.limit || 100);
  const limit = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(100, requestedLimit)) : 100;
  const query = ['new', 'read', 'archived'].includes(req.query.status) ? { status: req.query.status } : {};
  if (req.query.cursor) {
    const cursor = decodeMessageCursor(req.query.cursor);
    query.$or = [
      { createdAt: trustedLessThan(cursor.createdAt) },
      { createdAt: cursor.createdAt, _id: trustedLessThan(cursor.id) },
    ];
  }
  const results = await ContactMessage.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
  const messages = results.slice(0, limit);
  if (results.length > limit && messages.length) res.set('X-Next-Cursor', encodeMessageCursor(messages.at(-1)));
  return send(res, messages);
});

router.patch('/admin/messages/:id', async (req, res) => {
  const status = req.body?.status;
  if (!['new', 'read', 'archived'].includes(status)) throw httpError(400, 'Message status is invalid.');
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
  if (!message) throw httpError(404, 'Message not found.');
  return send(res, message);
});

router.post('/admin/messages/:id/retry-email', async (req, res) => {
  const message = await ContactMessage.findById(req.params.id);
  if (!message) throw httpError(404, 'Message not found.');
  if (!['failed', 'not_configured'].includes(message.emailStatus)) throw httpError(409, 'Only failed email notifications can be retried.');
  if (message.emailStatus === 'failed' && message.emailLastAttemptAt && Date.now() - message.emailLastAttemptAt.getTime() > 24 * 60 * 60 * 1000) {
    throw httpError(409, 'This notification is past Resend’s 24-hour idempotency window. Check the Resend dashboard before deciding whether to resend.');
  }
  const result = await sendContactNotification(message);
  return send(res, { emailStatus: result.status });
});

router.delete('/admin/messages/:id', async (req, res) => {
  if (req.get('x-confirm-delete') !== 'true') throw httpError(400, 'Explicit deletion confirmation is required.');
  const result = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!result) throw httpError(404, 'Message not found.');
  return send(res, { deleted: true });
});

export default router;
