import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const dir = mkdtempSync(join(tmpdir(), 'tophitt-checkout-'));
const env = { ...process.env, DATABASE_URL: `file:${join(dir, 'test.db')}`, JWT_SECRET: 'checkout-tests-only-not-for-production', NODE_ENV: 'test' };
try {
  for (const args of [['prisma', 'migrate', 'deploy'], ['tsx', '--test', 'tests/checkout.test.ts']]) {
    const result = spawnSync('npx', args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
    if (result.status !== 0) { process.exitCode = result.status || 1; break; }
  }
} finally { rmSync(dir, { recursive: true, force: true }); }
