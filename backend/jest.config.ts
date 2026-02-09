import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Set JWT_SECRET for tests that need config
  globals: {},
}

// Ensure JWT_SECRET is set before config module is loaded
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest'

export default config
