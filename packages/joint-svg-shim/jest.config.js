export default {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: false,
          },
        },
      },
    ],
  },
  // happy-dom ships ESM; let SWC transform it so the optional-provider test can
  // `require()` it through the shim's `createRequire` under Jest's module runtime.
  transformIgnorePatterns: ['/node_modules/(?!(happy-dom)/)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  testMatch: ['<rootDir>/src/**/*.{test,spec}.ts?(x)'],
};
