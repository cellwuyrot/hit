import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const dir = mkdtempSync(join(tmpdir(), 'tophitt-e2e-'));
const env = { ...process.env, DATABASE_URL: `file:${join(dir, 'test.db')}`, JWT_SECRET: 'e2e-tests-only-not-for-production', NODE_ENV: 'production', E2E_FIXTURE_FILE: join(dir, 'fixture.json') };
try {
  for (const args of [['prisma', 'migrate', 'deploy'], ['tsx', 'tests/e2e/seed.ts'], ['playwright', 'test']]) {
    const result = spawnSync('npx', args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
    if (result.status !== 0) { process.exitCode = result.status || 1; break; }
  }
} finally { rmSync(dir, { recursive: true, force: true }); }
