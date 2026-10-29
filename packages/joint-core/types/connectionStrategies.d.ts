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
    /**
     * Store the anchor offsets in percentages (`true`) or in pixels (`false`).
     * On a link end, it chooses the `connectionRatio` (`true`) or `connectionLength` (`false`) anchor.
     * @default false
     */
    relative?: boolean;
    /**
     * Measure the model bbox instead of the rendered magnet. The created anchor gets `useModelGeometry: true` too.
     * When the end is connected to a port, the bbox of the port is measured.
     * It has no effect on a link end.
     * @default false
     */
    useModelGeometry?: boolean;
    /**
     * Move a point outside of the measured bbox onto its edge.
     * It has no effect on a link end.
     * @default false
     */
    clamp?: boolean;
}

/**
 * Creates a connection strategy that pins the link end where it was dropped.
 * The options are read once, when the strategy is created.
 */
export function pin(opt?: PinOptions): ConnectionStrategy;

export var useDefaults: ConnectionStrategy;
export var pinAbsolute: ConnectionStrategy;
export var pinRelative: ConnectionStrategy;
