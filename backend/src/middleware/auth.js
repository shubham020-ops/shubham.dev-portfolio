import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import Admin from '../models/Admin.js';

export const AUTH_COOKIE = 'portfolio_admin';
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

export function issueSession(adminId, sessionVersion = 0) {
  const csrfToken = randomUUID();
  const token = jwt.sign({ sub: String(adminId), role: 'admin', csrf: csrfToken, ver: sessionVersion }, env.jwtSecret, {
    expiresIn: TOKEN_TTL_SECONDS,
    issuer: 'shubham.dev',
    audience: 'shubham.dev-admin',
  });
  return { token, csrfToken };
}

export function setSessionCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: TOKEN_TTL_SECONDS * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  });
}

export async function requireAdmin(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return res.status(401).json({ success: false, error: 'Please sign in to continue.' });
  let claims;
  try {
    claims = jwt.verify(token, env.jwtSecret, {
      issuer: 'shubham.dev', audience: 'shubham.dev-admin',
    });
  } catch {
    clearSessionCookie(res);
    return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.' });
  }
  if (claims.role !== 'admin' || !claims.sub || !claims.csrf || !Number.isInteger(claims.ver)) {
    clearSessionCookie(res);
    return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.' });
  }
  const admin = await Admin.findById(claims.sub).select('sessionVersion').lean();
  if (!admin || claims.ver !== (admin.sessionVersion ?? 0)) {
    clearSessionCookie(res);
    return res.status(401).json({ success: false, error: 'Your session has expired. Please sign in again.' });
  }
  req.admin = { id: claims.sub, csrfToken: claims.csrf };
  return next();
}

export function requireCsrf(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const origin = req.get('origin');
  const requestOrigin = `${req.protocol}://${req.get('host')}`;
  if (origin && origin !== requestOrigin && env.frontendOrigins.length && !env.frontendOrigins.includes(origin)) {
    return res.status(403).json({ success: false, error: 'Request origin is not allowed.' });
  }
  if (!req.admin || req.get('x-csrf-token') !== req.admin.csrfToken) {
    return res.status(403).json({ success: false, error: 'Security token is missing or expired. Refresh and try again.' });
  }
  return next();
}

export const authTtlSeconds = TOKEN_TTL_SECONDS;
