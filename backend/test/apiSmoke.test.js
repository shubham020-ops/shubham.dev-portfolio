import test from 'node:test';
import assert from 'node:assert/strict';

function responseMock() {
  return {
    statusCode: 200,
    body: null,
    cookiesCleared: [],
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    clearCookie(name) { this.cookiesCleared.push(name); },
  };
}

test('health status only reports connected when MongoDB readyState is connected', async () => {
  const { getHealthResponse } = await import('../src/services/healthStatus.js');
  const offline = getHealthResponse(0, 12, '2026-10-30T00:00:00.000Z');
  assert.equal(offline.statusCode, 503);
  assert.equal(offline.body.success, false);
  assert.equal(offline.body.data.database.connected, false);

  const online = getHealthResponse(1, 12, '2026-10-30T00:00:00.000Z');
  assert.equal(online.statusCode, 200);
  assert.equal(online.body.data.database.connected, true);
  assert.equal(online.body.data.rateLimitStore.connected, null);

  const redisOffline = getHealthResponse(1, 12, '2026-10-30T00:00:00.000Z', { redisConfigured: true, redisReady: false });
  assert.equal(redisOffline.statusCode, 503);
  assert.equal(redisOffline.body.data.rateLimitStore.connected, false);

  const redisOnline = getHealthResponse(1, 12, '2026-10-30T00:00:00.000Z', { redisConfigured: true, redisReady: true });
  assert.equal(redisOnline.statusCode, 200);
});

test('admin middleware rejects a missing cookie and an invalid CSRF token', async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/shubham_portfolio_test';
  process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  const { requireAdmin, requireCsrf } = await import('../src/middleware/auth.js');

  const anonymous = responseMock();
  let anonymousPassed = false;
  await requireAdmin({ cookies: {} }, anonymous, () => { anonymousPassed = true; });
  assert.equal(anonymous.statusCode, 401);
  assert.equal(anonymous.body.success, false);
  assert.equal(anonymousPassed, false);

  const csrf = responseMock();
  let csrfPassed = false;
  await requireCsrf({ method: 'POST', admin: { csrfToken: 'expected-token' }, get: () => undefined, headers: {} }, csrf, () => { csrfPassed = true; });
  assert.equal(csrf.statusCode, 403);
  assert.equal(csrf.body.success, false);
  assert.equal(csrfPassed, false);

  const sameOrigin = responseMock();
  let sameOriginPassed = false;
  const sameOriginRequest = {
    method: 'PUT',
    protocol: 'https',
    admin: { csrfToken: 'expected-token' },
    get(name) {
      return {
        origin: 'https://portfolio.example.com',
        host: 'portfolio.example.com',
        'x-csrf-token': 'expected-token',
      }[name];
    },
  };
  await requireCsrf(sameOriginRequest, sameOrigin, () => { sameOriginPassed = true; });
  assert.equal(sameOriginPassed, true);
});

test('production always enables Secure cookies even when a local override says false', async () => {
  process.env.NODE_ENV = 'production';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/shubham_portfolio_test';
  process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';
  process.env.FRONTEND_URL = 'https://portfolio.example.com';
  process.env.COOKIE_SECURE = 'false';
  const { env } = await import(`../src/config/env.js?production-cookie-check=${Date.now()}`);
  assert.equal(env.cookieSecure, true);
});

test('proxy trust is disabled by default and accepts explicit proxy configuration only', async () => {
  process.env.NODE_ENV = 'development';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/shubham_portfolio_test';
  process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';
  process.env.TRUST_PROXY = '';
  const { env: defaultEnv } = await import(`../src/config/env.js?trust-proxy-default=${Date.now()}`);
  assert.equal(defaultEnv.trustProxy, false);

  process.env.TRUST_PROXY = '127.0.0.1,10.0.0.0/8';
  const { env: configuredEnv } = await import(`../src/config/env.js?trust-proxy-list=${Date.now()}`);
  assert.deepEqual(configuredEnv.trustProxy, ['127.0.0.1', '10.0.0.0/8']);

  process.env.TRUST_PROXY = 'true';
  await assert.rejects(
    import(`../src/config/env.js?trust-proxy-open=${Date.now()}`),
    /TRUST_PROXY cannot be true/,
  );
  process.env.TRUST_PROXY = '';
});

