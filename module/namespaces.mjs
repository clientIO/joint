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
import * as core from '../src/core.js';
import V from '../src/vectorizer.js';

const Vectorizer = V;

const version = core.version;
const setTheme = core.setTheme;
const env = core.env;

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
}
