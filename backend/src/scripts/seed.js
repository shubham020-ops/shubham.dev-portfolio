import { randomUUID } from 'node:crypto';
import { initialPortfolioContent } from '../../../src/data/portfolioData.js';
import { connectDatabase, closeDatabase } from '../config/database.js';
import { CONTENT_KEYS } from '../models/PortfolioContent.js';
import PortfolioContent from '../models/PortfolioContent.js';
import { trustedIn } from '../services/trustedMongoOperators.js';

try {
  await connectDatabase();
  const existing = await PortfolioContent.countDocuments();
  const existingDocs = await PortfolioContent.find({ key: trustedIn(CONTENT_KEYS) }).lean();
  const existingKeys = new Set(existingDocs.map((doc) => doc.key));
  const docs = CONTENT_KEYS.filter((key) => !existingKeys.has(key)).map((key) => {
      const value = initialPortfolioContent[key] ?? (['navLinks', 'socials', 'skillGroups', 'projects', 'experience', 'testimonials', 'contactTypes'].includes(key) ? [] : null);
      const withRecordIds = ['navLinks', 'socials', 'skillGroups', 'projects', 'experience', 'testimonials'].includes(key)
        ? value.map((item) => ({ ...item, recordId: item.recordId || randomUUID() }))
        : value;
      return { key, value: withRecordIds };
  });
  if (docs.length) {
    await PortfolioContent.insertMany(docs);
  }

  // Add newly introduced section links to older databases without replacing admin content.
  const navDoc = await PortfolioContent.findOne({ key: 'navLinks' });
  if (navDoc && Array.isArray(navDoc.value)) {
    const knownIds = new Set(navDoc.value.map((item) => item.id));
    const additions = initialPortfolioContent.navLinks
      .filter((item) => ['projects', 'experience', 'testimonials'].includes(item.id) && !knownIds.has(item.id))
      .map((item) => ({ ...item, recordId: randomUUID() }));
    if (additions.length) {
      const links = [...navDoc.value];
      const contactIndex = links.findIndex((item) => item.id === 'contact');
      links.splice(contactIndex < 0 ? links.length : contactIndex, 0, ...additions);
      navDoc.value = links.map((item, order) => ({ ...item, order: order + 1 }));
      await navDoc.save();
    }
  }

  process.stdout.write(existing === 0
    ? `Seeded ${docs.length} portfolio content sections. No example projects, experience records or testimonials were invented.\n`
    : `Preserved ${existing} existing content sections, added ${docs.length} missing sections, and enabled the Projects, Experience and Testimonials navigation links.\n`);
} catch (error) {
  process.stderr.write(`Portfolio seed failed: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  await closeDatabase().catch(() => {});
}
