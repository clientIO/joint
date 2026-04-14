import type * as dia from './dia';
import type * as g from './g';
import type * as mvc from './mvc';
import type * as attributes from './attributes';

export namespace Button {

    type ActionCallback = (evt: dia.Event, view: dia.ElementView, tool: Button) => void;

    interface Options extends dia.ToolView.Options<dia.ElementView> {
        x?: number | string;
        y?: number | string;
        offset?: { x?: number, y?: number };
        rotate?: boolean;
        action?: ActionCallback;
        markup?: dia.MarkupJSON;
        useModelGeometry?: boolean;
        scale?: number;
    }
}

export class Button extends dia.ToolView<dia.ElementView> {

    constructor(opt?: Button.Options);

    protected onPointerDown(evt: dia.Event): void;

    protected position(): void;

    protected getCellMatrix(): SVGMatrix;

    protected getElementMatrix(): SVGMatrix;

    protected getLinkMatrix(): SVGMatrix;
}

export class Remove extends Button {

}

export namespace Connect {

    type MagnetCallback = ((this: Connect, view: dia.ElementView, tool: Connect) => SVGElement);

    interface Options extends Button.Options {
        magnet?: string | SVGElement | MagnetCallback;
    }
}

export class Connect extends Button {

    constructor(opt?: Connect.Options);

    protected getMagnetNode(): SVGElement;

    protected dragstart(evt: dia.Event): void;

    protected drag(evt: dia.Event): void;

    protected dragend(evt: dia.Event): void;
}

export namespace Boundary {
    interface Options extends dia.ToolView.Options<dia.ElementView> {
        padding?: dia.Sides;
        useModelGeometry?: boolean;
        rotate?: boolean;
    }
}

export class Boundary extends dia.ToolView<dia.ElementView> {

    constructor(opt?: Boundary.Options);
}

export namespace Control {
    interface Options extends dia.ToolView.Options<dia.ElementView> {
        selector?: string | null;
        padding?: number;
        handleAttributes?: Partial<attributes.NativeSVGAttributes>;
        scale?: number;
    }
}

export abstract class Control<T extends mvc.ViewOptions<undefined, SVGElement> = Control.Options> extends dia.ToolView<dia.ElementView> {
    options: T;
    constructor(opt?: T);

    protected getPosition(view: dia.ElementView): dia.Point;
    protected setPosition(view: dia.ElementView, coordinates: g.Point, evt: dia.Event): void;
    protected resetPosition(view: dia.ElementView, evt: dia.Event): void;

    protected updateHandle(handleNode: SVGElement): void;
    protected updateExtras(extrasNode: SVGElement): void;
    protected toggleExtras(visible: boolean): void;

    protected onPointerDown(evt: dia.Event): void;
    protected onPointerMove(evt: dia.Event): void;
    protected onPointerUp(evt: dia.Event): void;
    protected onPointerDblClick(evt: dia.Event): void;
}

export namespace HoverConnect {

    type TrackPath = string;

    type TrackPathCallback = (this: HoverConnect, view: dia.ElementView) => TrackPath;

    interface Options extends Connect.Options {
        useModelGeometry?: boolean;
        trackWidth?: number;
        trackPath?: TrackPath | TrackPathCallback;
    }
}

export class HoverConnect extends Connect {

    constructor(opt?: HoverConnect.Options);
}
