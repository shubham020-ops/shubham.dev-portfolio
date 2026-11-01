const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBase = import.meta.env.DEV ? 'http://localhost:3001/api/v1' : '/api/v1';
const API_BASE_URL = (configuredApiBase || defaultApiBase).replace(/\/$/, '');
let csrfToken = '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
    body: options.body === undefined || typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
  });
  let result;
  try { result = await response.json(); }
  catch { throw new ApiError('Server returned an unreadable response.', response.status); }
  if (!response.ok || result?.success !== true) {
    if (response.status === 401 && !['/auth/login', '/auth/me'].includes(path)) window.dispatchEvent(new CustomEvent('portfolio:unauthorized'));
    throw new ApiError(result?.error || 'Request could not be completed.', response.status);
  }
  return result.data;
}

export const setCsrfToken = (token) => { csrfToken = token || ''; };
export const getApiBaseUrl = () => API_BASE_URL;

export function notifyPortfolioUpdated() {
  let broadcast = false;
  try {
    const channel = new BroadcastChannel('shubham-portfolio-content');
    channel.postMessage('updated');
    channel.close();
    broadcast = true;
  } catch { /* BroadcastChannel may be unavailable in older browsers. */ }
  if (!broadcast) {
    try { localStorage.setItem('shubham-portfolio-updated', String(Date.now())); }
    catch { /* The active tab still refreshes directly after a save. */ }
  }
}

export async function login(email, password) {
  const result = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
  setCsrfToken(result.csrfToken);
  return result.admin;
}

export async function getSession() {
  try {
    const result = await apiRequest('/auth/me');
    setCsrfToken(result.csrfToken);
    return result.admin;
  } catch (error) {
    setCsrfToken('');
    if (error.status === 401) return null;
    throw error;
  }
}

export async function logout() {
  try { await apiRequest('/auth/logout', { method: 'POST', body: {} }); }
  finally { setCsrfToken(''); }
}
