import type * as dia from './dia';
import type * as attributes from './attributes';
import type { Nullable } from './internal';

export interface SVGTextSelector extends dia.Cell.Selectors {
    text?: Nullable<attributes.SVGTextAttributes>;
}

export interface SVGRectSelector extends dia.Cell.Selectors {
    rect?: Nullable<attributes.SVGRectAttributes>;
}

export interface SVGCircleSelector extends dia.Cell.Selectors {
    circle?: Nullable<attributes.SVGCircleAttributes>;
}

export interface SVGEllipseSelector extends dia.Cell.Selectors {
    ellipse?: Nullable<attributes.SVGEllipseAttributes>;
}

export interface SVGPolygonSelector extends dia.Cell.Selectors {
    polygon?: Nullable<attributes.SVGPolygonAttributes>;
}

export interface SVGPolylineSelector extends dia.Cell.Selectors {
    polyline?: Nullable<attributes.SVGPolylineAttributes>;
}

export interface SVGImageSelector extends dia.Cell.Selectors {
    image?: Nullable<attributes.SVGImageAttributes>;
}

export interface SVGPathSelector extends dia.Cell.Selectors {
    path?: Nullable<attributes.SVGPathAttributes>;
}

export * as standard from './shapes-standard';
