// Pattern marking the React Compiler behavioural suite. These files run ONLY
// under the `react-compiler` project (compiled with babel-plugin-react-compiler)
// and are excluded from the default `@swc/jest` project — their assertions
// depend on the compiler's auto-memoization being active.
const COMPILER_TEST_PATTERN = String.raw`\.compiler\.test\.tsx$`;

/** Options shared by every project. */
const base = {
  testEnvironment: 'jsdom',
  modulePathIgnorePatterns: [String.raw`\.stories\.(ts|tsx)$`],
  transformIgnorePatterns: ['/node_modules/(?!tinybench)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  setupFilesAfterEnv: [
    '<rootDir>/__mocks__/jest-setup.ts',
    '<rootDir>/__mocks__/development-mock.ts',
  ],
  moduleNameMapper: {
    '^.+\\.css$': '<rootDir>/__mocks__/style-mock.ts', // Mock CSS files
    '^@joint/react$': '<rootDir>/src/index.ts',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^storybook-config/(.*)$': '<rootDir>/.storybook/$1',
    '^storybook/theming$': '<rootDir>/__mocks__/storybook-mock.ts',
    '^storybook/internal/types$': '<rootDir>/__mocks__/storybook-mock.ts',
  },
};

/** Fast default project: every suite except the compiler one, via @swc/jest. */
const defaultProject = {
  ...base,
  displayName: 'default',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', COMPILER_TEST_PATTERN],
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'automatic' } },
        },
      },
    ],
  },
  testMatch: ['<rootDir>/src/**/*.{test,spec}.ts?(x)'],
};

// Source — including the real components imported through the `@joint/react`
// alias — is transformed by babel-plugin-react-compiler here, so the compiler's
// auto-memoization runs end-to-end. `*.compiler.test.tsx` suites then assert
// behaviour is unchanged AND that memoization is actually active.
const reactCompilerProject = {
  ...base,
  displayName: 'react-compiler',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': [
      'babel-jest',
      {
        presets: [
          // `@swc/jest` transpiles ESM → CJS implicitly; with babel we must do
          // it explicitly (targeting the running Node) or the setup files fail
          // with "Cannot use import statement outside a module".
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          ['@babel/preset-typescript', {}],
        ],
        // The compiler must run before the presets so it sees original JSX/hooks.
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    ],
  },
  testMatch: ['<rootDir>/src/**/*.compiler.test.tsx'],
};

export default {
  projects: [defaultProject, reactCompilerProject],
};