test('Redis URL accepts TLS Redis URLs and rejects other schemes without echoing credentials', async () => {
  process.env.NODE_ENV = 'development';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/shubham_portfolio_test';
  process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';
  process.env.REDIS_URL = 'rediss://test-user:test-password@redis.example.test:6380';
  const configured = await import(`../src/config/env.js?redis-url-valid=${Date.now()}`);
  assert.equal(configured.env.redisUrl, process.env.REDIS_URL);

  process.env.REDIS_URL = 'https://test-user:test-password@redis.example.test';
  await assert.rejects(
    import(`../src/config/env.js?redis-url-invalid=${Date.now()}`),
    (error) => error.message.includes('REDIS_URL must be a valid redis:// or rediss:// URL.')
      && !error.message.includes('test-password'),
  );
  process.env.REDIS_URL = '';
});

test('API rate limiter allows 60 requests per minute on protected API traffic and skips health', async () => {
  const { createApiRateLimiter } = await import('../src/app.js');
  const limiter = createApiRateLimiter();
  const request = (path) => ({
    ip: '192.0.2.1',
    path,
    originalUrl: `/api/v1${path}`,
    method: 'GET',
    headers: {},
    socket: { remoteAddress: '192.0.2.1' },
    app: { get: () => false },
  });
  const makeResponse = () => ({
    headers: new Map(),
    headersSent: false,
    statusCode: 200,
    setHeader(name, value) { this.headers.set(name.toLowerCase(), value); },
    append(name, value) {
      const key = name.toLowerCase();
      this.headers.set(key, this.headers.has(key) ? `${this.headers.get(key)}, ${value}` : value);
    },
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; this.headersSent = true; return this; },
  });
  const invoke = async (path) => {
    const res = makeResponse();
    let passed = false;
    let error;
    await limiter(request(path), res, (cause) => { error = cause; passed = true; });
    if (error) throw error;
    return { res, passed };
  };

  assert.equal((await invoke('/health')).passed, true);
  for (let i = 0; i < 60; i += 1) assert.equal((await invoke('/admin/dashboard')).passed, true);
  const limited = await invoke('/admin/dashboard');
  assert.equal(limited.passed, false);
  assert.equal(limited.res.statusCode, 429);
  assert.equal(limited.res.body.error, 'Too many API requests. Please wait a minute and try again.');
  assert.ok(limited.res.headers.has('retry-after'));
});

test('public portfolio reads have their own 300-per-minute ceiling', async () => {
  const { createPublicReadRateLimiter } = await import('../src/app.js');
  const limiter = createPublicReadRateLimiter();
  const makeResponse = () => ({
    headersSent: false,
    statusCode: 200,
    setHeader() {},
    append() {},
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; this.headersSent = true; return this; },
  });
  const invoke = async () => {
    const req = {
      ip: '192.0.2.20', path: '/projects', originalUrl: '/api/v1/projects', method: 'GET', headers: {},
      socket: { remoteAddress: '192.0.2.20' }, app: { get: () => false },
    };
    const res = makeResponse();
    let passed = false;
    await limiter(req, res, () => { passed = true; });
    return { passed, res };
  };

  for (let i = 0; i < 300; i += 1) assert.equal((await invoke()).passed, true);
  const limited = await invoke();
  assert.equal(limited.passed, false);
  assert.equal(limited.res.statusCode, 429);
});

test('login limiter blocks the eleventh attempt in its 15-minute IP window', async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/shubham_portfolio_test';
  process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';
  const { default: apiRouter } = await import('../src/routes/api.js');
  const route = apiRouter.stack.find((layer) => layer.route?.path === '/auth/login' && layer.route.methods.post);
  const limiter = route.route.stack[0].handle;
  const makeResponse = () => ({
    headersSent: false,
    statusCode: 200,
    setHeader() {},
    append() {},
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; this.headersSent = true; return this; },
  });
  const invoke = async () => {
    const req = {
      ip: '192.0.2.21', path: '/auth/login', originalUrl: '/api/v1/auth/login', method: 'POST', headers: {},
      socket: { remoteAddress: '192.0.2.21' }, app: { get: () => false },
    };
    const res = makeResponse();
    let passed = false;
    await limiter(req, res, () => { passed = true; });
    return { passed, res };
  };

  for (let i = 0; i < 10; i += 1) assert.equal((await invoke()).passed, true);
  const limited = await invoke();
  assert.equal(limited.passed, false);
  assert.equal(limited.res.statusCode, 429);
});

