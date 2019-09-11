import * as connectors from './connectors/index.mjs';
import * as highlighters from './highlighters/index.mjs';
import * as connectionPoints from './connectionPoints/index.mjs';
import * as connectionStrategies from './connectionStrategies/index.mjs';
import * as routers from './routers/index.mjs';
import * as anchors from './anchors/index.mjs';
import * as linkAnchors from './linkAnchors/index.mjs';
import * as dia from './dia/index.mjs';
import * as linkTools from './linkTools/index.mjs';
import * as elementTools from './elementTools/index.mjs';
import * as util from './util/index.mjs';
import * as mvc from './mvc/index.mjs';
import * as g from './g/index.mjs';
import { config } from './config/index.mjs';
import V from './V/index.mjs';
import * as Port from './layout/ports/port.mjs';
import * as PortLabel from './layout/ports/portLabel.mjs';

export * from '../dist/version.mjs';
export const Vectorizer = V;
export const layout = { PortLabel, Port };
export { env } from './env/index.mjs';
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
    elementTools,
    V,
    g
};
export const setTheme = function(theme, opt) {

    opt = opt || {};

    util.invoke(mvc.views, 'setTheme', theme, opt);

    // Update the default theme on the view prototype.
    mvc.View.prototype.defaultTheme = theme;
};
