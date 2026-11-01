import test from 'node:test';
import assert from 'node:assert/strict';
import { createCorsMiddleware } from '../src/middleware/cors.js';

function makeResponse() {
  const headers = new Map();
  return {
    headers,
    statusCode: 200,
    ended: false,
    getHeader(name) { return headers.get(name.toLowerCase()); },
    setHeader(name, value) { headers.set(name.toLowerCase(), value); },
    end() { this.ended = true; },
  };
}

function makeRequest(method, origin, host = 'localhost:3001') {
  const headers = { origin };
  if (method === 'OPTIONS') {
    headers['access-control-request-method'] = 'POST';
    headers['access-control-request-headers'] = 'content-type,authorization,x-csrf-token';
  }
  return {
    method,
    headers,
    protocol: 'http',
    get(name) { return name === 'host' ? host : headers[name.toLowerCase()]; },
  };
}

test('CORS preflight allows both local Vite origins, credentials, auth methods and headers', () => {
  const origins = ['http://localhost:5173', 'http://localhost:5174'];
  const middleware = createCorsMiddleware(origins);

  for (const origin of origins) {
    const req = makeRequest('OPTIONS', origin);
    const res = makeResponse();
    let calledNext = false;

    middleware(req, res, () => { calledNext = true; });

    assert.equal(res.statusCode, 204);
    assert.equal(res.ended, true);
    assert.equal(calledNext, false);
    assert.equal(res.getHeader('Access-Control-Allow-Origin'), origin);
    assert.equal(res.getHeader('Access-Control-Allow-Credentials'), 'true');
    assert.equal(res.getHeader('Access-Control-Expose-Headers'), 'X-Next-Cursor');
    assert.doesNotMatch(res.getHeader('Access-Control-Allow-Origin'), /^\*$/);
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      assert.ok(res.getHeader('Access-Control-Allow-Methods').split(',').includes(method));
    }
    for (const header of ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Confirm-Delete']) {
      assert.ok(res.getHeader('Access-Control-Allow-Headers').toLowerCase().includes(header.toLowerCase()));
    }
  }
});

test('credentialed GET requests receive CORS headers and other origins are rejected', () => {
  const origins = ['http://localhost:5173', 'http://localhost:5174'];
  const middleware = createCorsMiddleware(origins);
  for (const origin of origins) {
    const getResponse = makeResponse();
    let getPassed = false;
    middleware(makeRequest('GET', origin), getResponse, () => { getPassed = true; });
    assert.equal(getPassed, true);
    assert.equal(getResponse.getHeader('Access-Control-Allow-Origin'), origin);
    assert.equal(getResponse.getHeader('Access-Control-Allow-Credentials'), 'true');
  }

  const rejectedResponse = makeResponse();
  let rejectedError;
  middleware(makeRequest('OPTIONS', 'http://localhost:9999'), rejectedResponse, (error) => { rejectedError = error; });
  assert.equal(rejectedError?.statusCode, 403);
  assert.equal(rejectedResponse.getHeader('Access-Control-Allow-Origin'), undefined);
});
