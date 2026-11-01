import test from 'node:test';
import assert from 'node:assert/strict';
import { selectVerifiedSenderDomain } from '../src/services/resendDomain.js';

test('sender selection only chooses a verified domain with sending enabled', () => {
  const domains = [
    { name: 'pending.example.com', status: 'pending', capabilities: { sending: 'enabled' } },
    { name: 'disabled.example.com', status: 'verified', capabilities: { sending: 'disabled' } },
    { name: 'zeta.example.com', status: 'verified', capabilities: { sending: 'enabled' } },
    { name: 'alpha.example.com', status: 'verified', capabilities: { sending: 'enabled' } },
  ];
  assert.equal(selectVerifiedSenderDomain(domains), 'alpha.example.com');
  assert.equal(selectVerifiedSenderDomain([]), '');
});
