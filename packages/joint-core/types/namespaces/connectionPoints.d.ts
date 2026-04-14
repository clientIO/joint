import type * as dia from './dia';
import type * as g from './g';

export type ConnectionPointAlignment = 'top' | 'bottom' | 'left' | 'right';

export interface DefaultConnectionPointArguments {
    offset?: number | dia.Point;
}

export interface AlignConnectionPointArguments extends DefaultConnectionPointArguments {
    align?: ConnectionPointAlignment | null;
    alignOffset?: number;
}

export interface StrokeConnectionPointArguments extends DefaultConnectionPointArguments {
    stroke?: boolean;
}

export interface BoundaryConnectionPointArguments extends StrokeConnectionPointArguments {
    selector?: Array<string | number> | string | false;
    precision?: number;
    extrapolate?: boolean;
    sticky?: boolean;
    insideout?: boolean;
}

export interface ConnectionPointArgumentsMap {
    'anchor': DefaultConnectionPointArguments;
    'bbox': StrokeConnectionPointArguments;
    'rectangle': StrokeConnectionPointArguments;
    'boundary': BoundaryConnectionPointArguments;
    [key: string]: { [key: string]: any };
}

export type ConnectionPointType = keyof ConnectionPointArgumentsMap;

export type GenericConnectionPointArguments<K extends ConnectionPointType> = ConnectionPointArgumentsMap[K];

export interface GenericConnectionPoint<K extends ConnectionPointType> {
    (
        endPathSegmentLine: g.Line,
        endView: dia.CellView,
        endMagnet: SVGElement,
        opt: ConnectionPointArgumentsMap[K],
        endType: dia.LinkEnd,
        linkView: dia.LinkView
    ): g.Point;
}

export interface GenericConnectionPointJSON<K extends ConnectionPointType> {
    name: K;
    args?: ConnectionPointArgumentsMap[K];
}

export type ConnectionPointArguments = GenericConnectionPointArguments<ConnectionPointType>;

export type ConnectionPoint = GenericConnectionPoint<ConnectionPointType>;

export type ConnectionPointJSON = GenericConnectionPointJSON<ConnectionPointType>;

export var anchor: GenericConnectionPoint<'anchor'>;
export var bbox: GenericConnectionPoint<'bbox'>;
export var rectangle: GenericConnectionPoint<'rectangle'>;
export var boundary: GenericConnectionPoint<'boundary'>;
