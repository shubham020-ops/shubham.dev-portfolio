import { createApp } from './app.js';
import { connectDatabase, closeDatabase } from './config/database.js';
import { env } from './config/env.js';
import { connectRedis, closeRedis } from './config/redis.js';
import { createGracefulShutdown } from './services/gracefulShutdown.js';
import mongoose from 'mongoose';

async function start() {
  await connectDatabase();
  if (env.redisUrl) await connectRedis();
  else if (env.nodeEnv === 'production') {
    process.stderr.write('Redis is not configured; rate limits use process-local memory and cannot be shared across instances.\n');
  }
  globalThis.mongooseConnection = mongoose.connection;
  const app = createApp();
  const server = app.listen(env.port, () => {
    process.stdout.write(`Portfolio API listening on port ${env.port}; MongoDB connected.\n`);
  });
  const shutdown = createGracefulShutdown({ server, closeDatabase, closeRedis });
  let fatalErrorHandled = false;
  const stopForFatalError = (kind, error) => {
    if (fatalErrorHandled) return;
    fatalErrorHandled = true;
    process.stderr.write(`${kind} received (${error?.name || 'Error'}); shutting down.\n`);
    void shutdown(kind, 1);
  };

  process.once('SIGINT', () => { void shutdown('SIGINT'); });
  process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.once('unhandledRejection', (reason) => stopForFatalError('Unhandled rejection', reason));
  process.once('uncaughtException', (error) => stopForFatalError('Uncaught exception', error));
  server.once('error', (error) => stopForFatalError('HTTP server error', error));
}

start().catch(async (error) => {
  process.stderr.write(`Startup failed (${error?.name || 'Error'}). Check backend environment settings and MongoDB network/database access.\n`);
  await Promise.allSettled([closeDatabase(), closeRedis()]);
  process.exitCode = 1;
});
