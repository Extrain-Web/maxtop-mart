import { User } from '../modules/user/user.model';

/**
 * One-time superadmin bootstrap for a fresh deployment.
 *
 * Set SUPERADMIN_EMAIL + SUPERADMIN_PASSWORD (optionally SUPERADMIN_NAME) in the
 * server's environment and start it once: the account is created if that email
 * does not exist yet. An account that already exists is only promoted — its
 * password is never overwritten — so a restart can never reset a live password.
 * Remove SUPERADMIN_PASSWORD from the environment once you have signed in.
 */
export async function ensureSuperadmin(): Promise<void> {
    const email = (process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.SUPERADMIN_PASSWORD || '';
    if (!email || !password) return;

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            if (existing.role !== 'superadmin' || existing.status !== 'active') {
                existing.role = 'superadmin';
                existing.status = 'active';
                existing.isEmailVerified = true;
                await existing.save({ validateBeforeSave: false });
                console.log(`👑 Superadmin bootstrap: promoted existing account ${email}`);
            }
            return;
        }

        const parts = (process.env.SUPERADMIN_NAME || 'Super Admin').trim().split(/\s+/);
        await User.create({
            email,
            password, // hashed by the model's pre-save hook
            firstName: parts[0] || 'Super',
            lastName: parts.slice(1).join(' ') || 'Admin',
            role: 'superadmin',
            status: 'active',
            isEmailVerified: true,
        });
        console.log(`👑 Superadmin bootstrap: created ${email} — remove SUPERADMIN_PASSWORD from the environment now.`);
    } catch (error) {
        console.error('👑 Superadmin bootstrap failed:', (error as Error).message);
    }
}
