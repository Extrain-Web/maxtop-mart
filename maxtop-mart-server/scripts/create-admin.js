#!/usr/bin/env node
/**
 * Create (or update) an admin / superadmin account directly in the database.
 *
 *   node scripts/create-admin.js --email you@example.com --role superadmin
 *       ...and type the password when prompted (it is not echoed or stored in shell history)
 *
 *   node scripts/create-admin.js --db "mongodb://user:pass@host:27017/dbname" --email you@example.com
 *       ...to target a remote (live) database instead of the one in .env
 *
 * Flags: --email  --password  --role (superadmin|admin)  --name  --db  --force
 * The password is hashed with bcrypt exactly like the signup route, so the
 * account can log in normally at /login and reach /dashboard/admin.
 */
require('dotenv').config();
const readline = require('node:readline');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const args = process.argv.slice(2);
const has = (name) => args.some((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const flag = (name) => {
    const i = args.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
    if (i < 0) return undefined;
    return args[i].includes('=') ? args[i].slice(args[i].indexOf('=') + 1) : args[i + 1];
};
const stop = (message) => { console.error(message); process.exit(1); };

/** Hide the database password when printing the target. */
const redact = (uri) => uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');

function askHidden(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        const write = rl._writeToOutput.bind(rl);
        let muted = false;
        rl._writeToOutput = (s) => { if (!muted) write(s); };
        rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer.trim()); });
        muted = true;
    });
}

(async () => {
    const email = (flag('email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const role = (flag('role') || 'superadmin').trim();
    const name = (flag('name') || 'Super Admin').trim();
    const uri = flag('db') || process.env.DATABASE_URL;
    const force = has('force');
    let password = flag('password') || process.env.ADMIN_PASSWORD || '';

    if (!uri) stop('No database URL. Pass --db "<mongodb uri>" or set DATABASE_URL.');
    if (!/^\S+@\S+\.\S+$/.test(email)) stop('Pass a valid email, e.g. --email you@example.com');
    if (!['superadmin', 'admin'].includes(role)) stop('--role must be "superadmin" or "admin".');

    console.log(`Target: ${redact(uri)}`);
    if (!password) password = await askHidden(`Password for ${email}: `);
    if (!password) stop('No password given.');
    if (password.length < 8 && !force) stop('Password must be at least 8 characters (add --force to override).');
    if (password.toLowerCase() === email && !force) stop('Password must not be the same as the email (add --force to override).');

    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hash = await bcrypt.hash(password, rounds);
    const [firstName, ...rest] = name.split(/\s+/);
    const now = new Date();

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const users = mongoose.connection.db.collection('users');
    const existing = await users.findOne({ email }, { projection: { _id: 1 } });

    if (existing) {
        await users.updateOne({ _id: existing._id }, {
            $set: {
                password: hash, role, status: 'active', isEmailVerified: true, isDeleted: false,
                passwordChangedAt: new Date(now.getTime() - 1000), updatedAt: now,
            },
        });
    } else {
        await users.insertOne({
            email, password: hash,
            firstName: firstName || 'Super', lastName: rest.join(' ') || 'Admin',
            phone: '', avatar: '', role, permissions: [], status: 'active',
            isEmailVerified: true, isDeleted: false, shippingAddresses: [], wishlist: [],
            totalOrders: 0, totalSpent: 0, createdAt: now, updatedAt: now, __v: 0,
        });
    }

    const dbName = mongoose.connection.name;
    await mongoose.disconnect();
    console.log(`${existing ? 'Updated' : 'Created'} ${role}: ${email}  (database "${dbName}")`);
    console.log('Sign in at /login, then open /dashboard/admin.');
})().catch((err) => { console.error('Failed:', err.message); process.exit(1); });
