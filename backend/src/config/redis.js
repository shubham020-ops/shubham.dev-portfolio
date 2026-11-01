import { createClient } from 'redis';
import { RedisStore } from 'rate-limit-redis';
import { env } from './env.js';

export const redisClient = env.redisUrl
  ? createClient({
      url: env.redisUrl,
      socket: { connectTimeout: 5000 },
    })
  : null;

function waitForRedisReady(client) {
  if (client.isReady) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onReady = () => {
      clearTimeout(timeout);
      resolve();
    };
    const timeout = setTimeout(() => {
      client.off('ready', onReady);
      reject(new Error('Redis did not become ready before the rate-limit command timed out.'));
    }, 5000).unref();
    client.once('ready', onReady);
    if (client.isReady) onReady();
  });
}

redisClient?.on('error', () => {
  process.stderr.write('Redis rate-limit store error. Check REDIS_URL and Redis availability.\n');
});

export function createRedisRateLimitStore(prefix, client = redisClient) {
  if (!client) return undefined;
  return new RedisStore({
    prefix: `shubham:${prefix}:`,
    sendCommand: async (...args) => {
      await waitForRedisReady(client);
      return client.sendCommand(args);
    },
  });
}

export async function connectRedis() {
  if (!redisClient || redisClient.isReady) return Boolean(redisClient);
  let timeout;
  try {
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Redis connection timed out.')), 10000).unref();
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
  return true;
}

export const isRedisConfigured = () => Boolean(redisClient);
export const isRedisReady = () => !redisClient || redisClient.isReady;

export async function closeRedis() {
  if (!redisClient) return;
  if (redisClient.isReady) await redisClient.quit();
  else if (redisClient.isOpen) redisClient.destroy();
}
