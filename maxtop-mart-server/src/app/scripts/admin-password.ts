/**
 * Admin password tool — change (or create) an admin / superadmin login.
 *
 * Run it inside the backend container (Coolify → maxtop-mart → Terminal →
 * choose the "backend" container):
 *
 *     node dist/src/app/scripts/admin-password.js
 *
 * Locally (from maxtop-mart-server):  npx ts-node src/app/scripts/admin-password.ts
 *
 * It lists every admin account, asks which email to change, then asks for the
 * new password twice (typing is hidden). If the email does not exist yet you
 * can create it as a new Super Admin. Uses DATABASE_URL from the environment.
 */
import 'dotenv/config';
import readline from 'readline';
import { Writable } from 'stream';
import mongoose from 'mongoose';
import config from '../config';
import { User } from '../modules/user/user.model';

// Output goes through a stream we can mute, so passwords are not echoed.
let muted = false;
const output = new Writable({
    write(chunk, _enc, cb) {
        if (!muted) process.stdout.write(chunk);
        cb();
    },
});
const rl = readline.createInterface({ input: process.stdin, output, terminal: !!process.stdin.isTTY });

// Queue lines so it also works when answers are piped in.
const lines: string[] = [];
const waiters: ((l: string) => void)[] = [];
let closed = false;
rl.on('line', (l) => (waiters.length ? waiters.shift()!(l) : lines.push(l)));
rl.on('close', () => {
    closed = true;
    while (waiters.length) waiters.shift()!('');
});
const nextLine = () => new Promise<string>((resolve) => (lines.length ? resolve(lines.shift()!) : closed ? resolve('') : waiters.push(resolve)));

const ask = async (q: string) => {
    process.stdout.write(q);
    return (await nextLine()).trim();
};

/** Ask without echoing what is typed (for passwords). */
const askHidden = async (q: string) => {
    process.stdout.write(q);
    muted = true;
    const answer = await nextLine();
    muted = false;
    process.stdout.write('\n');
    return answer;
};

const fail = async (msg: string) => {
    console.error(`\n✘ ${msg}`);
    rl.close();
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
};

(async () => {
    console.log('\n🔐  Maxtop Mart — admin password tool\n');
    try {
        await mongoose.connect(config.database_url, { serverSelectionTimeoutMS: 8000 });
    } catch (e) {
        return fail(`Could not connect to the database: ${(e as Error).message}`);
    }

    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, isDeleted: { $ne: true } })
        .select('email firstName lastName role status')
        .sort({ role: -1, email: 1 })
        .lean();

    if (admins.length) {
        console.log('Admin accounts in this database:');
        admins.forEach((a, i) =>
            console.log(`  ${String(i + 1).padStart(2)}. ${a.email || '(no email)'}  —  ${a.role}${a.status !== 'active' ? ` (${a.status})` : ''}`)
        );
    } else {
        console.log('No admin accounts yet.');
    }

    const input = await ask('\nEmail to change (or a number from the list): ');
    const picked = /^\d+$/.test(input) ? admins[Number(input) - 1]?.email : input;
    const email = (picked || '').toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('That is not a valid email.');

    let user = await User.findOne({ email, isDeleted: { $ne: true } }).select('+password');
    let creating = false;
    if (!user) {
        const yes = (await ask(`No account with ${email}. Create it as a new Super Admin? (y/n): `)).toLowerCase();
        if (yes !== 'y' && yes !== 'yes') return fail('Nothing changed.');
        creating = true;
    }

    const pass = await askHidden('New password (min 10 characters, hidden): ');
    if (pass.length < 10) return fail('Password must be at least 10 characters.');
    const again = await askHidden('Type the new password again: ');
    if (pass !== again) return fail('The two passwords do not match. Nothing changed.');

    if (creating) {
        const name = (await ask('Name for this admin (e.g. Abu Taleb): ')) || 'Super Admin';
        const [firstName, ...rest] = name.split(/\s+/);
        user = await User.create({
            email,
            password: pass, // hashed by the model's pre-save hook
            firstName,
            lastName: rest.join(' ') || 'Admin',
            role: 'superadmin',
            status: 'active',
            isEmailVerified: true,
        });
        console.log(`\n✔ Created Super Admin ${email}. You can log in now.`);
    } else if (user) {
        let makeSuper = false;
        if (user.role !== 'superadmin') {
            makeSuper = ['y', 'yes'].includes((await ask('Also make this account a Super Admin? (y/n): ')).toLowerCase());
        }
        user.password = pass; // hashed by pre-save; also sets passwordChangedAt → old logins are signed out
        user.status = 'active';
        if (makeSuper) {
            user.role = 'superadmin';
            user.permissions = [];
        }
        await user.save({ validateBeforeSave: false });
        console.log(`\n✔ Password changed for ${email}${makeSuper ? ' (now Super Admin)' : ''}. Old sessions for this account are signed out.`);
    }

    rl.close();
    await mongoose.disconnect();
    process.exit(0);
})();
