import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    'default',
    '@casualbot/jest-sonar-reporter'
  ],
  coverageReporters: ['json-summary', 'lcov', 'text'],
  coverageThreshold: {
    global: {
      lines: 92,
      statements: 92,
      functions: 95,
      branches: 82
    }
  },
  // integration tests run separately: npm run test:integration
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/integration/'],
  moduleNameMapper: {
    '^node:fs/promises$': 'fs/promises'
  }
};

export default jestConfig;
