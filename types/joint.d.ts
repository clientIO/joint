export namespace dia {
    interface Size {
        width: number;
        height: number;
    }

    interface Point {
        x: number;
        y: number;
    }

    interface BBox extends Point, Size {
    }

    interface TranslateOptions {
        restrictedArea?: BBox;
        transition?: TransitionOptions;
    }

    interface TransitionOptions {
        delay?: number;
        duration?: number;
        timingFunction?: (t: number) => number;
        valueFunction?: (a: any, b: any) => (t: number) => any;
    }

    interface DfsBfsOptions {
        inbound?: boolean;
        outbound?: boolean;
        deep?: boolean;
    }

    interface ExploreOptions {
        breadthFirst?: boolean;
        deep?: boolean;
    }

    interface EdgeMap {
        [key: string]: boolean;
    }

    class Graph extends Backbone.Model {
        constructor(attributes?: any, options?: { cellNamespace: any, cellModel: typeof Cell });

        addCell(cell: Cell | Cell[], opt?: object): this;

        addCells(cells: Cell[], opt: object): this;

        resetCells(cells: Cell[], options?: object): this;

        getCell(id: string): Cell;

        getElements(): Element[];

        getLinks(): Link[];

        getCells(): Cell[];

        getFirstCell(): Cell;

        getLastCell(): Cell;

        getConnectedLinks(element: Cell, options?: { inbound?: boolean, outbound?: boolean, deep?: boolean }): Link[];

        disconnectLinks(cell: Cell, options?: object): void;

        removeLinks(cell: Cell, options?: object): void;

        translate(tx: number, ty?: number, options?: TranslateOptions): void;

        cloneCells(cells: Cell[]): { [id: string]: Cell };

        getSubgraph(cells: Cell[], options?: { deep?: boolean }): Cell[];

        cloneSubgraph(cells: Cell[], options?: { deep?: boolean }): { [id: string]: Cell };

        dfs(element: Element, iteratee: (element: Element, distance: number) => boolean, options?: DfsBfsOptions, visited?: any, distance?: number): void;

        bfs(element: Element, iteratee: (element: Element, distance: number) => boolean, options?: DfsBfsOptions): void;

        search(element: Element, iteratee: (element: Element, distance: number) => boolean, options?: { breadthFirst?: boolean }): void;

        getSuccessors(element: Element, options?: ExploreOptions): Element[];

        getPredecessors(element: Element, options?: ExploreOptions): Element[];

        isSuccessor(elementA: Element, elementB: Element): boolean;

        isPredecessor(elementA: Element, elementB: Element): boolean;

        isSource(element: Element): boolean;

        isSink(element: Element): boolean;

        getSources(): Element[];

        getSinks(): Element[];

        getNeighbors(element: Element, options?: DfsBfsOptions): Element[];

        isNeighbor(elementA: Element, elementB: Element, options?: { inbound?: boolean, outbound?: boolean; }): boolean;

        getCommonAncestor(...cells: Cell[]): Element;

        toJSON(): object;

        fromJSON(json: {cells: Cell[]}, options?: object): this;

        clear(options?: object): this;

        findModelsFromPoint(p: Point): Element[];

        findModelsUnderElement(element: Element, options?: {
                                   searchBy?: 'bottomLeft' | 'bottomMiddle' | 'center' |
                                              'corner' | 'leftMiddle' | 'origin' | 'rightMiddle' |
                                              'topMiddle' | 'topRight'
                               }): Element[];

        getBBox(elements: Element[], options?: {deep?: boolean}): g.Rect;

        toGraphLib(): object; // graphlib graph object
        findModelsInArea(rect: g.Rect | BBox, options?: {strict?: boolean}): BBox | boolean;

        getCellsBBox(cells: Cell[], options?: {deep?: boolean}): g.Rect;

        getInboundEdges(node: string): EdgeMap;

        getOutboundEdges(node: string): EdgeMap;

        hasActiveBatch(name?: string): number | boolean;

        maxZIndex(): number;

        removeCells(cells: Cell[], options?: object): this;

        resize(width: number, height: number, options?: object): this;

        resizeCells(width: number, height: number, cells: Cell[], options?: object): this;

        set(key: object | string, value: any, options?: object): this;

        startBatch(name: string, data?: {[key: string]: any}): any;

        stopBatch(name: string, data?: {[key: string]: any}): any;
    }

    class Cell extends Backbone.Model {
        constructor(attributes?: object, options?: object);

        id: string;

        toJSON(): object;

        remove(options?: { disconnectLinks?: boolean }): this;

        toFront(options?: { deep?: boolean }): this;

        toBack(options?: { deep?: boolean }): this;

        getAncestors(): Cell[];

        isEmbeddedIn(element: Element, options?: { deep: boolean }): boolean;

        prop(key: string | string[]): any;
        prop(object: object): this;
        prop(key: string | string[], value: any, options?: object): this;

        removeProp(path: string | string[], options?: object): this;

        attr(key: string): any;
        attr(object: SVGAttributes): this;
        attr(key: string, value: any): this;

        clone(): Cell;
        clone(opt: { deep?: boolean }): Cell | Cell[];

        removeAttr(path: string | string[], options?: object): this;

        transition(path: string, value?: any, options?: TransitionOptions, delim?: string): number;

        getTransitions(): string[];

        stopTransitions(path?: string, delim?: string): this;

        addTo(graph: Graph, options?: object): this;

        isLink(): boolean;

        embed(cell: Cell, options?: object): this;

        findView(paper: Paper): CellView;

        getEmbeddedCells(options?: {deep?: boolean, breadthFirst?: boolean}): Cell[];

        isElement(): boolean;

        isEmbedded(): boolean;

        startBatch(name: string, options?: object): this;

        stopBatch(name: string, options?: object): this;

        unembed(cell: Cell, options?: object): this;

        define(type: string, defaults?: any, protoProps?: any, staticProps?: any): any;

        /**
         * @deprecated
         */
        protected processPorts(): void;

        protected initialize(options?: {id?: string}): void;

    }

    type Padding = number | {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number
    };

    type Direction = 'left'
                    | 'right'
                    | 'top'
                    | 'bottom'
                    | 'top-right'
                    | 'top-left'
                    | 'bottom-left'
                    | 'bottom-right';

    interface Port {
        id?: string;
        markup?: string;
        group?: string;
        attrs?: object;
        args?: object;
        size?: Size;
        label: {
            size?: Size;
            markup?: string;
            position?: any;
            args?: any;
        }
        z?: number | 'auto';
    }

    interface PortPosition extends Point {
        angle: number;
    }

    class Element extends Cell {
        constructor(attributes?: object, options?: object);

        translate(tx: number, ty?: number, options?: TranslateOptions): this;

        position(options?: { parentRelative: boolean }): g.Point;
        position(x: number, y: number, options?: { parentRelative?: boolean }): this;

        size(): Size;
        size(width: number, height?: number, options?: { direction?: Direction}): this;

        resize(width: number, height: number, options?: { direction?: Direction }): this;

        rotate(deg: number, absolute?: boolean, origin?: Point, opt?: { parentRelative?: boolean }): this;

        embed(cell: Cell): this;

        unembed(cell: Cell): this;

        getEmbeddedCells(options?: ExploreOptions): Cell[];

        fitEmbeds(options?: { deep?: boolean, padding?: Padding }): this;

        getBBox(options?: { deep?: boolean }): g.Rect;

        isElement(): boolean;

        scale(scaleX: number, scaleY: number, origin?: Point, options?: { direction?: Direction, parentRelative?: boolean}): this;

        addPort(port: Port, opt?: object): this;

        addPorts(ports: Port[], opt?: object): this;

        removePort(port: string | Port, opt?: object): this;

        hasPorts(): boolean;

        hasPort(id: string): boolean;

        getPorts(): Port[];

        getPort(id: string): Port;

        getPortsPositions(groupName: string): {[id: string]: PortPosition};

        getPortIndex(port: string | Port): number;

        portProp(portId: string, path: any, value?: any, opt?: any): dia.Element;
    }

    interface CSSSelector {
        [key: string]: string | number | Object; // Object added to support special attributes like filter http://jointjs.com/api#SpecialAttributes:filter
    }

    interface SVGAttributes {
        [selector: string]: CSSSelector;
    }

    interface CellAttributes {
        [key: string]: any;
    }

    interface TextAttrs extends SVGAttributes {
        text?: {
            [key: string]: string | number;
            text?: string;
        };
    }

    interface LabelPosition {
      distance: number;
      offset: number | { x: number; y: number; }
    }

    interface Label {
        position: LabelPosition | number;
        attrs?: TextAttrs;
    }

    interface LinkAttributes extends CellAttributes {
        source?: Point | { id: string, selector?: string, port?: string };
        target?: Point | { id: string, selector?: string, port?: string };
        labels?: Label[];
        vertices?: Point[];
        smooth?: boolean;
        attrs?: TextAttrs;
        z?: number;
    }

    class Link extends Cell {
        markup: string;
        labelMarkup: string;
        toolMarkup: string;
        vertexMarkup: string;
        arrowHeadMarkup: string;

        constructor(attributes?: LinkAttributes, options?: {[key: string]: any});

        applyToPoints(fn: (p: Point) => Point, opt?: object): this;

        disconnect(): this;

        label(index?: number): any;
        label(index: number, value: Label, opt?: object): this;

        reparent(options?: object): Element;

        getSourceElement(): undefined | Element | Graph;

        getTargetElement(): undefined | Element | Graph;

        hasLoop(options?: { deep?: boolean }): boolean;

        applyToPoints(fn: Function, options?: any): this;

        getRelationshipAncestor(): undefined | Element;

        isLink(): boolean;

        isRelationshipEmbeddedIn(element: Element): boolean;

        scale(sx: number, sy: number, origin: Point | g.Point | string, opt?: object): this;

        translate(tx: number, ty: number, options?: object): this;
    }

    interface ManhattanRouterArgs {
        excludeTypes?: string[];
        excludeEnds?: 'source' | 'target';
        startDirections?: ['left' | 'right' | 'top' | 'bottom'];
        endDirections?: ['left' | 'right' | 'top' | 'bottom'];
    }

    interface GridOptions {
        color?: string;
        thickness?: number;
        name?: 'dot' | 'fixedDot' | 'mesh' | 'doubleMesh';
        args?: object[] | object;
    }

    interface PaperOptions extends Backbone.ViewOptions<Graph> {
        el?: string | JQuery | HTMLElement;
        width?: number | string;
        height?: number | string;
        origin?: Point;
        gridSize?: number;
        drawGrid?: boolean | GridOptions;
        perpendicularLinks?: boolean;
        elementView?: (element: Element) => typeof ElementView | typeof ElementView;
        linkView?: (link: Link) => typeof LinkView | typeof LinkView;
        defaultLink?: ((cellView: CellView, magnet: SVGElement) => Link) | Link;
        defaultRouter?: ((vertices: Point[], args: {[key: string]: any}, linkView: LinkView) => Point[])
            | { name: string, args?: ManhattanRouterArgs };
        defaultConnector?:
            ((sourcePoint: Point, targetPoint: Point, vertices: Point[], args: {[key: string]: any}, linkView: LinkView) => string)
            | { name: string, args?: { radius?: number } };
        interactive?: ((cellView: CellView, event: string) => boolean)
            | boolean
            | { vertexAdd?: boolean, vertexMove?: boolean, vertexRemove?: boolean, arrowheadMove?: boolean };
        validateMagnet?: (cellView: CellView, magnet: SVGElement) => boolean;
        validateConnection?: (cellViewS: CellView, magnetS: SVGElement, cellViewT: CellView, magnetT: SVGElement, end:
                                  'source'
                                  | 'target', linkView: LinkView) => boolean;
        linkConnectionPoint?: (linkView: LinkView, view: ElementView, magnet: SVGElement, reference: Point) => Point;
        snapLinks?: boolean | { radius: number };
        linkPinning?: boolean;
        markAvailable?: boolean;
        async?: boolean | { batchZise: number };
        embeddingMode?: boolean;
        findParentBy?: 'bbox' | 'center' | 'origin' | 'corner' | 'topRight' | 'bottomLeft';
        validateEmbedding?: (childView: ElementView, parentView: ElementView) => boolean;
        restrictTranslate?: ((elementView: ElementView) => BBox) | boolean;
        guard?: (evt: Event, view: CellView) => boolean;
        multiLinks?: boolean;
        cellViewNamespace?: object;
        highlighterNamespace?: object;
        /** useful undocumented option */
        clickThreshold?: number;
        highlighting?: any;
        preventContextMenu?: boolean;
    }

    interface ScaleContentOptions {
        padding?: number;
        preserveAspectRatio?: boolean;
        minScale?: number;
        minScaleX?: number;
        minScaleY?: number;
        maxScale?: number;
        maxScaleX?: number;
        maxScaleY?: number;
        scaleGrid?: number;
        fittingBBox?: BBox;
    }

    interface FitToContentOptions {
        gridWidth?: number;
        gridHeight?: number;
        padding?: Padding;
        allowNewOrigin?: 'negative' | 'positive' | 'any';
        minWidth?: number;
        minHeight?: number;
        maxWidth?: number;
        maxHeight?: number;
    }

    interface Highlighter {
        name: string;
        options?: object;
    }

    class Paper extends Backbone.View<Graph> {
        constructor(options?: PaperOptions);

        options: PaperOptions;
        svg: SVGElement;
        viewport: SVGGElement;
        defs: SVGDefsElement;

        clientMatrix(): SVGMatrix;

        clientToLocalPoint(x: number | g.Point, y?: number): g.Point;

        clientToLocalRect(x: number | g.Rect, y?: number, width?: number, height?: number): g.Rect;

        clientOffset(): g.Point;

        cloneOptions(): PaperOptions;

        cancelRenderViews(): void;

        createViewForModel(cell: Cell): CellView;

        defineFilter(filter: object): string;

        defineGradient(gradient: object): string;

        defineMarker(marker: object): string;

        drawBackground(opt?: {color?: string, img?: string}): this;

        drawBackgroundImage(img: HTMLImageElement, opt: object): void;

        drawGrid(options?: {width?: number, height?: number, scaleFactor?: number,
                            update: any, ox?: number, oy?: number}): this;

        findView<T extends ElementView | LinkView>(element: string | JQuery | SVGElement): T;

        findViewByModel<T extends ElementView | LinkView>(model: Element | string | Link) : T;

        findViewsFromPoint(point: string | Point | g.Point): ElementView[];

        findViewsInArea(rect: g.Rect | BBox, options?: { strict?: boolean }): CellView[];

        fitToContent(gridWidth?: number, gridHeight?: number, padding?: number, options?: any): void;

        fitToContent(options?: FitToContentOptions): void;

        getArea(): g.Rect;

        getContentBBox(): g.Rect;

        getDefaultLink(cellView: CellView, magnet: HTMLElement): Link;

        getModelById(id: string): Cell;

        getRestrictedArea(): g.Rect | undefined;

        guard(evt: Event, view: CellView): boolean;

        isDefined(defId: string): boolean;

        localToClientPoint(x: number | g.Point, y?: number): g.Point;

        localToClientRect(x: number | g.Rect, y?: number, width?: number, height?: number): g.Rect;

        localToPagePoint(x: number | g.Point, y?: number): g.Point;

        localToPageRect(x: number | g.Rect, y?: number, width?: number, height?: number): g.Rect;

        localToPaperPoint(x: number | g.Point, y?: number): g.Point;

        localToPaperRect(x: number | g.Rect, y?: number, width?: number, height?: number): g.Rect;

        matrix(): SVGMatrix;

        matrix(ctm: SVGMatrix | Vectorizer.Matrix): this;

        pageOffset(): g.Point;

        pageToLocalPoint(x: number | g.Point, y?: number): g.Point;

        pageToLocalRect(x: number | g.Rect, y?: number, width?: number, height?: number): g.Rect;

        paperToLocalPoint(x: number | g.Point, y?: number): g.Point;

        paperToLocalRect(x: number | g.Rect, y?: number, width?: number, height?: number): g.Rect;

        remove(): this;

        render(): this;

        scale(): Vectorizer.Scale;
        scale(sx: number, sy?: number, ox?: number, oy?: number): this;

        scaleContentToFit(options?: ScaleContentOptions): void;

        setDimensions(width: number, height: number): void;

        setGridSize(gridSize: number): this;

        setInteractivity(value: any): void;

        setOrigin(x: number, y: number): this;

        snapToGrid(x: g.Point | number, y?: number): g.Point;

        sortViews(): void;

        translate(): Vectorizer.Translation;
        translate(tx: number, ty?: number): this;

        update(): void;

        protected afterRenderViews(): void;

        protected asyncRenderViews(cells: Cell[], options?: object): void;

        protected beforeRenderViews(cells: Cell[]): Cell[];

        protected cellMouseEnter(evt: Event): void;

        protected cellMouseleave(evt: Event): void;

        protected cellMouseout(evt: Event): void;

        protected cellMouseover(evt: Event): void;

        protected contextmenu(evt: Event): void;

        protected init(): void;

        protected mouseclick(evt: Event): void;

        protected mousedblclick(evt: Event): void;

        protected mousewheel(evt: Event): void;

        protected onCellAdded(cell: Cell, graph: Graph, options: {async?: boolean, position?: number}): void;

        protected onCellHighlight(cellView: CellView, magnetEl: HTMLElement, options?: {highlighter?: Highlighter}): void;

        protected onCellUnhighlight(cellView: CellView, magnetEl: HTMLElement, options?: {highlighter?: Highlighter}): void;

        protected onRemove(): void;

        protected pointerdown(evt: Event): void;

        protected pointermove(evt: Event): void;

        protected pointerup(evt: Event): void;

        protected removeView(cell: Cell): CellView;

        protected removeViews(): void;

        protected renderView(cell: Cell): CellView;

        protected resetViews(cellsCollection: Cell[], options: object): void;

         protected updateBackgroundColor(color: string): void;

        protected updateBackgroundImage(opt: {position?: any, size?: any}): void;
    }

    //TODO v.talas used in attributes
    interface GradientOptions {
        type: 'linearGradient' | 'radialGradient';
        stops: Array<{
            offset: string;
            color: string;
            opacity?: number;
        }>;
    }

    abstract class CellViewGeneric<T extends Backbone.Model> extends Backbone.View<T> {
        constructor(options?: { id: string });

        protected mouseover(evt: Event): void;

        protected mousewheel(evt: Event, x: number, y: number, delta: number): void

        protected notify(eventName: string): void;

        protected onSetTheme(oldTheme: string, newTheme: string): void;

        protected pointerclick(evt: Event, x: number, y: number): void;

        protected pointerdblclick(evt: Event, x: number, y: number): void;

        protected pointerdown(evt: Event, x: number, y: number): void;

        protected pointermove(evt: Event, x: number, y: number): void;

        protected pointerup(evt: Event, x: number, y: number): void;

        unhighlight(el?: any, options?: any): this;

        can(feature: string): boolean;

        findMagnet(el: any): HTMLElement;

        getSelector(el: HTMLElement, prevSelector: string): string;

        getStrokeBBox(el: any): BBox; // string|HTMLElement|Vectorizer

        remove(): this;

        setInteractivity(value: any): void;

        setTheme(theme: string, options?: any): this;
    }

    class CellView extends CellViewGeneric<Cell> {
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

        getBBox(options?: {useModelGeometry?: boolean}): g.Rect;

        update(cell: Cell, renderingOnlyAttrs?: object): void;

        protected mouseenter(evt: Event): void;

        protected mouseleave(evt: Event): void;

        protected pointerdown(evt: Event, x: number, y: number): void;

        protected pointermove(evt: Event, x: number, y: number): void;

        protected pointerup(evt: Event, x: number, y: number): void;

        protected renderMarkup(): void;
    }

    class LinkView extends CellViewGeneric<Link> {
        options: {
            shortLinkLength?: number,
            doubleLinkTools?: boolean,
            longLinkLength?: number,
            linkToolsOffset?: number,
            doubleLinkToolsOffset?: number,
            sampleInterval: number
        };

        getConnectionLength(): number;

        sendToken(token: SVGElement, duration?: number, callback?: () => void): void;

        addVertex(vertex: Point): number;

        getPointAtLength(length: number): g.Point; // Marked as public api in source but not in the documents

        update(model: Cell, attributes: object, options?: object): this;

        protected mouseenter(evt: Event): void;

        protected mouseleave(evt: Event): void;

        protected onEndModelChange(endType: 'source' | 'target', endModel?: Element,
                         opt?: {cacheOnly?: boolean, handleBy?: string, translateBy?: boolean, tx?: number, ty?: number}): void;

        protected onLabelsChange(): void;

        protected onSourceChange(cell: Cell, sourceEnd: { id: string }, options: object): void;

        protected onTargetChange(cell: Cell, targetEnd: { id: string }, options: object): void;

        protected onToolsChange(): void;

        // changed is not used in function body.
        protected onVerticesChange(cell: Cell, changed: any, options: object): void;

        protected pointerdown(evt: Event, x: number, y: number): void;

        protected pointermove(evt: Event, x: number, y: number): void;

        protected pointerup(evt: Event, x: number, y: number): void;
    }
}

