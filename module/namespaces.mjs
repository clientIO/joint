import * as connectors from '../module/connectors/index.mjs';
import * as highlighters from '../module/highlighters/index.mjs';
import * as connectionPoints from '../module/connectionPoints/index.mjs';
import * as connectionStrategies from '../module/connectionStrategies/index.mjs';
import * as routers from '../module/routers/index.mjs';
import * as anchors from '../module/anchors/index.mjs';
import * as linkAnchors from '../module/linkAnchors/index.mjs';
import * as dia from '../module/dia/index.mjs';
import * as linkTools from '../module/linkTools/index.mjs';
import * as util from '../module/util/index.mjs';
import * as mvc from '../module/mvc/index.mjs';
import * as g from '../src/geometry.js';
import V from '../src/vectorizer.js';

const Vectorizer = V;

export * from '../module/config.mjs';
export {
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
