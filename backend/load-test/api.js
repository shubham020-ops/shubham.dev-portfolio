import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const rateLimited = new Counter('http_429');
const failedRequests = new Counter('api_failed_requests');
const loginProbeFailures = new Counter('login_probe_failures');
const apiBase = (__ENV.API_BASE_URL || 'http://127.0.0.1:3001/api/v1').replace(/\/$/, '');
const target = new URL(apiBase);
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

if (!localHosts.has(target.hostname) && __ENV.ALLOW_NONLOCAL_LOAD_TEST !== 'yes') {
  throw new Error('Non-local load tests require ALLOW_NONLOCAL_LOAD_TEST=yes; target staging only, never production.');
}

const runRateLimitProbe = __ENV.RUN_RATE_LIMIT_PROBE === 'true';
const runLoginProbe = __ENV.RUN_LOGIN_RATE_LIMIT_PROBE === 'true';
export const options = {
  scenarios: {
    normal_portfolio_reads: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1m',
      duration: '1m',
      preAllocatedVUs: 3,
      exec: 'readProjects',
    },
    ...(runRateLimitProbe ? {
      public_read_rate_limit_probe: {
        executor: 'constant-arrival-rate',
        rate: 330,
        timeUnit: '1m',
        duration: '1m',
        preAllocatedVUs: 5,
        exec: 'readProjects',
        startTime: '1m',
      },
    } : {}),
    ...(runLoginProbe ? {
      login_rate_limit_probe: {
        executor: 'constant-arrival-rate',
        rate: 20,
        timeUnit: '1m',
        duration: '1m',
        preAllocatedVUs: 1,
        exec: 'probeLogin',
        startTime: '1m',
      },
    } : {}),
  },
};

export function readProjects() {
  const response = http.get(`${apiBase}/projects`, { tags: { endpoint: 'projects' } });
  if (response.status === 429) rateLimited.add(1);
  else if (response.status !== 200) failedRequests.add(1);
  check(response, {
    'projects returns 200 or rate-limits with 429': (res) => res.status === 200 || res.status === 429,
  });
}

export function probeLogin() {
  const response = http.post(
    `${apiBase}/auth/login`,
    JSON.stringify({ email: 'load-probe-nonexistent@example.invalid', password: 'invalid-test-password' }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'auth-login' } },
  );
  if (response.status === 429) rateLimited.add(1);
  else if (response.status !== 401) loginProbeFailures.add(1);
  check(response, {
    'login probe returns 401 or rate-limits with 429': (res) => res.status === 401 || res.status === 429,
  });
}
