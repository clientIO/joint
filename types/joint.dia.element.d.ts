declare namespace joint {
    namespace dia {

        type ResizeDirection = 'left' | 'right' | 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right';

        class Element extends Cell {
            translate(tx: number, ty?: number, options?: TranslateOptions): this;
            position(options?: { parentRelative: boolean }): Point;
            position(x: number, y: number, options?: { parentRelative?: boolean }): this;
            resize(width: number, height: number, options?: { direction?:  ResizeDirection}): this;
            rotate(deg: number, absolute?: boolean, origin?: Point): this;
            embed(cell: Cell): this;
            unembed(cell: Cell): this;
            getEmbeddedCells(options?: ExploreOptions): Cell[];
            fitEmbeds(options?: { deep?: boolean, padding?: Padding }): this;
            getBBox(options?: any): BBox;
            findView(paper: Paper): ElementView;
            isElement(): boolean;
            scale(scaleX: number, scaleY: number, origin?: Point, options?: any): this;
        }

        interface ElementViewAttributes {
            style?: string;
            text?: string;
            html?: string;
            "ref-x"?: string | number;
            "ref-y"?: string | number;
            "ref-dx"?: number;
            "ref-dy"?: number;
            "ref-width"?: string | number;
            "ref-height"?: string | number;
            ref?: string;
            "x-alignment"?: 'middle' | 'right' | number;
            "y-alignment"?: 'middle' | 'bottom' | number;
            port?: string;
        }

        class ElementView extends CellViewGeneric<Element> {
            scale(sx: number, sy: number): void; // @todo Documented in source but not released
            finalizeEmbedding(options?: any): void;
            getBBox(options?: any): BBox;
            pointerdown(evt: Event, x: number, y: number): void;
            pointermove(evt: Event, x: number, y: number): void;
            pointerup(evt: Event, x: number, y: number): void;
            positionRelative(vel: any, bbox: BBox, attributes: ElementViewAttributes, nodesBySelector?: Object): void; // Vectorizer
            prepareEmbedding(options?: any): void;
            processEmbedding(options?: any): void;
            render(): this;
            renderMarkup(): void;
            resize(): void;
            rotate(): void;
            translate(model: Backbone.Model, changes?: any, options?: any): void;
            update(cell: Cell, renderingOnlyAttrs?: Object): void;
        }
    }
}
