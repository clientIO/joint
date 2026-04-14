import type * as anchors from './anchors';

export interface ConnectionLengthAnchorArguments {
    length?: number;
}

export interface ConnectionRatioAnchorArguments {
    ratio?: number;
}

export interface ConnectionPerpendicularAnchorArguments {
    fallbackAt?: number | string;
    fixedAt?: number | string;
}

export interface ConnectionClosestAnchorArguments {
    fixedAt?: number | string;
}

export var connectionRatio: anchors.GenericAnchor<'connectionRatio'>;
export var connectionLength: anchors.GenericAnchor<'connectionLength'>;
export var connectionPerpendicular: anchors.GenericAnchor<'connectionPerpendicular'>;
export var connectionClosest: anchors.GenericAnchor<'connectionClosest'>;
