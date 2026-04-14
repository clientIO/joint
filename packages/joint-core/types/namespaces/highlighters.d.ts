import type * as dia from './dia';
import type * as mvc from './mvc';
import type * as attributes from './attributes';
import type { Vectorizer } from '../vectorizer';

export interface AddClassHighlighterArguments extends dia.HighlighterView.Options {
    className?: string;
}

export interface OpacityHighlighterArguments extends dia.HighlighterView.Options {
    alphaValue?: number;
}

export interface StrokeHighlighterArguments extends dia.HighlighterView.Options {
    padding?: number;
    rx?: number;
    ry?: number;
    useFirstSubpath?: boolean;
    nonScalingStroke?: boolean;
    attrs?: attributes.NativeSVGAttributes;
}

export interface MaskHighlighterArguments extends dia.HighlighterView.Options {
    padding?: number;
    maskClip?: number;
    deep?: boolean;
    attrs?: attributes.NativeSVGAttributes;
}

export interface HighlighterArgumentsMap {
    'addClass': AddClassHighlighterArguments;
    'opacity': OpacityHighlighterArguments;
    'stroke': StrokeHighlighterArguments;
    'mask': MaskHighlighterArguments;
    [key: string]: { [key: string]: any };
}

export type HighlighterType = keyof HighlighterArgumentsMap;

export type GenericHighlighterArguments<K extends HighlighterType> = HighlighterArgumentsMap[K];

export interface GenericHighlighterJSON<K extends HighlighterType> {
    name: K;
    options?: GenericHighlighterArguments<K>;
}

export type HighlighterJSON = GenericHighlighterJSON<HighlighterType>;

export class mask extends dia.HighlighterView<MaskHighlighterArguments> {

    VISIBLE: string;
    INVISIBLE: string;
    MASK_ROOT_ATTRIBUTE_BLACKLIST: string[];
    MASK_CHILD_ATTRIBUTE_BLACKLIST: string[];
    MASK_REPLACE_TAGS: string[];
    MASK_REMOVE_TAGS: string[];

    public getMaskId(): string;

    protected getMask(cellView: dia.CellView, vel: Vectorizer): Vectorizer;

    protected getMaskShape(cellView: dia.CellView, vel: Vectorizer): Vectorizer;

    protected transformMaskRoot(cellView: dia.CellView, root: Vectorizer): void;

    protected transformMaskChild(cellView: dia.CellView, child: Vectorizer): boolean;

    protected addMask(paper: dia.Paper, mask: Vectorizer): void;

    protected removeMask(paper: dia.Paper): void;
}

export class stroke extends dia.HighlighterView<StrokeHighlighterArguments> {

    protected getPathData(cellView: dia.CellView, node: SVGElement): string;

    protected highlightConnection(cellView: dia.CellView): void;

    protected highlightNode(cellView: dia.CellView, node: SVGElement): void;
}

export class addClass extends dia.HighlighterView<AddClassHighlighterArguments> {

}

export class opacity extends dia.HighlighterView<OpacityHighlighterArguments> {

    opacityClassName: string;
}


export namespace list {

    enum Directions {
        ROW = 'row',
        COLUMN = 'column'
    }

    type DirectionsType = 'row' | 'column';

    enum Positions {
        TOP = 'top',
        RIGHT = 'right',
        BOTTOM = 'bottom',
        LEFT = 'left',
        TOP_LEFT = 'top-left',
        TOP_RIGHT = 'top-right',
        BOTTOM_LEFT = 'bottom-left',
        BOTTOM_RIGHT = 'bottom-right',
        CENTER = 'center',
    }

    interface Options extends dia.HighlighterView.Options {
        direction?: Directions | DirectionsType;
        position?: Positions | dia.PositionName;
        size?: number | dia.Size;
        gap?: number;
        margin?: dia.Sides;
    }
}

export class list<Item = any, Options extends mvc.ViewOptions<undefined, SVGElement> = list.Options> extends dia.HighlighterView<Options> {

    options: Options;

    protected createListItem(item: Item, itemSize: dia.Size, itemEl: SVGElement | null): SVGElement;

    protected position(element: dia.Element, listSize: dia.Size): void;
}

/**
 * @deprecated
 */
export interface GenericHighlighter<K extends HighlighterType> {

    highlight(cellView: dia.CellView, magnetEl: SVGElement, opt?: GenericHighlighterArguments<K>): void;

    unhighlight(cellView: dia.CellView, magnetEl: SVGElement, opt?: GenericHighlighterArguments<K>): void;
}

/**
 * @deprecated
 */
export type HighlighterArguments = GenericHighlighterArguments<HighlighterType>;

/**
 * @deprecated
 */
export type Highlighter = GenericHighlighter<HighlighterType>;
