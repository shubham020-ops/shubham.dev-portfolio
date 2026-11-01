import { Resend } from 'resend';
import { env } from '../config/env.js';
import Admin from '../models/Admin.js';
import ContactMessage from '../models/ContactMessage.js';
import { selectVerifiedSenderDomain } from './resendDomain.js';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;
let cachedSender = '';
let cachedSenderUntil = 0;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

async function getSenderAddress(configuredSender = '') {
  if (env.contactFromEmail) return env.contactFromEmail;
  if (configuredSender) return `Shubham.dev <${configuredSender}>`;
  if (cachedSenderUntil > Date.now()) return cachedSender;
  if (!resend) return '';

  const result = await resend.domains.list();
  if (result.error) throw new Error('resend_domain_lookup_failed');
  const domain = selectVerifiedSenderDomain(result.data?.data || []);
  cachedSender = domain ? `Shubham.dev <portfolio@${domain}>` : '';
  cachedSenderUntil = Date.now() + 5 * 60 * 1000;
  return cachedSender;
}

export async function sendContactNotification(message) {
  const attemptedAt = new Date();
  const admin = !env.contactToEmail || !env.contactFromEmail
    ? await Admin.findOne().select('email +resendFromEmail').lean()
    : null;
  const recipient = env.contactToEmail || admin?.email || '';
  if (!resend || !recipient) {
    await ContactMessage.updateOne({ _id: message._id }, {
      $set: { emailStatus: 'not_configured', emailErrorCode: !resend ? 'resend_api_key_missing' : 'admin_contact_email_missing', emailLastAttemptAt: attemptedAt },
      $inc: { emailAttemptCount: 1 },
    });
    return { status: 'not_configured' };
  }

  let from;
  try { from = await getSenderAddress(admin?.resendFromEmail || ''); }
  catch {
    await ContactMessage.updateOne({ _id: message._id }, {
      $set: { emailStatus: 'failed', emailErrorCode: 'resend_domain_lookup_failed', emailLastAttemptAt: attemptedAt },
      $inc: { emailAttemptCount: 1 },
    });
    return { status: 'failed' };
  }
  if (!from) {
    await ContactMessage.updateOne({ _id: message._id }, {
      $set: { emailStatus: 'not_configured', emailErrorCode: 'verified_sender_domain_required', emailLastAttemptAt: attemptedAt },
      $inc: { emailAttemptCount: 1 },
    });
    return { status: 'not_configured' };
  }

  await ContactMessage.updateOne({ _id: message._id }, {
    $set: { emailLastAttemptAt: attemptedAt, emailErrorCode: '' },
    $inc: { emailAttemptCount: 1 },
  });

  try {
    const result = await resend.emails.send({
      from,
      to: [recipient],
      replyTo: message.email,
      subject: `Portfolio enquiry${message.subject ? `: ${message.subject}` : ''}`,
      text: `From: ${message.name} <${message.email}>\nSubject: ${message.subject || 'No subject'}\n\n${message.message}`,
      html: `<h2>New portfolio enquiry</h2><p><strong>From:</strong> ${escapeHtml(message.name)} &lt;${escapeHtml(message.email)}&gt;</p><p><strong>Subject:</strong> ${escapeHtml(message.subject || 'No subject')}</p><pre style="white-space:pre-wrap;font:inherit">${escapeHtml(message.message)}</pre>`,
    }, { idempotencyKey: `portfolio-contact-${message._id}` });

    if (result.error || !result.data?.id) {
      await ContactMessage.updateOne({ _id: message._id }, {
        $set: { emailStatus: 'failed', emailErrorCode: String(result.error?.name || 'resend_request_failed').slice(0, 120) },
      });
      return { status: 'failed' };
    }
    await ContactMessage.updateOne({ _id: message._id }, {
      $set: { emailStatus: 'accepted', providerMessageId: result.data.id, emailErrorCode: '' },
    });
    return { status: 'accepted', providerMessageId: result.data.id };
  } catch (error) {
    await ContactMessage.updateOne({ _id: message._id }, {
      $set: { emailStatus: 'failed', emailErrorCode: String(error?.name || 'resend_request_failed').slice(0, 120) },
    });
    return { status: 'failed' };
  }
}

export function verifyResendWebhook(payload, headers) {
  if (!resend || !env.resendWebhookSecret) throw new Error('Resend webhook verification is not configured.');
  return resend.webhooks.verify({
    payload,
    headers: {
      id: headers['svix-id'],
      timestamp: headers['svix-timestamp'],
      signature: headers['svix-signature'],
    },
    webhookSecret: env.resendWebhookSecret,
  });
}
