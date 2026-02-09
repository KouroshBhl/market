import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@workspace/db$': '<rootDir>/../../packages/db/src/index.ts',
    '^@workspace/contracts$': '<rootDir>/../../packages/contracts/src/index.ts',
  },
};

export default config;
