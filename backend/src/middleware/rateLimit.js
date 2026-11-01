import rateLimit from 'express-rate-limit';
import { createRedisRateLimitStore } from '../config/redis.js';

export function createRateLimiter(options, namespace) {
  const store = createRedisRateLimitStore(namespace);
  return rateLimit({
    ...options,
    ...(store ? { store } : {}),
    passOnStoreError: false,
  });
}
