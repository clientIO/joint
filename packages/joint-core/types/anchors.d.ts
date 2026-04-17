import type * as dia from './dia';
import type * as g from './geometry';
import type * as linkAnchors from './linkAnchors';

export interface ElementAnchorArguments {
    useModelGeometry?: boolean;
}

export interface RotateAnchorArguments extends ElementAnchorArguments {
    rotate?: boolean;
}

export interface BBoxAnchorArguments extends RotateAnchorArguments {
    dx?: number | string;
    dy?: number | string;
}

export interface PaddingAnchorArguments extends ElementAnchorArguments {
    padding?: number;
}

export interface MidSideAnchorArguments extends RotateAnchorArguments, PaddingAnchorArguments {
    mode?: 'prefer-horizontal' | 'prefer-vertical' | 'horizontal' | 'vertical' | 'auto' | 'top-bottom' | 'bottom-top' | 'left-right' | 'right-left';
    preferenceThreshold?: dia.Sides;
}

export interface ModelCenterAnchorArguments {
    dx?: number;
    dy?: number;
}

export interface AnchorArgumentsMap {
    'center': BBoxAnchorArguments;
    'top': BBoxAnchorArguments;
    'bottom': BBoxAnchorArguments;
    'left': BBoxAnchorArguments;
    'right': BBoxAnchorArguments;
    'topLeft': BBoxAnchorArguments;
    'topRight': BBoxAnchorArguments;
    'bottomLeft': BBoxAnchorArguments;
    'bottomRight': BBoxAnchorArguments;
    'perpendicular': PaddingAnchorArguments;
    'midSide': MidSideAnchorArguments;
    'modelCenter': ModelCenterAnchorArguments;
    'connectionRatio': linkAnchors.ConnectionLengthAnchorArguments;
    'connectionLength': linkAnchors.ConnectionLengthAnchorArguments;
    'connectionPerpendicular': linkAnchors.ConnectionPerpendicularAnchorArguments;
    'connectionClosest': linkAnchors.ConnectionClosestAnchorArguments;
    [key: string]: { [key: string]: any };
}

export type AnchorType = keyof AnchorArgumentsMap;

export type GenericAnchorArguments<K extends AnchorType> = AnchorArgumentsMap[K];

export interface GenericAnchor<K extends AnchorType> {
    (
        endView: dia.CellView,
        endMagnet: SVGElement,
        anchorReference: g.Point | SVGElement,
        opt: AnchorArgumentsMap[K],
        endType: dia.LinkEnd,
        linkView: dia.LinkView
    ): g.Point;
}

export interface GenericAnchorJSON<K extends AnchorType> {
    name: K;
    args?: AnchorArgumentsMap[K];
}

export type AnchorArguments = GenericAnchorArguments<AnchorType>;

export type Anchor = GenericAnchor<AnchorType>;

export type AnchorJSON = GenericAnchorJSON<AnchorType>;

export var center: GenericAnchor<'center'>;
export var top: GenericAnchor<'top'>;
export var bottom: GenericAnchor<'bottom'>;
export var left: GenericAnchor<'left'>;
export var right: GenericAnchor<'right'>;
export var topLeft: GenericAnchor<'topLeft'>;
export var topRight: GenericAnchor<'topRight'>;
export var bottomLeft: GenericAnchor<'bottomLeft'>;
export var bottomRight: GenericAnchor<'bottomRight'>;
export var perpendicular: GenericAnchor<'perpendicular'>;
export var midSide: GenericAnchor<'midSide'>;
