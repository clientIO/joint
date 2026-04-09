import '../src/polyfills/index.mjs';
import * as shapes from '../src/shapes/index.mjs';

// export empty namespaces - backward compatibility
export const format = {};
export const ui = {};

// joint core
export * from '../src/core.mjs';

export { shapes };
