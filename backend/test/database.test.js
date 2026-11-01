import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/shubham_portfolio_test';
process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';

const [{ connectDatabase }, mongooseModule] = await Promise.all([
  import('../src/config/database.js'),
  import('mongoose'),
]);
const mongoose = mongooseModule.default;
const { default: PortfolioContent } = await import('../src/models/PortfolioContent.js');
const { trustedIn } = await import('../src/services/trustedMongoOperators.js');

test('database connection uses a bounded pool and finite connection wait settings', async () => {
  const originalConnect = mongoose.connect;
  let capturedUri;
  let capturedOptions;
  mongoose.connect = async (uri, options) => {
    capturedUri = uri;
    capturedOptions = options;
    return mongoose;
  };
  try {
    await connectDatabase();
    assert.equal(capturedUri, process.env.MONGODB_URI);
    assert.equal(capturedOptions.maxPoolSize, 20);
    assert.equal(capturedOptions.minPoolSize, 0);
    assert.equal(capturedOptions.maxIdleTimeMS, 30000);
    assert.equal(capturedOptions.serverSelectionTimeoutMS, 10000);
    assert.equal(capturedOptions.waitQueueTimeoutMS, 5000);
    assert.equal(mongoose.get('sanitizeFilter'), true);
    const contentQuery = PortfolioContent.find({ key: trustedIn(['projects', 'skills']) });
    contentQuery.cast(PortfolioContent);
    assert.deepEqual(Object.fromEntries(Object.entries(contentQuery.getFilter().key)), { $in: ['projects', 'skills'] });
  } finally {
    mongoose.connect = originalConnect;
  }
});
