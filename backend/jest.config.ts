import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  reporters: [
    'default',
    '@casualbot/jest-sonar-reporter'
  ],
  coverageReporters: ['json-summary', 'lcov', 'text'],
};

export default jestConfig;
