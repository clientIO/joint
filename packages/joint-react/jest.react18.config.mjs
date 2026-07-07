// Full joint-react suite under React 18. The package develops on React 19, but
// the library supports React 18+ and some StrictMode timing differs between the
// two (e.g. the feature-creation double-render leak in use-create-features.ts).
// This runs the `default` project with React resolved to an aliased React 18
// install (devDeps `react18` / `react18-dom`). The `react-compiler` project is
// React-19-specific (babel-plugin-react-compiler target '19'), so it is skipped.
//
//   yarn test:react18   (this)
//   yarn test:react19   (default jest, React 19)
import base from './jest.config.js';

const react18Map = {
  '^react$': '<rootDir>/node_modules/react18',
  '^react-dom(.*)$': '<rootDir>/node_modules/react18-dom$1',
  '^react/(.*)$': '<rootDir>/node_modules/react18/$1',
};

export default {
  projects: base.projects
    .filter((project) => project.displayName !== 'react-compiler')
    .map((project) => ({
      ...project,
      displayName: `${project.displayName}-react18`,
      moduleNameMapper: { ...project.moduleNameMapper, ...react18Map },
    })),
};
