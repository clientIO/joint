export default {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // Recognize file extensions
  setupFilesAfterEnv: [
    '<rootDir>/__mocks__/jest-setup.ts',
    '<rootDir>/__mocks__/development-mock.ts',
  ],
  moduleNameMapper: {
    '^.+\\.css$': '<rootDir>/__mocks__/style-mock.ts', // Mock CSS files
    '^@joint/react$': '<rootDir>/src/index.ts',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^storybook-config/(.*)$': '<rootDir>/.storybook/$1',
  },
  testMatch: ['<rootDir>/src/**/*.{test,spec}.ts?(x)'], // Only run tests in src folder
};
