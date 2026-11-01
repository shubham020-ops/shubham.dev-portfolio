import test from 'node:test';
import assert from 'node:assert/strict';
import { stripPrivateSamples, validateContentValue } from '../src/services/contentValidation.js';

test('content validator accepts a published project record with HTTPS URLs', () => {
  const value = [{
    id: 'portfolio-case-study', title: 'Portfolio case study', category: 'Interface', description: 'A detailed project description.',
    tech: ['React'], liveUrl: 'https://example.org/project', published: true,
  }];
  assert.equal(validateContentValue('projects', value), value);
});

test('content validator rejects markup and script URLs', () => {
  assert.throws(() => validateContentValue('site', { tagline: '<script>alert(1)</script>' }), /HTML markup/);
  assert.throws(() => validateContentValue('socials', [{ label: 'Profile', url: 'javascript:alert(1)' }]), /Only HTTP or HTTPS/);
});

test('content validator enforces record fields and safe navigation anchors', () => {
  assert.throws(() => validateContentValue('projects', [{ id: 'draft', title: 'Draft' }]), /requires category/);
  assert.throws(() => validateContentValue('navLinks', [{ id: 'javascript:alert(1)', label: 'bad' }]), /lowercase letters/);
});

test('public content strips sample and unpublished list entries recursively', () => {
  const result = stripPrivateSamples({
    projects: [
      { title: 'Visible', published: true },
      { title: 'Sample', isSample: true, published: true },
      { title: 'Draft', published: false },
    ],
    about: { tags: [{ label: 'Visible' }, { label: 'Hidden', published: false }] },
  });
  assert.deepEqual(result.projects.map((item) => item.title), ['Visible']);
  assert.deepEqual(result.about.tags.map((item) => item.label), ['Visible']);
});
