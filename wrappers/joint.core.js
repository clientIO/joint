import * as connectors from '../module/connectors/index.js';
import * as highlighters from '../module/highlighters/index.js';
import * as connectionPoints from '../module/connectionPoints/index.js';
import * as connectionStrategies from '../module/connectionStrategies/index.js';
import * as routers from '../module/routers/index.js';
import * as anchors from '../module/anchors/index.js';
import * as linkAnchors from '../module/linkAnchors/index.mjs';
import * as dia from '../module/dia/index.js';
import * as linkTools from '../module/linkTools/index.js';
import * as mvc from '../module/mvc/index.js';
import { Port } from '../module/layout/port.js'
import { PortLabel } from '../module/layout/portLabel.js'
import * as basic from '../module/shapes/basic.js';
import * as standard from '../module/shapes/standard.js';

const shapes = { basic, standard };
const layout = { PortLabel, Port };
const format = {};
const ui = {};

export * from '../module/base.js';
export {
    anchors,
    linkAnchors,
    connectionPoints,
    connectionStrategies,
    connectors,
    dia,
    format,
    highlighters,
    layout,
    mvc,
    routers,
    ui,
    shapes,
    linkTools
}
