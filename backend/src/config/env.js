import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { normalizeEmail } from '../utils/normalizeEmail.js';

// Load the backend's own .env even when the server is started from the repo root.
// Existing process environment values (such as Hostinger's dashboard settings) take precedence.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const name of required) {
  if (!process.env[name]?.trim()) throw new Error(`Missing required environment variable: ${name}`);
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters.');
}

const nodeEnv = process.env.NODE_ENV || 'development';
function parseInteger(name, value, fallback, min, max) {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

function parseTrustProxy(value) {
  const normalized = value?.trim();
  if (!normalized || normalized.toLowerCase() === 'false') return false;
  if (normalized.toLowerCase() === 'true') {
    throw new Error('TRUST_PROXY cannot be true; configure a proxy hop count or trusted proxy address/subnet.');
  }
  if (/^-?\d+$/.test(normalized)) {
    const hops = Number(normalized);
    if (hops < 0) throw new Error('TRUST_PROXY hop count cannot be negative.');
    return hops;
  }
  const proxies = normalized.split(',').map((proxy) => proxy.trim());
  if (proxies.some((proxy) => !proxy)) {
    throw new Error('TRUST_PROXY must be false, a non-negative hop count, or a comma-separated proxy address/subnet list.');
  }
  return proxies.length === 1 ? proxies[0] : proxies;
}

const trustProxy = parseTrustProxy(process.env.TRUST_PROXY);
const port = parseInteger('PORT', process.env.PORT, 3001, 1, 65535);
const mongoMaxPoolSize = parseInteger('MONGODB_MAX_POOL_SIZE', process.env.MONGODB_MAX_POOL_SIZE, 20, 1, 100);
const mongoWaitQueueTimeoutMS = parseInteger('MONGODB_WAIT_QUEUE_TIMEOUT_MS', process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS, 5000, 100, 60000);
const redisUrl = process.env.REDIS_URL?.trim() || '';
if (redisUrl) {
  let parsedRedisUrl;
  try { parsedRedisUrl = new URL(redisUrl); } catch { throw new Error('REDIS_URL must be a valid redis:// or rediss:// URL.'); }
  if (!['redis:', 'rediss:'].includes(parsedRedisUrl.protocol) || !parsedRedisUrl.hostname) {
    throw new Error('REDIS_URL must be a valid redis:// or rediss:// URL.');
  }
}
const sameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
if (!['strict', 'lax', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAME_SITE must be strict, lax, or none.');
}
const secureCookie = nodeEnv === 'production'
  ? true
  : process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE.toLowerCase() === 'true'
    : false;
if (sameSite === 'none' && !secureCookie) {
  throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true.');
}

const configuredOriginVariable = process.env.CORS_ORIGINS?.trim()
  ? 'CORS_ORIGINS'
  : process.env.FRONTEND_URL?.trim() ? 'FRONTEND_URL' : null;
const configuredOriginValues = (configuredOriginVariable ? process.env[configuredOriginVariable] : '')
  .split(',').map((value) => value.trim()).filter(Boolean);
const configuredOrigins = configuredOriginValues.map((value) => {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`${configuredOriginVariable} entries must be valid HTTP(S) origins.`); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`${configuredOriginVariable} entries must be HTTP(S) origins without paths, queries, or fragments.`);
  }
  if (nodeEnv === 'production' && parsed.protocol !== 'https:') {
    throw new Error(`${configuredOriginVariable} must use HTTPS in production.`);
  }
  return parsed.origin;
});
const cspConnectSources = (process.env.CSP_CONNECT_SOURCES || '')
  .split(',').map((value) => value.trim()).filter(Boolean);
for (const source of cspConnectSources) {
  let parsed;
  try { parsed = new URL(source); } catch { throw new Error('CSP_CONNECT_SOURCES entries must be HTTPS origins.'); }
  if (parsed.protocol !== 'https:' || parsed.origin !== source) {
    throw new Error('CSP_CONNECT_SOURCES entries must be HTTPS origins without paths.');
  }
}

export const env = Object.freeze({
  nodeEnv,
  port,
  trustProxy,
  redisUrl,
  mongoMaxPoolSize,
  mongoWaitQueueTimeoutMS,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  adminEmail: normalizeEmail(process.env.ADMIN_EMAIL),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  frontendOrigins: nodeEnv === 'production'
    ? [...new Set(configuredOrigins)]
    : [...new Set(['http://localhost:5173', 'http://localhost:5174', ...configuredOrigins])],
  cspConnectSources,
  cookieSameSite: sameSite,
  cookieSecure: secureCookie,
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET || '',
  contactToEmail: process.env.CONTACT_TO_EMAIL || '',
  contactFromEmail: process.env.CONTACT_FROM_EMAIL || '',
});
