import type * as dia from './dia';
import type * as g from './geometry';
import type * as mvc from './mvc';
import type * as anchors from './anchors';
import type * as attributes from './attributes';

export type AnchorCallback<T> = (
    coords: g.Point,
    view: dia.CellView,
    magnet: SVGElement,
    type: string,
    linkView: dia.LinkView,
    toolView: dia.ToolView
) => T;

export namespace Vertices {

    class VertexHandle extends mvc.View<undefined, SVGElement> {
        position(x: number, y: number): void;
        protected onPointerDown(evt: dia.Event): void;
        protected onPointerMove(evt: dia.Event): void;
        protected onPointerUp(evt: dia.Event): void;
        protected onPointerClick(evt: dia.Event): void;
    }

    interface VertexAddingOptions {
        interactiveLineNode: string;
    }

    interface Options extends dia.ToolView.Options<dia.LinkView> {
        handleClass?: typeof VertexHandle;
        snapRadius?: number;
        redundancyRemoval?: boolean;
        vertexAdding?: boolean | Partial<VertexAddingOptions>;
        vertexRemoving?: boolean;
        vertexMoving?: boolean;
        stopPropagation?: boolean;
        scale?: number;
    }
}

export class Vertices extends dia.ToolView<dia.LinkView> {

    constructor(opt?: Vertices.Options);
}

export namespace Segments {

    class SegmentHandle extends mvc.View<undefined, SVGElement> {
        position(x: number, y: number, angle: number, view: dia.LinkView): void;
        show(): void;
        hide(): void;
        protected onPointerDown(evt: dia.Event): void;
        protected onPointerMove(evt: dia.Event): void;
        protected onPointerUp(evt: dia.Event): void;
    }

    interface Options extends dia.ToolView.Options<dia.LinkView> {
        handleClass?: typeof SegmentHandle;
        snapRadius?: number;
        snapHandle?: boolean;
        redundancyRemoval?: boolean;
        segmentLengthThreshold?: number;
        anchor?: AnchorCallback<anchors.AnchorJSON>;
        stopPropagation?: boolean;
        scale?: number;
    }
}

export class Segments extends dia.ToolView<dia.LinkView> {

    constructor(opt?: Segments.Options);
}

export namespace Arrowhead {

    interface Options extends dia.ToolView.Options<dia.LinkView> {
        scale?: number;
    }
}

export abstract class Arrowhead extends dia.ToolView<dia.LinkView> {

    ratio: number;
    arrowheadType: string;

    constructor(opt?: Arrowhead.Options);

    protected onPointerDown(evt: dia.Event): void;

    protected onPointerMove(evt: dia.Event): void;

    protected onPointerUp(evt: dia.Event): void;
}

export class SourceArrowhead extends Arrowhead {


}

export class TargetArrowhead extends Arrowhead {


}

export namespace Anchor {
    interface Options extends dia.ToolView.Options<dia.LinkView> {
        snap?: AnchorCallback<dia.Point>;
        anchor?: AnchorCallback<anchors.AnchorJSON>;
        resetAnchor?: boolean | anchors.AnchorJSON;
        customAnchorAttributes?: attributes.NativeSVGAttributes;
        defaultAnchorAttributes?: attributes.NativeSVGAttributes;
        areaPadding?: number;
        snapRadius?: number;
        restrictArea?: boolean;
        redundancyRemoval?: boolean;
        scale?: number;
    }
}

export abstract class Anchor extends dia.ToolView<dia.LinkView> {

    type: string;

    constructor(opt?: Anchor.Options);
}

export class SourceAnchor extends Anchor {


}

export class TargetAnchor extends Anchor {


}

export namespace Button {

    type ActionCallback = (evt: dia.Event, view: dia.LinkView, tool: Button) => void;

    type Distance = number | string;

    type DistanceCallback = (this: Button, view: dia.LinkView, tool: Button) => Distance;

    interface Options extends dia.ToolView.Options<dia.LinkView> {
        distance?: Distance | DistanceCallback;
        offset?: number;
        rotate?: boolean;
        action?: ActionCallback;
        markup?: dia.MarkupJSON;
        scale?: number;
    }
}

export class Button extends dia.ToolView<dia.LinkView> {

    constructor(opt?: Button.Options);

    protected onPointerDown(evt: dia.Event): void;
}

export class Remove extends Button {

}

export namespace Connect {

    type MagnetCallback = ((this: Connect, view: dia.LinkView, tool: Connect) => SVGElement);

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
    interface Options extends dia.ToolView.Options<dia.LinkView> {
        padding?: dia.Sides;
        useModelGeometry?: boolean;
    }
}

export class Boundary extends dia.ToolView<dia.LinkView> {

    constructor(opt?: Boundary.Options);
}

export namespace HoverConnect {
    interface Options extends Connect.Options {
    }
}

export class HoverConnect extends Connect {

    constructor(opt?: HoverConnect.Options);

    trackPath: g.Path;

    protected getButtonMatrix(): SVGMatrix;

    protected getTrackPath(): g.Path;

    protected getTrackMatrix(): SVGMatrix;

    protected getTrackRatioFromEvent(evt: dia.Event): number;

    protected canShowButton(): boolean;

    protected showButton(): void;

    protected hideButton(): void;

    protected onMousemove(evt: dia.Event): void;

    protected onMouseenter(evt: dia.Event): void;

    protected onMouseleave(evt: dia.Event): void;
}

export namespace Control {
    interface Options extends dia.ToolView.Options {
        selector?: string | null;
        padding?: number;
        handleAttributes?: Partial<attributes.NativeSVGAttributes>;
        scale?: number;
    }
}

export abstract class Control<T extends mvc.ViewOptions<undefined, SVGElement> = Control.Options> extends dia.ToolView {
    options: T;
    constructor(opt?: T);

    protected getPosition(view: dia.LinkView): dia.Point;
    protected setPosition(view: dia.LinkView, coordinates: g.Point): void;
    protected resetPosition(view: dia.LinkView): void;

    protected updateHandle(handleNode: SVGElement): void;
    protected updateExtras(extrasNode: SVGElement): void;
    protected toggleExtras(visible: boolean): void;

    protected onPointerDown(evt: dia.Event): void;
    protected onPointerMove(evt: dia.Event): void;
    protected onPointerUp(evt: dia.Event): void;
    protected onPointerDblClick(evt: dia.Event): void;
}

export namespace RotateLabel {

    interface Options extends Control.Options {
        offset?: number | dia.Point;
        buttonColor?: string;
        iconColor?: string;
        outlineColor?: string;
    }
}

export class RotateLabel extends Control<RotateLabel.Options> {

    constructor(opt?: RotateLabel.Options);

    protected getLabelPosition(label: dia.Link.Label): dia.Link.LabelPosition;

    protected getLabelIndex(): number;

    protected getLabel(): dia.Link.Label | null;
}
