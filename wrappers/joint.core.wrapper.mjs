import '../module/polyfills.mjs';
import { Port } from '../module/layout/port.mjs'
import { PortLabel } from '../module/layout/portLabel.mjs'
import * as basic from '../module/shapes/basic.mjs';
import * as standard from '../module/shapes/standard.mjs';

const shapes = { basic, standard };
const layout = { PortLabel, Port };
const format = {};
const ui = {};

export * from '../module/namespaces.mjs';
export {
    format,
    layout,
    ui,
    shapes,
}
