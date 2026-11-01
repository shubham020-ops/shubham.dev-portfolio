import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  mongoose.set('sanitizeFilter', true);
  if (mongoose.connection.listenerCount('error') === 0) mongoose.connection.on('error', () => {
    process.stderr.write('MongoDB connection error. Check MONGODB_URI and Atlas network access.\n');
  });
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(env.mongoUri, {
    maxPoolSize: env.mongoMaxPoolSize,
    minPoolSize: 0,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 10000,
    waitQueueTimeoutMS: env.mongoWaitQueueTimeoutMS,
  });
  return mongoose.connection;
}

export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
