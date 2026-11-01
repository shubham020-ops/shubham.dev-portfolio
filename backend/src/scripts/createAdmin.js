import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import { connectDatabase, closeDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import Admin from '../models/Admin.js';
import { normalizeEmail } from '../utils/normalizeEmail.js';

try {
  await connectDatabase();
  if (await Admin.exists({})) throw new Error('An admin account already exists. This command never resets an existing password.');

  let email = normalizeEmail(env.adminEmail);
  let resendFromEmail = normalizeEmail(env.contactFromEmail);
  if (!email && !process.stdin.isTTY) throw new Error('Run this command in a terminal so you can enter the admin contact email.');
  if (process.stdin.isTTY && (!email || !resendFromEmail)) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    try {
      if (!email) email = normalizeEmail(await prompt.question('Admin login email (also receives contact messages): '));
      if (!resendFromEmail) {
        resendFromEmail = normalizeEmail(await prompt.question('Verified Resend sender email (optional; blank auto-detects with a domain-list key): '));
      }
    } finally { prompt.close(); }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid admin email address.');
  if (resendFromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendFromEmail)) throw new Error('Enter a valid verified Resend sender email address.');

  const password = env.adminPassword || randomBytes(32).toString('base64url');
  if (password.length < 14 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('ADMIN_PASSWORD must contain at least 14 characters and at most 72 UTF-8 bytes.');
  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.create({ email, resendFromEmail, passwordHash });
  process.stdout.write(`Initial admin created for ${email}.\n`);
  if (!env.adminPassword) process.stdout.write(`Generated one-time password: ${password}\nSave it now; it is shown only during this setup. You can change it after signing in.\n`);
} catch (error) {
  process.stderr.write(`Admin setup failed: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  await closeDatabase().catch(() => {});
}
