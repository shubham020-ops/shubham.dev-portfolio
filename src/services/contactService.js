import { apiRequest } from './api';

export function submitContactForm(payload) {
  return apiRequest('/contact', { method: 'POST', body: payload });
}
