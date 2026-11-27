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
      lines: 85,
      statements: 85,
      functions: 85,
      branches: 70
    }
  },
  moduleNameMapper: {
    '^node:fs/promises$': 'fs/promises'
  }
};

export default jestConfig;
