import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    'default',
    '@casualbot/jest-sonar-reporter'
  ],
  coverageReporters: ['json-summary', 'lcov', 'text'],
  moduleNameMapper: {
    '^node:fs/promises$': 'fs/promises'
  }
};

export default jestConfig;
