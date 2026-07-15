import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { TEST_DATABASE_PATH, TEST_DATABASE_URL } from './test-database';

/**
 * Runs once before the e2e suite: recreates the test database from the
 * committed Prisma migrations, so tests exercise the exact schema that
 * production would run.
 */
export default function globalSetup(): void {
  if (existsSync(TEST_DATABASE_PATH)) {
    rmSync(TEST_DATABASE_PATH);
  }

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
