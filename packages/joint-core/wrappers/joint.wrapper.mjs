import '../src/polyfills/index.mjs';

// export empty namespaces - backward compatibility
export const format = {};
export const ui = {};

// joint core
export * from '../src/core.mjs';

export * as shapes from '../src/shapes/index.mjs';
