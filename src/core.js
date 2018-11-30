import * as _util from './util';
import * as _mvc from './mvc';
import { config as _config } from './config';
import { env as _env } from './env';
import { V as vectorizer } from './vectorizer';
import * as geometry from './geometry';
import { Cell } from './cell';
import { CellView } from './cellView';
import { ToolView } from './toolView';
import { ToolsView } from './toolsView';
import { Graph } from './graph';
import { Link } from './link.js';
import { LinkView } from './linkView.js';
import { Paper } from './paper';
import { Element } from './element';
import { ElementView } from './elementView';
import * as attributes from './attributes';

export const version = '[%= pkg.version %]';

export const config = _config;

export const mvc = {
    views: _mvc.views,
    View: _mvc.View
};

export const setTheme = _mvc.setTheme;

export const env = _env;

export const util = _util;

export const V = vectorizer;

export const Vectorizer = vectorizer;

export const g = geometry;

export const dia = {
    attributes: attributes.attributesNS,
    Cell,
    CellView,
    Element,
    ElementView,
    Link,
    LinkView,
    Graph,
    Paper,
    ToolView,
    ToolsView,
};
