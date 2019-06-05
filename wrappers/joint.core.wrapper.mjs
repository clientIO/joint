import '../plugins/polyfills/index.mjs';
import * as basic from '../shapes/basic.mjs';
import * as standard from '../shapes/standard.mjs';

const shapes = { basic, standard };
const format = {};
const ui = {};

export * from '../src/namespaces.mjs';
export {
    format,
    ui,
    shapes,
}