export namespace ui {
}

export namespace shapes {
    interface GenericAttributes<T> extends dia.CellAttributes {
        position?: dia.Point;
        size?: dia.Size;
        angle?: number;
        attrs?: T;
    }
    interface ShapeAttrs extends dia.CSSSelector {
        fill?: string;
        stroke?: string;
        r?: string | number;
        rx?: string | number;
        ry?: string | number;
        cx?: string | number;
        cy?: string | number;
        height?: string | number;
        width?: string | number;
        transform?: string;
        points?: string;
        'stroke-width'?: string | number;
        'ref-x'?: string | number;
        'ref-y'?: string | number;
        ref?: string
    }

    namespace basic {
        class Generic extends dia.Element {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        interface RectAttrs extends dia.TextAttrs {
            rect?: ShapeAttrs;
        }
        class Rect extends Generic {
            constructor(attributes?: GenericAttributes<RectAttrs>, options?: {[key: string]: any});
        }
        class Text extends Generic {
            constructor(attributes?: GenericAttributes<dia.TextAttrs>, options?: {[key: string]: any});
        }
        interface CircleAttrs extends dia.TextAttrs {
            circle?: ShapeAttrs;
        }
        class Circle extends Generic {
            constructor(attributes?: GenericAttributes<CircleAttrs>, options?: {[key: string]: any});
        }
        interface EllipseAttrs extends dia.TextAttrs {
            ellipse?: ShapeAttrs;
        }
        class Ellipse extends Generic {
            constructor(attributes?: GenericAttributes<EllipseAttrs>, options?: {[key: string]: any});
        }
        interface PolygonAttrs extends dia.TextAttrs {
            polygon?: ShapeAttrs;
        }
        class Polygon extends Generic {
            constructor(attributes?: GenericAttributes<PolygonAttrs>, options?: {[key: string]: any});
        }
        interface PolylineAttrs extends dia.TextAttrs {
            polyline?: ShapeAttrs;
        }
        class Polyline extends Generic {
            constructor(attributes?: GenericAttributes<PolylineAttrs>, options?: {[key: string]: any});
        }
        class Image extends Generic {
            constructor(attributes?: GenericAttributes<dia.TextAttrs>, options?: {[key: string]: any});
        }
        interface PathAttrs extends dia.TextAttrs {
            path?: ShapeAttrs;
        }
        class Path extends Generic {
            constructor(attributes?: GenericAttributes<PathAttrs>, options?: {[key: string]: any});
        }
        interface RhombusAttrs extends dia.TextAttrs {
            path?: ShapeAttrs;
        }
        class Rhombus extends Generic {
            constructor(attributes?: GenericAttributes<RhombusAttrs>, options?: {[key: string]: any});
        }
        interface TextBlockAttrs extends dia.TextAttrs {
            rect?: ShapeAttrs;
        }
        class TextBlock extends Generic {
            constructor(attributes?: GenericAttributes<TextBlockAttrs>, options?: {[key: string]: any});

