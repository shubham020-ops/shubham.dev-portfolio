import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes/api.js';
import { notFound, errorHandler } from './middleware/errors.js';
import { env } from './config/env.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { createRateLimiter } from './middleware/rateLimit.js';

export function createApiRateLimiter() {
  return createRateLimiter({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: (req) => req.path === '/health'
      || (['GET', 'HEAD'].includes(req.method) && ['/portfolio', '/projects', '/skills'].includes(req.path)),
    message: { success: false, error: 'Too many API requests. Please wait a minute and try again.' },
  }, 'api');
}

export function createPublicReadRateLimiter() {
  return createRateLimiter({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: (req) => !['GET', 'HEAD'].includes(req.method)
      || !['/portfolio', '/projects', '/skills'].includes(req.path),
    message: { success: false, error: 'Too many portfolio requests. Please wait a minute and try again.' },
  }, 'public-read');
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.trustProxy);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        connectSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', ...env.cspConnectSources],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
  }));
  app.use(createCorsMiddleware(env.frontendOrigins));
  app.use(compression({ threshold: '1kb' }));
  app.use('/api/v1', createApiRateLimiter());
  app.use('/api/v1', createPublicReadRateLimiter());
  app.use('/api/v1/webhooks/resend', express.raw({ type: 'application/json', limit: '64kb' }));
  app.use(express.json({ limit: '100kb', strict: true }));
  app.use(cookieParser());
  app.use('/api/v1', apiRouter);

  const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
  if (env.nodeEnv === 'production' && fs.existsSync(path.join(frontendDist, 'index.html'))) {
    app.use(express.static(frontendDist, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/') || !req.accepts('html')) return next();
      res.set('Cache-Control', 'no-cache');
      return res.sendFile(path.join(frontendDist, 'index.html'), (error) => error && next(error));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
