import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeMessageCursor, encodeMessageCursor } from '../src/services/messagePagination.js';

test('contact-message cursors round-trip a timestamp and ObjectId without changing the list response shape', () => {
  const message = { createdAt: new Date('2026-10-30T12:00:00.000Z'), _id: '507f1f77bcf86cd799439011' };
  const cursor = encodeMessageCursor(message);
  assert.deepEqual(decodeMessageCursor(cursor), { createdAt: message.createdAt, id: message._id });
});

test('contact-message cursors reject malformed or non-canonical values', () => {
  assert.throws(() => decodeMessageCursor('not-a-cursor'), { statusCode: 400 });
  assert.throws(() => decodeMessageCursor(''), { statusCode: 400 });
});
