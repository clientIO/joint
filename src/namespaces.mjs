import * as connectors from '../connectors/index.mjs';
import * as highlighters from '../highlighters/index.mjs';
import * as connectionPoints from '../connectionPoints/index.mjs';
import * as connectionStrategies from '../connectionStrategies/index.mjs';
import * as routers from '../routers/index.mjs';
import * as anchors from '../anchors/index.mjs';
import * as linkAnchors from '../linkAnchors/index.mjs';
import * as dia from '../dia/index.mjs';
import * as linkTools from '../linkTools/index.mjs';
import * as util from '../util/index.mjs';
import * as mvc from '../mvc/index.mjs';
import * as g from '../src/geometry.js';
import * as config from '../src/config.js';
import V from '../src/vectorizer.js';
import { Port } from '../layout/port.mjs'
import { PortLabel } from '../layout/portLabel.mjs'

export const version = 'VERSION';
export const Vectorizer = V;
export const layout = { PortLabel, Port };
export { env } from '../src/env.mjs'
export { setTheme } from '../src/util.setTheme.mjs';
export {
    config,
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
    V,
    g
}
