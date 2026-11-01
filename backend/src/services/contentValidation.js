import { CONTENT_KEYS } from '../config/contentKeys.js';
import { httpError } from '../middleware/errors.js';

export function assertContentKey(key) {
  if (!CONTENT_KEYS.includes(key)) throw httpError(404, 'This content section is not supported.');
}

function inspect(value, depth = 0, count = { value: 0 }) {
  count.value += 1;
  if (count.value > 5000 || depth > 12) throw httpError(400, 'Content is too large or deeply nested.');
  if (typeof value === 'string') {
    if (value.length > 10000) throw httpError(400, 'Text fields must be 10,000 characters or fewer.');
    if (/<\/?[a-z][^>]*>/i.test(value)) throw httpError(400, 'HTML markup is not allowed in portfolio content.');
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 500) throw httpError(400, 'Lists are limited to 500 items.');
    value.forEach((entry) => inspect(entry, depth + 1, count));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) throw httpError(400, 'Content contains a forbidden property.');
      inspect(entry, depth + 1, count);
      if (/(url|href|image|src)$/i.test(key) && typeof entry === 'string' && entry.trim()) {
        if (entry.startsWith('/')) continue;
        if (entry.startsWith('#')) continue;
        let url;
        try { url = new URL(entry); } catch { throw httpError(400, 'Links must be absolute HTTP or HTTPS URLs, or local paths.'); }
        const imageField = /image|src/i.test(key);
        if (!['http:', 'https:'].includes(url.protocol) && !(url.protocol === 'mailto:' && !imageField)) throw httpError(400, 'Only HTTP or HTTPS links are allowed for media and links.');
      }
    }
  }
}

export function validateContentValue(key, value) {
  assertContentKey(key);
  if (value === undefined) throw httpError(400, 'Content value is required.');
  inspect(value);
  const arrayKeys = ['navLinks', 'socials', 'skillGroups', 'projects', 'experience', 'testimonials', 'contactTypes'];
  if (arrayKeys.includes(key) && !Array.isArray(value)) throw httpError(400, `${key} must be a list.`);
  if (!arrayKeys.includes(key) && key !== 'featured' && (!value || Array.isArray(value) || typeof value !== 'object')) {
    throw httpError(400, `${key} must be an object.`);
  }
  if (key === 'contactTypes' && value.some((entry) => typeof entry !== 'string' || !entry.trim() || entry.length > 100)) {
    throw httpError(400, 'Contact choices must be non-empty text of at most 100 characters.');
  }
  if (arrayKeys.includes(key) && key !== 'contactTypes') {
    const required = {
      navLinks: ['id', 'label'], socials: ['label', 'url'], skillGroups: ['id', 'title', 'skills'],
      projects: ['id', 'title', 'category', 'description', 'tech'], experience: ['id', 'type', 'date', 'role', 'org', 'text'],
      testimonials: ['id', 'quote', 'name', 'role'],
    }[key];
    for (const item of value) {
      if (!item || Array.isArray(item) || typeof item !== 'object') throw httpError(400, `${key} entries must be objects.`);
      for (const field of required || []) {
        if (item[field] === undefined || item[field] === null || item[field] === '') throw httpError(400, `${key} record requires ${field}.`);
      }
      if (key === 'navLinks' && !/^[a-z][a-z0-9-]{0,39}$/.test(item.id)) throw httpError(400, 'Navigation anchors must use lowercase letters, numbers, and hyphens.');
      if (key === 'skillGroups' && !Array.isArray(item.skills)) throw httpError(400, 'Skill group skills must be a list.');
      if (key === 'projects' && !Array.isArray(item.tech)) throw httpError(400, 'Project technologies must be a list.');
    }
    const publicIds = value.map((item) => item.id).filter(Boolean).map((id) => String(id).toLowerCase());
    if (new Set(publicIds).size !== publicIds.length) throw httpError(409, 'Record IDs must be unique within a section.');
    if (key === 'socials') {
      const labels = value.map((item) => String(item.label).trim().toLowerCase());
      if (new Set(labels).size !== labels.length) throw httpError(409, 'Social link labels must be unique.');
    }
  }
  return value;
}

export function stripPrivateSamples(value) {
  if (Array.isArray(value)) return value.filter((entry) => entry?.isSample !== true && entry?.published !== false).map(stripPrivateSamples);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'recordId').map(([key, entry]) => [key, stripPrivateSamples(entry)]));
}
