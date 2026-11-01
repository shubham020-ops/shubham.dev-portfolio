import test from 'node:test';
import assert from 'node:assert/strict';
import { createGracefulShutdown } from '../src/services/gracefulShutdown.js';

test('graceful shutdown closes HTTP, MongoDB, and Redis exactly once', async () => {
  const events = [];
  let closeHttp;
  const server = {
    close(callback) { events.push('http'); closeHttp = callback; },
    closeAllConnections() { events.push('force-http'); },
  };
  const shutdown = createGracefulShutdown({
    server,
    closeDatabase: async () => { events.push('mongo'); },
    closeRedis: async () => { events.push('redis'); },
    timeoutMs: 1000,
    log: (message) => events.push(message),
    setExitCode: (code) => events.push(`exit:${code}`),
    forceExit: () => events.push('force-exit'),
  });

  const first = shutdown('SIGTERM');
  const second = shutdown('SIGINT');
  assert.equal(first, second);
  closeHttp();
  const result = await first;
  assert.deepEqual(result, { exitCode: 0 });
  assert.deepEqual(events, ['SIGTERM received; shutting down.', 'http', 'mongo', 'redis', 'exit:0']);
});

test('graceful shutdown sets a failing exit code if a connection cannot close cleanly', async () => {
  let closeHttp;
  let exitCode;
  const shutdown = createGracefulShutdown({
    server: { close(callback) { closeHttp = callback; } },
    closeDatabase: async () => { throw new Error('database close failed'); },
    closeRedis: async () => {},
    timeoutMs: 1000,
    log: () => {},
    setExitCode: (code) => { exitCode = code; },
    forceExit: () => {},
  });
  const resultPromise = shutdown('SIGTERM');
  closeHttp();
  const result = await resultPromise;
  assert.deepEqual(result, { exitCode: 1 });
  assert.equal(exitCode, 1);
});