            updateSize(cell: dia.Cell, size: dia.Size): void;

            updateContent(cell: dia.Cell, content: string): void;
        }
    }

    namespace chess {
        class KingWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class KingBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class QueenWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class QueenBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class RookWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class RookBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class BishopWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class BishopBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class KnightWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class KnightBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class PawnWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class PawnBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
    }

    namespace devs {
        /**
         * @deprecated
         */
        interface ModelAttributes extends GenericAttributes<dia.SVGAttributes> {
            inPorts?: string[];
            outPorts?: string[];
            ports?: {[key: string]: any};
        }

        /**
         * @deprecated
         */
        class Model extends basic.Generic {
            constructor(attributes?: ModelAttributes, options?: {[key: string]: any});

            changeInGroup(properties: any, opt?: any): boolean;

            changeOutGroup(properties: any, opt?: any): boolean;

            createPortItem(group: string, port: string): any;

            createPortItems(group: string, ports: string[]): any[];

            addOutPort(port: string, opt?: any): this;

            addInPort(port: string, opt?: any): this;

            removeOutPort(port: string, opt?: any): this;

            removeInPort(port: string, opt?: any): this;
        }
        /**
         * @deprecated
         */
        class Coupled extends Model {
            constructor(attributes?: ModelAttributes, options?: {[key: string]: any});
        }
        /**
         * @deprecated
         */
        class Atomic extends Model {
            constructor(attributes?: ModelAttributes, options?: {[key: string]: any});
        }
        class Link extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});
        }
    }

    namespace erd {
        class Entity extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.TextAttrs>, options?: {[key: string]: any});
        }
        class WeakEntity extends Entity {
            constructor(attributes?: GenericAttributes<dia.TextAttrs>, options?: {[key: string]: any});
        }
        class Relationship extends dia.Element {
            constructor(attributes?: GenericAttributes<dia.TextAttrs>, options?: {[key: string]: any});
        }
        class IdentifyingRelationship extends Relationship {
            constructor(attributes?: GenericAttributes<dia.TextAttrs>, options?: {[key: string]: any});
        }
        interface AttributeAttrs extends dia.TextAttrs {
            ellipse?: ShapeAttrs;
        }
        class Attribute extends dia.Element {
            constructor(attributes?: GenericAttributes<AttributeAttrs>, options?: {[key: string]: any});
        }
        class Multivalued extends Attribute {
            constructor(attributes?: GenericAttributes<AttributeAttrs>, options?: {[key: string]: any});
        }
        class Derived extends Attribute {
            constructor(attributes?: GenericAttributes<AttributeAttrs>, options?: {[key: string]: any});
        }
        class Key extends Attribute {
            constructor(attributes?: GenericAttributes<AttributeAttrs>, options?: {[key: string]: any});
        }
        class Normal extends Attribute {
            constructor(attributes?: GenericAttributes<AttributeAttrs>, options?: {[key: string]: any});
        }
        interface ISAAttrs extends dia.Element {
            polygon?: ShapeAttrs;
        }
        class ISA extends dia.Element {
            constructor(attributes?: GenericAttributes<ISAAttrs>, options?: {[key: string]: any});
        }
        class Line extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});

            cardinality(value: string | number): void;
        }
    }

    namespace fsa {
        class State extends basic.Circle {
            constructor(attributes?: GenericAttributes<basic.CircleAttrs>, options?: {[key: string]: any});
        }
        class StartState extends dia.Element {
            constructor(attributes?: GenericAttributes<basic.CircleAttrs>, options?: {[key: string]: any});
        }
        class EndState extends dia.Element {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class Arrow extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});
        }
    }

    namespace logic {
        interface LogicAttrs extends ShapeAttrs {
            ref?: string;
            'ref-x'?: number | string;
            'ref-dx'?: number | string;
            'ref-y'?: number | string;
            'ref-dy'?: number | string;
            magnet?: boolean;
            'class'?: string;
            port?: string;
        }
        interface IOAttrs extends dia.TextAttrs {
            circle?: LogicAttrs;
        }
        class Gate extends basic.Generic {
            constructor(attributes?: GenericAttributes<IOAttrs>, options?: {[key: string]: any});
        }
        class IO extends Gate {
            constructor(attributes?: GenericAttributes<IOAttrs>, options?: {[key: string]: any});
        }
        class Input extends IO {
            constructor(attributes?: GenericAttributes<IOAttrs>, options?: {[key: string]: any});
        }
        class Output extends IO {
            constructor(attributes?: GenericAttributes<IOAttrs>, options?: {[key: string]: any});
        }
        class Gate11 extends Gate {
            constructor(attributes?: GenericAttributes<IOAttrs>, options?: {[key: string]: any});
        }
        class Gate21 extends Gate {
            constructor(attributes?: GenericAttributes<IOAttrs>, options?: {[key: string]: any});
        }
        interface Image {
            'xlink:href'?: string;
        }
        interface ImageAttrs extends LogicAttrs {
            image?: Image;
        }
        class Repeater extends Gate11 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, options?: {[key: string]: any});

            operation(input: any): any;
        }
        class Note extends Gate11 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, options?: {[key: string]: any});

            operation(input: any): boolean;
        }
        class Or extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, options?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }
        class And extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, options?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }
        class Nor extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, options?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }
        class Nand extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, options?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }
        class Xor extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, options?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }
        class Xnor extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, options?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }
        interface WireArgs extends dia.LinkAttributes {
            router?: {[key: string]: any};
            connector?: {[key: string]: any};
        }
        class Wire extends dia.Link {
            constructor(attributes?: WireArgs, options?: {[key: string]: any});
        }
    }

    namespace org {
        interface MemberAttrs {
            rect?: ShapeAttrs;
            image?: ShapeAttrs;
        }
        class Member extends dia.Element {
            constructor(attributes?: GenericAttributes<MemberAttrs>, options?: {[key: string]: any});
        }
        class Arrow extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});
        }
    }

    namespace pn {
        class Place extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class PlaceView extends dia.ElementView {
            renderTokens(): void;
        }
        class Transition extends basic.Generic {
            constructor(attributes?: GenericAttributes<basic.RectAttrs>, options?: {[key: string]: any});
        }
        class Link extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});
        }
    }

    namespace uml {
        interface ClassAttributes extends GenericAttributes<basic.RectAttrs> {
            name: string[];
            attributes: string[];
            methods: string[];
        }
        class Class extends basic.Generic {
            constructor(attributes?: ClassAttributes, options?: {[key: string]: any});

            getClassName(): string[];

            updateRectangles(): void;
        }
        class ClassView extends dia.ElementView {
        }
        class Abstract extends Class {
            constructor(attributes?: ClassAttributes, options?: {[key: string]: any});
        }
        class AbstractView extends ClassView {
            constructor(attributes?: ClassAttributes, options?: {[key: string]: any});
        }
        class Interface extends Class {
            constructor(attributes?: ClassAttributes, options?: {[key: string]: any});
        }
        class InterfaceView extends ClassView {
            constructor(attributes?: ClassAttributes, options?: {[key: string]: any});
        }
        class Generalization extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});
        }
        class Implementation extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});
        }
        class Aggregation extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});
        }
        class Composition extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});
        }
        class Association extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});
        }
        interface StateAttributes extends GenericAttributes<ShapeAttrs> {
            events?: string[];
        }
        class State extends basic.Generic {
            constructor(attributes?: GenericAttributes<basic.CircleAttrs>, options?: {[key: string]: any});

            updateName(): void;

            updateEvents(): void;

            updatePath(): void;
        }
        class StartState extends basic.Circle {
            constructor(attributes?: GenericAttributes<basic.CircleAttrs>, options?: {[key: string]: any});
        }
        class EndState extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: {[key: string]: any});
        }
        class Transition extends dia.Link {
            constructor(attributes?: dia.LinkAttributes, options?: {[key: string]: any});
        }
    }
}

