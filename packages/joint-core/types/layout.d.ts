import type * as dia from './dia';
import type * as g from './geometry';

export namespace Port {

    type Position = {
        x: number | string;
        y: number | string;
    };

    type Transformation = {
        x: number;
        y: number;
        angle: number;
    };

    interface LayoutOptions {
        [key: string]: any;
    }

    type LayoutFunction<T = LayoutOptions> = (
        portsArgs: Array<T>,
        elBBox: g.Rect,
        portGroupArgs: LayoutOptions
    ) => Array<Partial<Transformation>>;

    interface Options extends LayoutOptions {
        x?: number | string;
        y?: number | string;
        dx?: number;
        dy?: number;
        angle?: number;
        start?: Position;
        end?: Position;
        startAngle?: number;
        step?: number;
        compensateRotation?: boolean;
    }

    /** @todo define Options types per-layout */
    export var absolute: LayoutFunction<Options>;
    export var line: LayoutFunction<Options>;
    export var left: LayoutFunction<Options>;
    export var right: LayoutFunction<Options>;
    export var top: LayoutFunction<Options>;
    export var bottom: LayoutFunction<Options>;
    export var ellipseSpread: LayoutFunction<Options>;
    export var ellipse: LayoutFunction<Options>;

    /** @deprecated */
    export var fn: LayoutFunction<Options>;
}

export namespace PortLabel {

    interface Options {
        x?: number;
        y?: number;
        angle?: number;
        offset?: number;
        attrs?: dia.Cell.Selectors;
        [key: string]: any;
    }

    interface LabelAttributes {
        x: number;
        y: number;
        angle: number;
        attrs: dia.Cell.Selectors;
    }

    type LayoutFunction = (portPosition: g.Point, elBBox: g.Rect, opt: Options) => LabelAttributes;

    export var manual: LayoutFunction;
    export var left: LayoutFunction;
    export var right: LayoutFunction;
    export var top: LayoutFunction;
    export var bottom: LayoutFunction;
    export var outsideOriented: LayoutFunction;
    export var outside: LayoutFunction;
    export var insideOriented: LayoutFunction;
    export var inside: LayoutFunction;
    export var radial: LayoutFunction;
    export var radialOriented: LayoutFunction;
}
