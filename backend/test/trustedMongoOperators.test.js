import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/shubham_portfolio_test';
process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';

const mongooseModule = await import('mongoose');
const mongoose = mongooseModule.default;
mongoose.set('sanitizeFilter', true);
const [{ trustedIn, trustedLessThan }, { default: apiRouter }, { default: PortfolioContent }, { default: ContactMessage }] = await Promise.all([
  import('../src/services/trustedMongoOperators.js'),
  import('../src/routes/api.js'),
  import('../src/models/PortfolioContent.js'),
  import('../src/models/ContactMessage.js'),
]);

function handler(path, method = 'get') {
  const layer = apiRouter.stack.find((entry) => entry.route?.path === path && entry.route.methods[method]);
  assert.ok(layer, `Expected ${method.toUpperCase()} ${path} route`);
  return layer.route.stack.at(-1).handle;
}

function response() {
  return {
    headers: {},
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    set(name, value) { this.headers[name] = value; return this; },
  };
}

function withoutTrustedMarkers(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(withoutTrustedMarkers);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, withoutTrustedMarkers(child)]));
  }
  return value;
}

test('server-side $in and keyset $lt operators survive Mongoose filter sanitization', () => {
  const lowerBound = new Date('2026-10-30T00:00:00.000Z');
  const brokenPortfolioQuery = PortfolioContent.find(mongoose.sanitizeFilter({ key: { $in: ['projects', 'experience'] } }));
  assert.throws(() => brokenPortfolioQuery.cast(PortfolioContent), (error) => error.name === 'CastError');
  const fixedPortfolioQuery = PortfolioContent.find({ key: trustedIn(['projects', 'experience']) });
  assert.doesNotThrow(() => fixedPortfolioQuery.cast(PortfolioContent));
  assert.deepEqual(
    withoutTrustedMarkers(mongoose.sanitizeFilter({ key: { $in: ['projects', 'experience'] } })),
    { key: { $eq: { $in: ['projects', 'experience'] } } },
  );
  assert.deepEqual(
    withoutTrustedMarkers(mongoose.sanitizeFilter({ key: trustedIn(['projects', 'experience']) })),
    { key: { $in: ['projects', 'experience'] } },
  );
  assert.deepEqual(
    withoutTrustedMarkers(mongoose.sanitizeFilter({
      $or: [
        { createdAt: trustedLessThan(lowerBound) },
        { createdAt: lowerBound, _id: trustedLessThan('0123456789abcdef01234567') },
      ],
    })),
    {
      $or: [
        { createdAt: { $lt: lowerBound.toISOString() } },
        { createdAt: lowerBound.toISOString(), _id: { $lt: '0123456789abcdef01234567' } },
      ],
    },
  );
});

test('public portfolio query keeps its $in operator and returns stored sections', async () => {
  const originalFind = PortfolioContent.find;
  let sanitizedFilter;
  PortfolioContent.find = (filter) => {
    sanitizedFilter = withoutTrustedMarkers(mongoose.sanitizeFilter(filter));
    return { lean: async () => [{ key: 'experience', value: [{ role: 'Existing role' }] }] };
  };
  try {
    const res = response();
    await handler('/portfolio')({}, res, () => {});
    assert.deepEqual(sanitizedFilter, { key: { $in: ['site', 'navLinks', 'socials', 'about', 'skillGroups', 'projects', 'featured', 'experience', 'testimonials', 'contactTypes', 'footer'] } });
    assert.deepEqual(res.body.data.experience, [{ role: 'Existing role' }]);
  } finally {
    PortfolioContent.find = originalFind;
  }
});

test('admin dashboard and message pagination keep legitimate operators', async () => {
  const originalContentFind = PortfolioContent.find;
  const originalCountDocuments = ContactMessage.countDocuments;
  const originalMessageFind = ContactMessage.find;
  const contentFilters = [];
  const messageFilters = [];
  PortfolioContent.find = (filter) => {
    contentFilters.push(withoutTrustedMarkers(mongoose.sanitizeFilter(filter)));
    return { lean: async () => [] };
  };
  ContactMessage.countDocuments = async (filter = {}) => {
    messageFilters.push(withoutTrustedMarkers(mongoose.sanitizeFilter(filter)));
    return 0;
  };
  ContactMessage.find = (filter) => {
    messageFilters.push(withoutTrustedMarkers(mongoose.sanitizeFilter(filter)));
    return {
      sort() { return this; },
      limit() { return this; },
      select() { return this; },
      lean: async () => [],
    };
  };

  try {
    const dashboardResponse = response();
    await handler('/admin/dashboard')({}, dashboardResponse, () => {});
    assert.deepEqual(contentFilters[0], { key: { $in: ['projects', 'skillGroups'] } });
    assert.deepEqual(messageFilters[2], { emailStatus: { $in: ['failed', 'not_configured'] } });

    const cursor = Buffer.from('2026-10-30T00:00:00.000Z|0123456789abcdef01234567').toString('base64url');
    const messagesResponse = response();
    await handler('/admin/messages')({ query: { cursor }, method: 'GET' }, messagesResponse, () => {});
    assert.deepEqual(messageFilters.at(-1), {
      $or: [
        { createdAt: { $lt: '2026-10-30T00:00:00.000Z' } },
        { createdAt: '2026-10-30T00:00:00.000Z', _id: { $lt: '0123456789abcdef01234567' } },
      ],
    });
  } finally {
    PortfolioContent.find = originalContentFind;
    ContactMessage.countDocuments = originalCountDocuments;
    ContactMessage.find = originalMessageFind;
  }
});
