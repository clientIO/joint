import type * as dia from './dia';
import type * as mvc from './mvc';
import type * as attributes from './attributes';
import type { Nullable } from './internal';

export interface RectangleSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    body?: Nullable<attributes.SVGRectAttributes>;
    label?: Nullable<attributes.SVGTextAttributes>;
}

export type RectangleAttributes = dia.Element.Attributes<RectangleSelectors>;

export class Rectangle extends dia.Element<RectangleAttributes> {
}

export interface CircleSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    body?: Nullable<attributes.SVGCircleAttributes>;
    label?: Nullable<attributes.SVGTextAttributes>;
}

export type CircleAttributes = dia.Element.Attributes<CircleSelectors>;

export class Circle extends dia.Element<CircleAttributes> {
}

export interface EllipseSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    body?: Nullable<attributes.SVGEllipseAttributes>;
    label?: Nullable<attributes.SVGTextAttributes>;
}

export type EllipseAttributes = dia.Element.Attributes<EllipseSelectors>;

export class Ellipse extends dia.Element<EllipseAttributes> {
}

export interface PathSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    body?: Nullable<attributes.SVGPathAttributes>;
    label?: Nullable<attributes.SVGTextAttributes>;
}

export type PathAttributes = dia.Element.Attributes<PathSelectors>;

export class Path extends dia.Element<PathAttributes> {
}

export interface PolygonSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    body?: Nullable<attributes.SVGPolygonAttributes>;
    label?: Nullable<attributes.SVGTextAttributes>;
}

export type PolygonAttributes = dia.Element.Attributes<PolygonSelectors>;

export class Polygon extends dia.Element<PolygonAttributes> {
}

export interface PolylineSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    body?: Nullable<attributes.SVGPolylineAttributes>;
    label?: Nullable<attributes.SVGTextAttributes>;
}

export type PolylineAttributes = dia.Element.Attributes<PolylineSelectors>;

export class Polyline extends dia.Element<PolylineAttributes> {
}

export interface ImageSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    image?: Nullable<attributes.SVGImageAttributes>;
    label?: Nullable<attributes.SVGTextAttributes>;
}

export type ImageAttributes = dia.Element.Attributes<ImageSelectors>;

export class Image extends dia.Element<ImageAttributes> {
}

export interface BorderedImageSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    border?: Nullable<attributes.SVGRectAttributes>;
    background?: Nullable<attributes.SVGRectAttributes>;
    image?: Nullable<attributes.SVGImageAttributes>;
    label?: Nullable<attributes.SVGTextAttributes>;
}

export type BorderedImageAttributes = dia.Element.Attributes<BorderedImageSelectors>;

export class BorderedImage extends dia.Element<BorderedImageAttributes> {
}

export interface EmbeddedImageSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    body?: Nullable<attributes.SVGRectAttributes>;
    image?: Nullable<attributes.SVGImageAttributes>;
    label?: Nullable<attributes.SVGTextAttributes>;
}

export type EmbeddedImageAttributes = dia.Element.Attributes<EmbeddedImageSelectors>;

export class EmbeddedImage extends dia.Element<EmbeddedImageAttributes> {
}

export interface InscribedImageSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    border?: Nullable<attributes.SVGEllipseAttributes>;
    background?: Nullable<attributes.SVGEllipseAttributes>;
    image?: Nullable<attributes.SVGImageAttributes>;
    label?: Nullable<attributes.SVGTextAttributes>;
}

export type InscribedImageAttributes = dia.Element.Attributes<InscribedImageSelectors>;

export class InscribedImage extends dia.Element<InscribedImageAttributes> {
}

export interface HeaderedRectangleSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    body?: Nullable<attributes.SVGRectAttributes>;
    header?: Nullable<attributes.SVGRectAttributes>;
    headerText?: Nullable<attributes.SVGTextAttributes>;
    bodyText?: Nullable<attributes.SVGTextAttributes>;
}

export type HeaderedRectangleAttributes = dia.Element.Attributes<HeaderedRectangleSelectors>;

export class HeaderedRectangle extends dia.Element<HeaderedRectangleAttributes> {
}

export interface CylinderBodyAttributes extends attributes.SVGPathAttributes {
    lateralArea?: string | number;
}

export interface CylinderSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    body?: CylinderBodyAttributes;
    top?: Nullable<attributes.SVGEllipseAttributes>;
}

export type CylinderAttributes = dia.Element.Attributes<CylinderSelectors>;

export class Cylinder<S extends mvc.ModelSetOptions = dia.ModelSetOptions> extends dia.Element<CylinderAttributes, S> {
    topRy(): string | number;
    topRy(t: string | number, opt?: S): this;
}

export interface TextBlockSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    body?: Nullable<attributes.SVGRectAttributes>;
    label?: Nullable<{
        text?: string;
        style?: { [key: string]: any };
        [key: string]: any;
    }>;
}

export type TextBlockAttributes = dia.Element.Attributes<TextBlockSelectors>;

export class TextBlock extends dia.Element<TextBlockAttributes> {
}

export interface LinkSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    line?: Nullable<attributes.SVGPathAttributes>;
    wrapper?: Nullable<attributes.SVGPathAttributes>;
}

export type LinkAttributes = dia.Link.Attributes<LinkSelectors>;

export class Link extends dia.Link<LinkAttributes> {
}

export interface DoubleLinkSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    line?: Nullable<attributes.SVGPathAttributes>;
    outline?: Nullable<attributes.SVGPathAttributes>;
}

export type DoubleLinkAttributes = dia.Link.Attributes<DoubleLinkSelectors>;

export class DoubleLink extends dia.Link<DoubleLinkAttributes> {
}

export interface ShadowLinkSelectors extends dia.Cell.Selectors {
    root?: Nullable<attributes.SVGAttributes>;
    line?: Nullable<attributes.SVGPathAttributes>;
    shadow?: Nullable<attributes.SVGPathAttributes>;
}

export type ShadowLinkAttributes = dia.Link.Attributes<ShadowLinkSelectors>;

export class ShadowLink extends dia.Link<ShadowLinkAttributes> {
}
