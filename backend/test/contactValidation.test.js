import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeContactInput } from '../src/services/contactValidation.js';

test('contact input trims and normalizes validated fields', () => {
  assert.deepEqual(normalizeContactInput({
    name: '  Asha   Shah ',
    email: ' ASHA@EXAMPLE.ORG ',
    type: 'Web App',
    message: '  This is a valid project enquiry with enough detail.  ',
  }), {
    name: 'Asha Shah',
    email: 'asha@example.org',
    subject: 'Web App',
    message: 'This is a valid project enquiry with enough detail.',
  });
});

test('contact input rejects invalid required fields and the spam honeypot', () => {
  assert.throws(() => normalizeContactInput({ name: 'A', email: 'bad', message: 'short' }), /Name must be/);
  assert.throws(() => normalizeContactInput({ name: 'Asha', email: 'bad', message: 'This is long enough to pass.' }), /valid email/);
  assert.throws(() => normalizeContactInput({ name: 'Asha', email: 'asha@example.org', message: 'short' }), /Message must be/);
  assert.throws(() => normalizeContactInput({ website: 'spam', name: 'Asha', email: 'asha@example.org', message: 'This is a valid message body.' }), /could not be accepted/);
});
