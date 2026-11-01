import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'production';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/shubham_portfolio_test';
process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';
process.env.FRONTEND_URL = '';

const [{ default: apiRouter }, { default: Admin }, bcrypt, { normalizeEmail }] = await Promise.all([
  import('../src/routes/api.js'),
  import('../src/models/Admin.js'),
  import('bcryptjs'),
  import('../src/utils/normalizeEmail.js'),
]);

test('normalizeEmail safely trims and lowercases string email values', () => {
  assert.equal(normalizeEmail('  Admin.Name+tag@Example.COM  '), 'admin.name+tag@example.com');
  assert.equal(normalizeEmail('  '), '');
  assert.equal(normalizeEmail(null), '');
  assert.equal(normalizeEmail({ email: 'admin@example.com' }), '');

  const document = new Admin({ email: ' ADMIN@Example.COM ', resendFromEmail: ' Sender@Example.COM ' });
  assert.equal(document.email, 'admin@example.com');
  assert.equal(document.resendFromEmail, 'sender@example.com');
});

test('POST /api/v1/auth/login handler normalizes email and issues a session for an existing admin record', async () => {
  const password = 'test-login-password';
  const admin = {
    _id: '507f1f77bcf86cd799439011',
    email: 'admin@example.com',
    passwordHash: await bcrypt.hash(password, 4),
    sessionVersion: 2,
  };
  const originalFindOne = Admin.findOne;
  let lookedUpEmail = '';
  Admin.findOne = (filter) => {
    lookedUpEmail = filter.email;
    return { select: async () => admin };
  };

  try {
    const routeLayer = apiRouter.stack.find((layer) => layer.route?.path === '/auth/login' && layer.route.methods.post);
    assert.ok(routeLayer, 'POST /auth/login route is registered');
    const loginHandler = routeLayer.route.stack.at(-1).handle;
    const response = {
      statusCode: 200,
      body: null,
      cookie: null,
      status(code) { this.statusCode = code; return this; },
      set() { return this; },
      cookie(name, value, options) { this.cookie = { name, value, options }; return this; },
      json(body) { this.body = body; return this; },
    };

    await loginHandler({ body: { email: '  ADMIN@Example.COM  ', password } }, response);

    assert.equal(lookedUpEmail, 'admin@example.com');
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.admin.email, 'admin@example.com');
    assert.equal(typeof response.body.data.csrfToken, 'string');
    assert.equal(response.cookie.name, 'portfolio_admin');
    assert.equal(response.cookie.options.httpOnly, true);
    assert.equal(response.cookie.options.secure, true);
    assert.equal(response.cookie.options.sameSite, 'lax');
    assert.equal(response.cookie.options.path, '/');

    await assert.rejects(
      loginHandler({ body: { email: 'admin@example.com', password: 'incorrect-password' } }, {
        status() { return this; },
        set() { return this; },
        cookie() { return this; },
        json(body) { this.body = body; return this; },
      }),
      { statusCode: 401, message: 'Email or password is incorrect.' },
    );
  } finally {
    Admin.findOne = originalFindOne;
  }
});
