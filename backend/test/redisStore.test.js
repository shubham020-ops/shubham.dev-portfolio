import test from 'node:test';
import assert from 'node:assert/strict';
import { RedisStore } from 'rate-limit-redis';

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/shubham_portfolio_test';
process.env.JWT_SECRET ||= 'test-only-secret-that-is-at-least-32-characters-long';
const { createRedisRateLimitStore } = await import('../src/config/redis.js');

test('Redis rate-limit stores use RedisStore, distinct prefixes, and atomic Redis commands', async () => {
  const commands = [];
  const client = {
    isReady: true,
    async sendCommand(command) {
      commands.push(command);
      if (command[0] === 'SCRIPT') return 'test-script-sha';
      if (command[0] === 'EVALSHA') return [1, 60000];
      throw new Error(`Unexpected Redis command: ${command[0]}`);
    },
  };

  const apiStore = createRedisRateLimitStore('api', client);
  const loginStore = createRedisRateLimitStore('login', client);
  assert.ok(apiStore instanceof RedisStore);
  assert.ok(loginStore instanceof RedisStore);
  assert.notEqual(apiStore, loginStore);
  await apiStore.init({ windowMs: 60000 });
  const result = await apiStore.increment('ip:192.0.2.1');
  assert.equal(result.totalHits, 1);
  assert.equal(apiStore.prefix, 'shubham:api:');
  assert.ok(commands.some((command) => command[0] === 'EVALSHA' && command.includes('shubham:api:ip:192.0.2.1')));
});

test('Redis is optional for local memory-store fallback', async () => {
  assert.equal(createRedisRateLimitStore('api', null), undefined);
});