export namespace util {

    namespace format {
        export function number(specifier: string, value: number): string;
    }

    export function uuid(): string;

    export function guid(obj?: {[key: string]: any}): string;

    export function nextFrame(callback: () => void, context?: {[key: string]: any}): number;

    export function cancelFrame(requestId: number): void;

    export function flattenObject(object: {[key: string]: any}, delim: string, stop: (node: any) => boolean): any;

    export function getByPath(object: {[key: string]: any}, path: string, delim: string): any;

    export function setByPath(object: {[key: string]: any}, path: string, value: any, delim: string): any;

    export function unsetByPath(object: {[key: string]: any}, path: string, delim: string): any;

    export function breakText(text: string, size: dia.Size, attrs?: dia.SVGAttributes, options?: { svgDocument?: SVGElement }): string;

    export function normalizeSides(box: number | { x?: number, y?: number, height?: number, width?: number }): dia.BBox;

    export function getElementBBox(el: Element): dia.BBox;

    export function setAttributesBySelector(el: Element, attrs: dia.SVGAttributes): void;

    export function sortElements(elements: Element[]
                                     | string
                                     | JQuery, comparator: (a: Element, b: Element) => number): Element[];

    export function shapePerimeterConnectionPoint(linkView: dia.LinkView, view: dia.ElementView, magnet: SVGElement, ref: dia.Point): dia.Point;

    export function imageToDataUri(url: string, callback: (err: Error, dataUri: string) => void): void;

    export function toggleFullScreen(el?: Element): void;

    // Not documented but used in examples
    /** @deprecated use lodash _.defaultsDeep */
    export function deepSupplement(objects: any, defaultIndicator?: any): any;

    // Private functions
    /** @deprecated use lodash _.assign */
    export function mixin(objects: any[]): any;

    /** @deprecated use lodash _.defaults */
    export function supplement(objects: any[]): any;

    /** @deprecated use lodash _.mixin  */
    export function deepMixin(objects: any[]): any;
}

export namespace layout {

    interface LayoutOptions {
        nodeSep?: number;
        edgeSep?: number;
        rankSep?: number;
        rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
        marginX?: number;
        marginY?: number;
        resizeCluster?: boolean;
        setPosition?: (element: dia.Element, position: dia.BBox) => void;
        setLinkVertices?: (link: dia.Link, vertices: Position[]) => void;
    }

    export namespace DirectedGraph {
        export function layout(graph: dia.Graph | dia.Cell[], options?: LayoutOptions): dia.BBox;
    }
}
