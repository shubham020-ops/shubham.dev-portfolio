import { httpError } from '../middleware/errors.js';

export function encodeMessageCursor(message) {
  const createdAt = new Date(message.createdAt);
  const id = String(message._id);
  if (Number.isNaN(createdAt.getTime()) || !/^[a-f\d]{24}$/i.test(id)) {
    throw new TypeError('Cannot encode an invalid contact-message cursor.');
  }
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url');
}

export function decodeMessageCursor(cursor) {
  if (typeof cursor !== 'string' || !cursor || cursor.length > 128) {
    throw httpError(400, 'Message cursor is invalid.');
  }
  let decoded;
  try { decoded = Buffer.from(cursor, 'base64url').toString('utf8'); }
  catch { throw httpError(400, 'Message cursor is invalid.'); }
  if (Buffer.from(decoded).toString('base64url') !== cursor) throw httpError(400, 'Message cursor is invalid.');

  const separator = decoded.lastIndexOf('|');
  if (separator < 0) throw httpError(400, 'Message cursor is invalid.');
  const timestamp = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);
  const createdAt = new Date(timestamp);
  if (Number.isNaN(createdAt.getTime()) || createdAt.toISOString() !== timestamp || !/^[a-f\d]{24}$/i.test(id)) {
    throw httpError(400, 'Message cursor is invalid.');
  }
  return { createdAt, id };
}
