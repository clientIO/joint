import '../packages/core/src/polyfills/index.mjs';

// extend the `layout` namespace
import * as Port from '../packages/core/src/layout/ports/port.mjs';
import * as PortLabel from '../packages/core/src/layout/ports/portLabel.mjs';
import { DirectedGraph } from '../packages/core/src/layout/DirectedGraph/DirectedGraph.mjs';
import * as shapes from '../packages/core/src/shapes/index.mjs';

export const layout = { DirectedGraph, PortLabel, Port };

// export empty namespaces - backward compatibility
export const format = {};
export const ui = {};

// joint core
export {
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
    elementTools,
    Vectorizer,
    V,
    version,
    g
} from '../packages/core/src/core.mjs';

export { shapes };
