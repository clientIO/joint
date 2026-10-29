import type * as dia from './dia';

export interface ConnectionStrategy {
    (
        endDefinition: dia.Link.EndJSON,
        endView: dia.CellView,
        endMagnet: SVGElement,
        coords: dia.Point,
        link: dia.Link,
        endType: dia.LinkEnd
    ): dia.Link.EndJSON;
}

export interface PinOptions {
    /** Store the anchor offsets in percentages (`true`) or in pixels (`false`). */
    relative?: boolean;
    /** Measure the model bbox of the element (or of its port) instead of the rendered magnet. */
    useModelGeometry?: boolean;
    /** Move a point outside of the measured bbox onto its edge. */
    clamp?: boolean;
}

export function pin(opt?: PinOptions): ConnectionStrategy;

export var useDefaults: ConnectionStrategy;
export var pinAbsolute: ConnectionStrategy;
export var pinRelative: ConnectionStrategy;
