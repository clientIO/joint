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

export var useDefaults: ConnectionStrategy;
export var pinAbsolute: ConnectionStrategy;
export var pinRelative: ConnectionStrategy;
