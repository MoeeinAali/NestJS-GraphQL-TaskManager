import { TEST_DATABASE_URL } from './test-database';

// Runs in each worker before any application code loads, so PrismaClient
// and ConfigModule both pick up the test database.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
// Keep test output clean regardless of what the local .env says.
process.env.LOG_LEVEL = 'silent';
