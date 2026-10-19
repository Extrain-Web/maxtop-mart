// Start a command with extra environment variables (used by .claude/launch.json).
// Usage: node with-env.cjs KEY=VALUE [KEY=VALUE ...] -- command [args...]
const { spawn } = require('node:child_process');

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
if (sep < 1 || sep === argv.length - 1) {
    console.error('usage: node with-env.cjs KEY=VALUE [...] -- command [args...]');
    process.exit(2);
}

const env = { ...process.env };
for (const pair of argv.slice(0, sep)) {
    const i = pair.indexOf('=');
    if (i > 0) env[pair.slice(0, i)] = pair.slice(i + 1);
}

const [cmd, ...args] = argv.slice(sep + 1);
const child = spawn(cmd, args, { env, stdio: 'inherit', shell: process.platform === 'win32' });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
