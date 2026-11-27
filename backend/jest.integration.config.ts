import type { JestConfigWithTsJest } from 'ts-jest';

/**
 * Integration tests against a real postgrest and database (see integration/docker-compose.yml).
 * `roots` only contains the integration folder, so the manual mocks in `__mocks__`
 * (jsonwebtoken, postgrest-js, fs) are NOT applied here.
 */
const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/integration'],
  testMatch: ['**/*.int.spec.ts'],
  globalSetup: '<rootDir>/integration/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/integration/setup/globalTeardown.ts',
  // the tests share one database and read the env set in globalSetup
  maxWorkers: 1,
  testTimeout: 30_000,
  // hide the expected error logs of the backend; show them with --silent=false
  silent: true
};

export default jestConfig;
