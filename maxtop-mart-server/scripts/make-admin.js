#!/usr/bin/env node
/**
 * Promote a registered account to admin (no Mongo shell needed).
 *
 *   npm run make-admin -- you@example.com              → role: admin
 *   npm run make-admin -- you@example.com superadmin   → role: superadmin
 *
 * Register on the site first (/register), run this, then log in again so the
 * new role is in your session → /dashboard/admin.
 * Uses DATABASE_URL from .env (falls back to the local MongoDB).
 */
require('dotenv').config();
const mongoose = require('mongoose');

const [email, role = 'admin'] = process.argv.slice(2);
if (!email || !['admin', 'superadmin'].includes(role)) {
    console.error('Usage: npm run make-admin -- <email> [admin|superadmin]');
    process.exit(1);
}
const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/maxtopmart';

(async () => {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const users = mongoose.connection.db.collection('users');
    const result = await users.findOneAndUpdate(
        { email: email.toLowerCase().trim(), isDeleted: { $ne: true } },
        { $set: { role, status: 'active', isEmailVerified: true } },
        { returnDocument: 'after', projection: { email: 1, role: 1 } },
    );
    await mongoose.disconnect();
    const doc = result && (result.value || result); // works with old and new driver result shapes
    if (!doc || !doc.email) {
        console.error(`No account found for "${email}". Register on the site first (/register), then run this again.`);
        process.exit(1);
    }
    console.log(`Done: ${doc.email} is now ${doc.role}. Log out and log in again, then open /dashboard/admin.`);
})().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
