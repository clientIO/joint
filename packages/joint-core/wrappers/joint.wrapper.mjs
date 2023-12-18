import '../src/polyfills/index.mjs';

// extend the `layout` namespace
import * as Port from '../src/layout/ports/port.mjs';
import * as PortLabel from '../src/layout/ports/portLabel.mjs';
import * as shapes from '../src/shapes/index.mjs';

export const layout = { PortLabel, Port };

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
} from '../src/core.mjs';

export { shapes };
