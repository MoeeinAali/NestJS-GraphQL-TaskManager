import { join } from 'node:path';

/** Absolute path keeps the URL unambiguous regardless of the cwd. */
export const TEST_DATABASE_PATH = join(__dirname, 'e2e.db');
export const TEST_DATABASE_URL = `file:${TEST_DATABASE_PATH}`;
