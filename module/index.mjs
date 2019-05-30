import './polyfills.mjs';
import * as layout from './layout/index.mjs';
import * as connectors from './connectors/index.mjs';
import * as highlighters from './highlighters/index.mjs';
import * as connectionPoints from './connectionpoints/index.mjs';
import * as connectionStrategies from './connectionstrategies/index.mjs';
import * as routers from './routers/index.mjs';
import * as anchors from './anchors/index.mjs';
import * as linkAnchors from './linkAnchors/index.mjs';
import * as dia from './dia/index.mjs';
import * as shapes from './shapes/index.mjs';
import * as linkTools from './linkTools/index.mjs';
import * as util from './util/index.mjs';
import * as mvc from './mvc/index.mjs';
import * as g from '../src/geometry.js';
import V from '../src/vectorizer.js';
const Vectorizer = V;

export * from './config.mjs';
export {
    anchors,
    linkAnchors,
    connectionPoints,
    connectionStrategies,
    connectors,
    dia,
    highlighters,
    layout,
    linkTools,
    routers,
    shapes,
    util,
    mvc,
    Vectorizer,
    V,
    g
}
