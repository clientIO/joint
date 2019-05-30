import $ from 'jquery';
import * as BackboneModule from 'backbone';
import * as g from '../../src/geometry.js';
import * as util from './../util/index.mjs';
import * as mvc from '../mvc/index.mjs';
import V from '../../src/vectorizer.js';
import * as joint from '../../src/core.js';
import { ToolView, ToolsView } from '../../src/joint.dia.tools.js';

import { Port } from '../layout/port.mjs';
import { PortLabel } from '../layout/portLabel.mjs';
import * as connectors from '../connectors/index.mjs';
import * as highlighters from '../highlighters/index.mjs';
import * as connectionPoints from '../connectionpoints/index.mjs';
import * as connectionStrategies from '../connectionpoints/index.mjs';
import * as routers from '../routers/index.mjs';
import * as anchors from '../anchors/index.mjs';

const Backbone = Object.assign({}, BackboneModule.default);

Object.assign(joint.connectionPoints, connectionPoints);
Object.assign(joint.connectionStrategies, connectionStrategies);
Object.assign(joint.highlighters, highlighters);
Object.assign(joint.connectors, connectors);
Object.assign(joint.util, util);
Object.assign(joint.mvc, mvc);
Object.assign(joint.layout, { Port, PortLabel });
Object.assign(joint.routers, routers);
Object.assign(joint.anchors, anchors);
Object.assign(joint.dia, { ToolView, ToolsView });