test('contact limiter blocks the sixth message in its 15-minute IP window', async () => {
  const { default: apiRouter } = await import('../src/routes/api.js');
  const route = apiRouter.stack.find((layer) => layer.route?.path === '/contact' && layer.route.methods.post);
  const limiter = route.route.stack[0].handle;
  const makeResponse = () => ({
    headersSent: false,
    statusCode: 200,
    setHeader() {},
    append() {},
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; this.headersSent = true; return this; },
  });
  const invoke = async () => {
    const req = {
      ip: '192.0.2.22', path: '/contact', originalUrl: '/api/v1/contact', method: 'POST', headers: {},
      socket: { remoteAddress: '192.0.2.22' }, app: { get: () => false },
    };
    const res = makeResponse();
    let passed = false;
    await limiter(req, res, () => { passed = true; });
    return { passed, res };
  };

  for (let i = 0; i < 5; i += 1) assert.equal((await invoke()).passed, true);
  const limited = await invoke();
  assert.equal(limited.passed, false);
  assert.equal(limited.res.statusCode, 429);
});

test('500 responses do not reveal internal error messages or stack traces', async () => {
  const { errorHandler } = await import('../src/middleware/errors.js');
  const response = {
    headersSent: false,
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const originalWrite = process.stderr.write;
  let logged = '';
  process.stderr.write = (value) => { logged += value; return true; };
  try { errorHandler(new Error('private database connection detail\nstack trace'), {}, response, () => {}); }
  finally { process.stderr.write = originalWrite; }
  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error, 'Something went wrong. Please try again.');
  assert.doesNotMatch(JSON.stringify(response.body), /private database|stack trace/);
  assert.doesNotMatch(logged, /private database|stack trace/);
});

test('separate API CSP allowlist accepts HTTPS origins and rejects insecure values', async () => {
  process.env.NODE_ENV = 'production';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/shubham_portfolio_test';
  process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';
  process.env.FRONTEND_URL = 'https://portfolio.example.com';
  process.env.CSP_CONNECT_SOURCES = 'https://api.example.com';
  const { env } = await import(`../src/config/env.js?csp-allowlist=${Date.now()}`);
  assert.deepEqual(env.cspConnectSources, ['https://api.example.com']);

  process.env.CSP_CONNECT_SOURCES = 'http://api.example.com';
  await assert.rejects(
    import(`../src/config/env.js?csp-invalid=${Date.now()}`),
    /CSP_CONNECT_SOURCES entries must be HTTPS origins/,
  );
});

test('FRONTEND_URL canonicalizes a trailing slash and requires HTTPS in production', async () => {
  process.env.CSP_CONNECT_SOURCES = '';
  process.env.CORS_ORIGINS = '';
  process.env.NODE_ENV = 'development';
  process.env.FRONTEND_URL = 'http://localhost:5174/';
  const { env: developmentEnv } = await import(`../src/config/env.js?frontend-dev=${Date.now()}`);
  assert.deepEqual(developmentEnv.frontendOrigins, ['http://localhost:5173', 'http://localhost:5174']);

  process.env.NODE_ENV = 'production';
  process.env.FRONTEND_URL = 'https://portfolio.example.com/';
  const { env: productionEnv } = await import(`../src/config/env.js?frontend-prod=${Date.now()}`);
  assert.deepEqual(productionEnv.frontendOrigins, ['https://portfolio.example.com']);

  process.env.FRONTEND_URL = 'http://portfolio.example.com';
  await assert.rejects(
    import(`../src/config/env.js?frontend-prod-http=${Date.now()}`),
    /FRONTEND_URL must use HTTPS in production/,
  );

  process.env.NODE_ENV = 'development';
  process.env.FRONTEND_URL = '';
  const { env: defaultDevelopmentEnv } = await import(`../src/config/env.js?frontend-default=${Date.now()}`);
  assert.deepEqual(defaultDevelopmentEnv.frontendOrigins, ['http://localhost:5173', 'http://localhost:5174']);
});

test('development keeps both local Vite origins and CORS_ORIGINS takes precedence', async () => {
  process.env.NODE_ENV = 'development';
  process.env.FRONTEND_URL = 'http://localhost:5174';
  process.env.CORS_ORIGINS = '';
  const legacyLocal = await import(`../src/config/env.js?legacy-local=${Date.now()}`);
  assert.deepEqual(legacyLocal.env.frontendOrigins, ['http://localhost:5173', 'http://localhost:5174']);

  process.env.FRONTEND_URL = 'https://legacy.example.test';
  process.env.CORS_ORIGINS = 'https://portfolio.example.test, https://admin.example.test';
  process.env.NODE_ENV = 'production';
  const configured = await import(`../src/config/env.js?cors-origins=${Date.now()}`);
  assert.deepEqual(configured.env.frontendOrigins, [
    'https://portfolio.example.test',
    'https://admin.example.test',
  ]);

  process.env.CORS_ORIGINS = 'http://portfolio.example.test';
  await assert.rejects(
    import(`../src/config/env.js?cors-insecure=${Date.now()}`),
    /CORS_ORIGINS must use HTTPS in production/,
  );
});
