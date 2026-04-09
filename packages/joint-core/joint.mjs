// Tree-shakeable namespace re-exports
export * as anchors from './src/anchors/index.mjs';
export * as connectionPoints from './src/connectionPoints/index.mjs';
export * as connectionStrategies from './src/connectionStrategies/index.mjs';
export * as connectors from './src/connectors/index.mjs';
export * as dia from './src/dia/index.mjs';
export * as elementTools from './src/elementTools/index.mjs';
export * as g from './src/g/index.mjs';
export * as highlighters from './src/highlighters/index.mjs';
export * as layout from './src/layout/index.mjs';
export * as linkAnchors from './src/linkAnchors/index.mjs';
export * as linkTools from './src/linkTools/index.mjs';
export * as mvc from './src/mvc/index.mjs';
export * as routers from './src/routers/index.mjs';
export * as shapes from './src/shapes/index.mjs';
export * as util from './src/util/index.mjs';

// Non-namespace exports (single values)
export { config } from './src/config/index.mjs';
export { env } from './src/env/index.mjs';
export { version } from './dist/version.mjs';

// Default export re-exported as named
import V from './src/V/index.mjs';
export { V };
export const Vectorizer = V;

// Function depending on util + mvc
export { setTheme } from './src/core.mjs';
