import '../plugins/polyfills/index.mjs';

// extend the `layout` namespace
import { Port } from '../layout/port.mjs'
import { PortLabel } from '../layout/portLabel.mjs'
import { DirectedGraph } from '../plugins/layout/DirectedGraph/joint.layout.DirectedGraph.js';
import * as shapes from '../shapes/index.mjs';

export const layout = { DirectedGraph, PortLabel, Port };

// export empty namespaces - backward compatibility
export const format = {};
export const ui = {};

// joint core
export {
    version,
    setTheme,
    config,
    env,
    anchors,
    linkAnchors,
    connectionPoints,
    connectionStrategies,
    connectors,
    dia,
    highlighters,
    mvc,
    routers,
    util,
    linkTools,
    Vectorizer,
    V,
    g
} from '../src/core.mjs';

export { shapes }
