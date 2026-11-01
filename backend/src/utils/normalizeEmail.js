/** Normalize an email address consistently before storage or comparison. */
export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
