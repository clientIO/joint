import '../src/polyfills/index.mjs';
import * as basic from '../src/shapes/basic.mjs';
import * as standard from '../src/shapes/standard.mjs';

const shapes = { basic, standard };
const format = {};
const ui = {};

export * from '../src/core.mjs';
export {
    format,
    ui,
    shapes,
}
