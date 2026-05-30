/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    __DEV__: true,
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/__tests__/$1',
    '^expo-secure-store$': '<rootDir>/__tests__/__mocks__/expo-secure-store.ts',
    '^expo-crypto$': '<rootDir>/__tests__/__mocks__/expo-crypto.ts',
    '^expo-auth-session$': '<rootDir>/__tests__/__mocks__/expo-auth-session.ts',
    '^expo-web-browser$': '<rootDir>/__tests__/__mocks__/expo-web-browser.ts',
    '^react-native$': '<rootDir>/__tests__/__mocks__/react-native.ts',
    '^react-native-quick-crypto$': '<rootDir>/__tests__/__mocks__/react-native-quick-crypto.ts',
  },
  transform: {
    '^.+\.tsx?$': ['ts-jest', { diagnostics: false, tsconfig: { experimentalDecorators: true } }],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
};
