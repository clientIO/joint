import '../plugins/polyfills/index.mjs';
import { Port } from '../layout/port.mjs'
import { PortLabel } from '../layout/portLabel.mjs'
import * as basic from '../shapes/basic.mjs';
import * as standard from '../shapes/standard.mjs';

const shapes = { basic, standard };
const layout = { PortLabel, Port };
const format = {};
const ui = {};

export * from '../src/namespaces.mjs';
export {
    format,
    layout,
    ui,
    shapes,
}
