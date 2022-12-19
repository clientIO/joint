import '../packages/core/src/polyfills/index.mjs';
import * as basic from '../packages/core/src/shapes/basic.mjs';
import * as standard from '../packages/core/src/shapes/standard.mjs';

const shapes = { basic, standard };
const format = {};
const ui = {};

export * from '../packages/core/src/core.mjs';
export {
    format,
    ui,
    shapes,
}
