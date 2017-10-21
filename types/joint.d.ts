export namespace dia {

    interface Size {
        width: number;
        height: number;
    }

    interface Point {
        x: number;
        y: number;
    }

    type Padding = number | {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number
    };

    interface BBox extends Point, Size {}

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

    interface EmbeddableOptions {
        deep?: boolean;
    }

    interface ConnectionOptions extends EmbeddableOptions {
        inbound?: boolean;
        outbound?: boolean;
    }

    interface DisconnectableOptions {
        disconnectLinks?: boolean;
    }

    interface ExploreOptions extends ConnectionOptions {
        breadthFirst?: boolean;
    }

    interface EdgeMap {
        [key: string]: boolean;
    }

    class Graph extends Backbone.Model {

        constructor(attributes?: any, opt?: { cellNamespace: any, cellModel: typeof Cell });

        addCell(cell: Cell | Cell[], opt?: { [key: string]: any }): this;

        addCells(cells: Cell[], opt?: { [key: string]: any }): this;

        resetCells(cells: Cell[], opt?: { [key: string]: any }): this;

        getCell(id: string | number | Cell): Cell;

        getElements(): Element[];

        getLinks(): Link[];

        getCells(): Cell[];

        getFirstCell(): Cell | undefined;

        getLastCell(): Cell | undefined;

        getConnectedLinks(cell: Cell, opt?: ConnectionOptions): Link[];

        disconnectLinks(cell: Cell, opt?: { [key: string]: any }): void;

        removeLinks(cell: Cell, opt?: { [key: string]: any }): void;

        translate(tx: number, ty?: number, opt?: TranslateOptions): this;

        cloneCells(cells: Cell[]): { [id: string]: Cell };

        getSubgraph(cells: Cell[], opt?: EmbeddableOptions): Cell[];

        cloneSubgraph(cells: Cell[], opt?: EmbeddableOptions): { [id: string]: Cell };

        dfs(element: Element, iteratee: (element: Element, distance: number) => boolean, opt?: ConnectionOptions): void;

        bfs(element: Element, iteratee: (element: Element, distance: number) => boolean, opt?: ConnectionOptions): void;

        search(element: Element, iteratee: (element: Element, distance: number) => boolean, opt?: ExploreOptions): void;

        getSuccessors(element: Element, opt?: ExploreOptions): Element[];

        getPredecessors(element: Element, opt?: ExploreOptions): Element[];

        isSuccessor(elementA: Element, elementB: Element): boolean;

        isPredecessor(elementA: Element, elementB: Element): boolean;

        isSource(element: Element): boolean;

        isSink(element: Element): boolean;

        getSources(): Element[];

        getSinks(): Element[];

        getNeighbors(element: Element, opt?: ConnectionOptions): Element[];

        isNeighbor(elementA: Element, elementB: Element, opt?: ConnectionOptions): boolean;

        getCommonAncestor(...cells: Cell[]): Element | undefined;

        toJSON(): any;

        fromJSON(json: any, opt?: { [key: string]: any }): this;

        clear(opt?: { [key: string]: any }): this;

        findModelsFromPoint(p: Point): Element[];

        findModelsInArea(rect: g.PlainRect, opt?: { strict?: boolean }): Element[];

        findModelsUnderElement(element: Element, opt?: {
            searchBy?:
                'bottomLeft' | 'bottomMiddle' | 'center' |
                'corner' | 'leftMiddle' | 'origin' | 'rightMiddle' |
                'topMiddle' | 'topRight' | 'bbox'
        }): Element[];

        getBBox(cells?: Cell[], opt?: EmbeddableOptions): g.Rect | null;

        getCellsBBox(cells: Cell[], opt?: EmbeddableOptions): g.Rect | null;

        hasActiveBatch(name?: string): boolean;

        maxZIndex(): number;

        removeCells(cells: Cell[], opt?: DisconnectableOptions): this;

        resize(width: number, height: number, opt?: { [key: string]: any }): this;

        resizeCells(width: number, height: number, cells: Cell[], opt?: { [key: string]: any }): this;

        startBatch(name: string, data?: {[key: string]: any}): this;

        stopBatch(name: string, data?: {[key: string]: any}): this;

        toGraphLib(opt?: { [key: string]: any }): any;

        fromGraphLib(glGraph: any, opt?: { [key: string]: any }): this;

        protected getInboundEdges(node: string): EdgeMap;

        protected getOutboundEdges(node: string): EdgeMap;
    }

    // dia.Cell

    interface NativeSVGAttributes {
        [key: string]: any;
    }

    interface SVGAttributes extends NativeSVGAttributes {
        xlinkHref?: string;
        xlinkShow?: string;
        xmlSpace?: string;
        filter?: string | { [key: string]: any };
        fill?: string | { [key: string]: any };
        stroke?: string | { [key: string]: any };
        sourceMarker?: { [key: string]: any };
        targetMarker?: { [key: string]: any };
        vertexMarker?: { [key: string]: any };
        text?: string;
        textWrap?: { [key: string]: any };
        lineHeight?: number | string;
        textPath?: any;
        annotations?: any;
        port?: string;
        style?: string;
        html?: string;
        ref?: string;
        refX?: string | number;
        refy?: string | number;
        refX2?: string | number;
        refy2?: string | number;
        refDx?: string | number;
        refDy?: string | number;
        refWidth?: string | number;
        refHeight?: string | number;
        refRx?: string | number;
        refRy?: string | number;
        refCx?: string | number;
        refCy?: string | number;
        resetOffset?: boolean;
        xAlignment?: 'middle' | 'right' | number | string;
        yAlignment?: 'middle' | 'bottom' | number | string;
        event?: string;
        magnet?: boolean | string;
        // Backwards compatibility
        'ref-x'?: string | number;
        'ref-y'?: string | number;
        'ref-dx'?: string | number;
        'ref-dy'?: string | number;
        'ref-width'?: string | number;
        'ref-height'?: string | number;
        'x-alignment'?: 'middle' | 'right' | number | string;
        'y-alignment'?: 'middle' | 'bottom' | number | string;
    }

    interface Selectors {
        [selector: string]: SVGAttributes;
    }

    export namespace Cell {

        interface Attributes {
            [key: string]: any;
            z?: number;
        }

        interface Constructor<T extends Backbone.Model> {
            new (options?: { id: string }): T
        }
    }

    class Cell extends Backbone.Model {

        constructor(attributes?: Cell.Attributes, opt?: { [key: string]: any });

        id: string | number;

        graph: dia.Graph;

        toJSON(): any;

        remove(opt?: DisconnectableOptions): this;

        toFront(opt?: EmbeddableOptions): this;

        toBack(opt?: EmbeddableOptions): this;

        getAncestors(): Cell[];

        getEmbeddedCells(opt?: { deep?: boolean, breadthFirst?: boolean }): Cell[];

        isEmbeddedIn(cell: Cell, opt?: EmbeddableOptions): boolean;

        isEmbedded(): boolean;

        prop(key: string | string[]): any;
        prop(object: Cell.Attributes): this;
        prop(key: string | string[], value: any, opt?: { [key: string]: any }): this;

        removeProp(path: string | string[], opt?: { [key: string]: any }): this;

        attr(key?: string): any;
        attr(object: Selectors): this;
        attr(key: string, value: any): this;

        clone(): Cell;
        clone(opt: EmbeddableOptions): Cell | Cell[];

        removeAttr(path: string | string[], opt?: { [key: string]: any }): this;

        transition(path: string, value?: any, opt?: TransitionOptions, delim?: string): number;

        getTransitions(): string[];

        stopTransitions(path?: string, delim?: string): this;

        embed(cell: Cell, opt?: { [key: string]: any }): this;

        unembed(cell: Cell, opt?: { [key: string]: any }): this;

        addTo(graph: Graph, opt?: { [key: string]: any }): this;

        findView(paper: Paper): CellView;

        isLink(): boolean;

        isElement(): boolean;

        startBatch(name: string, opt?: { [key: string]: any }): this;

        stopBatch(name: string, opt?: { [key: string]: any }): this;

        static define(type: string, defaults?: any, protoProps?: any, staticProps?: any): Cell.Constructor<Cell>;

        /**
         * @deprecated
         */
        protected processPorts(): void;
    }

    // dia.Element

    const enum Direction {
        Left = 'left',
        Right = 'right',
        Top = 'top',
        Bottom = 'bottom',
        TopRight = 'top-right',
        TopLeft = 'top-left',
        BottomLeft = 'bottom-left',
        BottomRight = 'bottom-right'
    }

    interface Port {
        id?: string;
        markup?: string;
        group?: string;
        attrs?: Selectors;
        args?: { [key: string]: any };
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

    export namespace Element {

        interface Attributes extends Cell.Attributes {
            position?: Point;
            size?: Size;
            angle?: number;
            attrs?: Selectors
            ports?: {[key: string]: any};
        }
    }

    class Element extends Cell {

        constructor(attributes?: Element.Attributes, opt?: { [key: string]: any });

        translate(tx: number, ty?: number, opt?: TranslateOptions): this;

        position(opt?: { parentRelative?: boolean, [key: string]: any }): g.Point;
        position(x: number, y: number, opt?: { parentRelative?: boolean, deep?: boolean, [key: string]: any }): this;

        size(): Size;
        size(width: number, height?: number, opt?: { direction?: Direction, [key: string]: any }): this;

        resize(width: number, height: number, opt?: { direction?: Direction, [key: string]: any }): this;

        rotate(deg: number, absolute?: boolean, origin?: Point, opt?: { [key: string]: any }): this;

        scale(scaleX: number, scaleY: number, origin?: Point, opt?: { [key: string]: any }): this;

        fitEmbeds(opt?: { deep?: boolean, padding?: Padding }): this;

        getBBox(opt?: EmbeddableOptions): g.Rect;

        addPort(port: Port, opt?: { [key: string]: any }): this;

        addPorts(ports: Port[], opt?: { [key: string]: any }): this;

        removePort(port: string | Port, opt?: { [key: string]: any }): this;

        hasPorts(): boolean;

        hasPort(id: string): boolean;

        getPorts(): Port[];

        getPort(id: string): Port;

        getPortsPositions(groupName: string): { [id: string]: PortPosition };

        getPortIndex(port: string | Port): number;

        portProp(portId: string, path: any, value?: any, opt?: { [key: string]: any }): dia.Element;

        static define(type: string, defaults?: any, protoProps?: any, staticProps?: any): Cell.Constructor<Element>;
    }

    // dia.Link

    export namespace Link {

        interface LabelPosition {
            distance: number;
            offset: number | { x: number; y: number; }
        }

        interface Label {
            position: LabelPosition | number;
            attrs?: Selectors;
            size?: Size;
        }

        interface Attributes extends Cell.Attributes {
            source?: Point | { id: string, selector?: string, port?: string };
            target?: Point | { id: string, selector?: string, port?: string };
            labels?: Label[];
            vertices?: Point[];
            smooth?: boolean;
            attrs?: Selectors;
            router?: {[key: string]: any};
            connector?: {[key: string]: any};
        }
    }

    class Link extends Cell {

        markup: string;
        labelMarkup: string;
        toolMarkup: string;
        vertexMarkup: string;
        arrowHeadMarkup: string;

        constructor(attributes?: Link.Attributes, opt?: { [key: string]: any });

        disconnect(): this;

        label(index?: number): any;
        label(index: number, value: Link.Label, opt?: { [key: string]: any }): this;

        reparent(opt?: { [key: string]: any }): Element;

        getSourceElement(): null | Element;

        getTargetElement(): null | Element;

        hasLoop(opt?: EmbeddableOptions): boolean;

        getRelationshipAncestor(): undefined | Element;

        isRelationshipEmbeddedIn(cell: Cell): boolean;

        applyToPoints(fn: (p: Point) => Point, opt?: { [key: string]: any }): this;

        scale(sx: number, sy: number, origin?: Point, opt?: { [key: string]: any }): this;

        translate(tx: number, ty: number, opt?: { [key: string]: any }): this;

        static define(type: string, defaults?: any, protoProps?: any, staticProps?: any): Cell.Constructor<Link>;
    }

    // dia.CellView

    export namespace CellView {

        interface Options<T extends Cell> extends mvc.ViewOptions<T> {
            id?: string
        }

        interface InteractivityOptions {
            vertexAdd?: boolean,
            vertexMove?: boolean,
            vertexRemove?: boolean;
            arrowheadMove?: boolean;
            labelMove?: boolean;
            useLinkTOols?: boolean;
            elementMove?: boolean;
            addLinkFromMagnet?: boolean;
        }
    }

    abstract class CellViewGeneric<T extends Cell> extends mvc.View<T> {

        constructor(opt?: CellView.Options<T>);

        highlight(el?: SVGElement | JQuery | string, opt?: { [key: string]: any }): this;

        unhighlight(el?: SVGElement | JQuery | string, opt?: { [key: string]: any }): this;

        can(feature: string): boolean;

        setInteractivity(value: boolean | CellView.InteractivityOptions): void;

        findMagnet(el: SVGElement | JQuery | string): SVGElement | undefined;

        getSelector(el: SVGElement, prevSelector?: string): string;

        getStrokeBBox(el?: SVGElement): g.Rect;

        notify(eventName: string): void;

        protected mouseover(evt: JQuery.Event): void;

        protected mousewheel(evt: JQuery.Event, x: number, y: number, delta: number): void

        protected pointerclick(evt: JQuery.Event, x: number, y: number): void;

        protected pointerdblclick(evt: JQuery.Event, x: number, y: number): void;

        protected pointerdown(evt: JQuery.Event, x: number, y: number): void;

        protected pointermove(evt: JQuery.Event, x: number, y: number): void;

        protected pointerup(evt: JQuery.Event, x: number, y: number): void;
    }

    class CellView extends CellViewGeneric<Cell> {}

    // dia.ElementView

    class ElementView extends CellViewGeneric<Element> {

        getBBox(opt?: { useModelGeometry?: boolean }): g.Rect;

        update(element: Element, renderingOnlyAttrs?: { [key: string]: any }): void;

        protected renderMarkup(): void;
    }

    // dia.LinkView

    class LinkView extends CellViewGeneric<Link> {

        options: {
            shortLinkLength?: number,
            doubleLinkTools?: boolean,
            longLinkLength?: number,
            linkToolsOffset?: number,
            doubleLinkToolsOffset?: number,
            sampleInterval?: number
        };

        sendToken(token: SVGElement, duration?: number, callback?: () => void): void;
        sendToken(token: SVGElement, opt?: { duration?: number, direction?: string; }, callback?: () => void): void;

        addVertex(vertex: Point): number;

        getConnectionLength(): number;

        getPointAtLength(length: number): g.Point;

        update(link: Link, attributes: any, opt?: { [key: string]: any }): this;

        protected onLabelsChange(link: Link, labels: Link.Label[], opt: { [key: string]: any }): void;

        protected onToolsChange(link: Link, toolsMarkup: string, opt: { [key: string]: any }): void;

        protected onVerticesChange(link: Link, vertices: Point[], opt: { [key: string]: any }): void;

        protected onSourceChange(element: Element, sourceEnd: any, opt: { [key: string]: any }): void;

        protected onTargetChange(element: Element, targetEnd: any, opt: { [key: string]: any }): void;
    }

    // dia.Paper


    interface ManhattanRouterArgs {
        excludeTypes?: string[];
        excludeEnds?: 'source' | 'target';
        startDirections?: ['left' | 'right' | 'top' | 'bottom'];
        endDirections?: ['left' | 'right' | 'top' | 'bottom'];
    }

    interface Highlighter {
        name: string;
        opt?: { [key: string]: any };
    }

    export namespace Paper {

        interface GradientOptions {
            id?: string;
            type: 'linearGradient' | 'radialGradient';
            stops: Array<{
                offset: string;
                color: string;
                opacity?: number;
            }>;
        }

        interface GridOptions {
            color?: string;
            thickness?: number;
            name?: 'dot' | 'fixedDot' | 'mesh' | 'doubleMesh';
            args?: Array<{ [key: string]: any }> | { [key: string]: any };
        }

        interface BackgroundOptions {
            color?: string;
            image?: string;
            quality?: number;
            position?: Point | string;
            size?: Size | string;
            repeat?: string;
            opacity?: number;
            waterMarkAngle?: number;
        }

        interface Options extends mvc.ViewOptions<Graph> {
            // appearance
            width?: number;
            height?: number;
            origin?: Point;
            perpendicularLinks?: boolean;
            linkConnectionPoint?: (linkView: LinkView, view: ElementView, magnet: SVGElement, reference: Point) => Point;
            drawGrid?: boolean | GridOptions | GridOptions[];
            background?: BackgroundOptions;
            async?: boolean | { batchSize: number };
            // interactions
            gridSize?: number;
            highlighting?: { [type: string]: Highlighter };
            interactive?: ((cellView: CellView, event: string) => boolean) | boolean | CellView.InteractivityOptions
            snapLinks?: boolean | { radius: number };
            markAvailable?: boolean;
            // validations
            validateMagnet?: (cellView: CellView, magnet: SVGElement) => boolean;
            validateConnection?: (cellViewS: CellView, magnetS: SVGElement, cellViewT: CellView, magnetT: SVGElement, end: 'source' | 'target', linkView: LinkView) => boolean;
            restrictTranslate?: ((elementView: ElementView) => BBox) | boolean;
            multiLinks?: boolean;
            linkPinning?: boolean;
            // events
            guard?: (evt: JQuery.Event, view: CellView) => boolean;
            preventContextMenu?: boolean;
            preventDefaultBlankAction?: boolean;
            clickThreshold?: number;
            moveThreshold?: number;
            // views
            elementView?: (element: Element) => typeof ElementView | typeof ElementView;
            linkView?: (link: Link) => typeof LinkView | typeof LinkView;
            // embedding
            embeddingMode?: boolean;
            findParentBy?: 'bbox' | 'center' | 'origin' | 'corner' | 'topRight' | 'bottomLeft';
            validateEmbedding?: (childView: ElementView, parentView: ElementView) => boolean;
            // default views, models & attributes
            cellViewNamespace?: any;
            highlighterNamespace?: any;
            defaultLink?: ((cellView: CellView, magnet: SVGElement) => Link) | Link;
            defaultRouter?: ((vertices: Point[], args: {[key: string]: any}, linkView: LinkView) => Point[])
                | { name: string, args?: { [key: string]: any } };
            defaultConnector?:
                ((sourcePoint: Point, targetPoint: Point, vertices: Point[], args: {[key: string]: any}, linkView: LinkView) => string)
                | { name: string, args?: { radius?: number, [key: string]: any } };
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

    }

    class Paper extends mvc.View<Graph> {

        constructor(opt: Paper.Options);

        options: Paper.Options;
        svg: SVGElement;
        viewport: SVGGElement;
        defs: SVGDefsElement;

        matrix(): SVGMatrix;
        matrix(ctm: SVGMatrix | Vectorizer.Matrix): this;

        clientMatrix(): SVGMatrix;

        clientOffset(): g.Point;

        pageOffset(): g.Point;

        clientToLocalPoint(x: number, y: number): g.Point;
        clientToLocalPoint(point: g.PlainPoint): g.Point;

        clientToLocalRect(x: number, y: number, width: number, height: number): g.Rect;
        clientToLocalRect(rect: g.PlainRect): g.Rect;

        localToClientPoint(x: number, y: number): g.Point;
        localToClientPoint(point: g.PlainPoint): g.Point;

        localToClientRect(x: number, y: number, width: number, height: number): g.Rect;
        localToClientRect(rect: g.PlainRect): g.Rect;

        localToPagePoint(x: number, y: number): g.Point;
        localToPagePoint(point: g.PlainPoint): g.Point;

        localToPageRect(x: number, y: number, width: number, height: number): g.Rect;
        localToPageRect(rect: g.PlainRect): g.Rect;

        localToPaperPoint(x: number, y: number): g.Point;
        localToPaperPoint(point: g.PlainPoint): g.Point;

        localToPaperRect(x: number, y: number, width: number, height: number): g.Rect;
        localToPaperRect(rect: g.PlainRect): g.Rect;

        pageToLocalPoint(x: number, y: number): g.Point;
        pageToLocalPoint(point: g.PlainPoint): g.Point;

        pageToLocalRect(x: number, y: number, width: number, height: number): g.Rect;
        pageToLocalRect(rect: g.PlainRect): g.Rect;

        paperToLocalPoint(x: number, y: number): g.Point;
        paperToLocalPoint(point: g.PlainPoint): g.Point;

        paperToLocalRect(x: number, y: number, width: number, height: number): g.Rect;
        paperToLocalRect(x: g.PlainRect): g.Rect;

        snapToGrid(x: number, y: number): g.Point;
        snapToGrid(point: g.PlainPoint): g.Point;

        defineFilter(filter: { [key: string]: any }): string;

        defineGradient(gradient: Paper.GradientOptions): string;

        defineMarker(marker: { [key: string]: any }): string;

        isDefined(defId: string): boolean;

        getArea(): g.Rect;

        getRestrictedArea(): g.Rect | undefined;

        getContentBBox(): g.Rect;

        findView<T extends ElementView | LinkView>(element: string | JQuery | SVGElement): T;

        findViewByModel<T extends ElementView | LinkView>(model: Cell | string | number): T;

        findViewsFromPoint(point: string | g.PlainPoint): ElementView[];

        findViewsInArea(rect: g.PlainRect, opt?: { strict?: boolean }): ElementView[];

        fitToContent(opt?: Paper.FitToContentOptions): void;
        fitToContent(gridWidth?: number, gridHeight?: number, padding?: number, opt?: any): void;

        scaleContentToFit(opt?: Paper.ScaleContentOptions): void;

        cancelRenderViews(): void;

        drawBackground(opt?: Paper.BackgroundOptions): this;

        drawGrid(opt?: Paper.GridOptions | Paper.GridOptions[]): this;

        clearGrid(): this;

        getDefaultLink(cellView: CellView, magnet: HTMLElement): Link;

        getModelById(id: string | number | Cell): Cell;

        setDimensions(width: number, height: number): void;

        setGridSize(gridSize: number): this;

        setInteractivity(value: any): void;

        setOrigin(x: number, y: number): this;

        scale(): Vectorizer.Scale;
        scale(sx: number, sy?: number, ox?: number, oy?: number): this;

        translate(): Vectorizer.Translation;
        translate(tx: number, ty?: number): this;

        update(): this;

        // protected
        protected guard(evt: JQuery.Event, view: CellView): boolean;

        protected sortViews(): void;

        protected drawBackgroundImage(img: HTMLImageElement, opt: { [key: string]: any }): void;

        protected createViewForModel(cell: Cell): CellView;

        protected cloneOptions(): Paper.Options;

        protected afterRenderViews(): void;

        protected asyncRenderViews(cells: Cell[], opt?: { [key: string]: any }): void;

        protected beforeRenderViews(cells: Cell[]): Cell[];

        protected cellMouseEnter(evt: JQuery.Event): void;

        protected cellMouseleave(evt: JQuery.Event): void;

        protected cellMouseout(evt: JQuery.Event): void;

        protected cellMouseover(evt: JQuery.Event): void;

        protected contextmenu(evt: JQuery.Event): void;

        protected init(): void;

        protected mouseclick(evt: JQuery.Event): void;

        protected mousedblclick(evt: JQuery.Event): void;

        protected mousewheel(evt: JQuery.Event): void;

        protected onCellAdded(cell: Cell, graph: Graph, opt: { async?: boolean, position?: number }): void;

        protected onCellHighlight(cellView: CellView, magnetEl: HTMLElement, opt?: { highlighter?: Highlighter }): void;

        protected onCellUnhighlight(cellView: CellView, magnetEl: HTMLElement, opt?: { highlighter?: Highlighter }): void;

        protected onRemove(): void;

        protected pointerdown(evt: JQuery.Event): void;

        protected pointermove(evt: JQuery.Event): void;

        protected pointerup(evt: JQuery.Event): void;

        protected removeView(cell: Cell): CellView;

        protected removeViews(): void;

        protected renderView(cell: Cell): CellView;

        protected resetViews(cellsCollection: Cell[], opt: { [key: string]: any }): void;

        protected updateBackgroundColor(color: string): void;

        protected updateBackgroundImage(opt: { position?: any, size?: any }): void;
    }
}

export namespace shapes {

    interface GenericAttributes<T> extends dia.Cell.Attributes {
        position?: dia.Point;
        size?: dia.Size;
        angle?: number;
        attrs?: T;
    }

    interface ShapeAttrs extends dia.SVGAttributes {
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
    }

    interface TextAttrs extends dia.Selectors {
        text?: {
            text?: string;
            [key: string]: any;
        };
    }

    namespace basic {
        class Generic extends dia.Element {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        interface RectAttrs extends TextAttrs {
            rect?: ShapeAttrs;
        }

        class Rect extends Generic {
            constructor(attributes?: GenericAttributes<RectAttrs>, opt?: {[key: string]: any});
        }

        class Text extends Generic {
            constructor(attributes?: GenericAttributes<TextAttrs>, opt?: {[key: string]: any});
        }

        interface CircleAttrs extends TextAttrs {
            circle?: ShapeAttrs;
        }

        class Circle extends Generic {
            constructor(attributes?: GenericAttributes<CircleAttrs>, opt?: {[key: string]: any});
        }

        interface EllipseAttrs extends TextAttrs {
            ellipse?: ShapeAttrs;
        }

        class Ellipse extends Generic {
            constructor(attributes?: GenericAttributes<EllipseAttrs>, opt?: {[key: string]: any});
        }

        interface PolygonAttrs extends TextAttrs {
            polygon?: ShapeAttrs;
        }

        class Polygon extends Generic {
            constructor(attributes?: GenericAttributes<PolygonAttrs>, opt?: {[key: string]: any});
        }

        interface PolylineAttrs extends TextAttrs {
            polyline?: ShapeAttrs;
        }

        class Polyline extends Generic {
            constructor(attributes?: GenericAttributes<PolylineAttrs>, opt?: {[key: string]: any});
        }

        class Image extends Generic {
            constructor(attributes?: GenericAttributes<TextAttrs>, opt?: {[key: string]: any});
        }

        interface PathAttrs extends TextAttrs {
            path?: ShapeAttrs;
        }

        class Path extends Generic {
            constructor(attributes?: GenericAttributes<PathAttrs>, opt?: {[key: string]: any});
        }

        interface RhombusAttrs extends TextAttrs {
            path?: ShapeAttrs;
        }

        class Rhombus extends Generic {
            constructor(attributes?: GenericAttributes<RhombusAttrs>, opt?: {[key: string]: any});
        }

        interface TextBlockAttrs extends TextAttrs {
            rect?: ShapeAttrs;
        }

        class TextBlock extends Generic {
            constructor(attributes?: GenericAttributes<TextBlockAttrs>, opt?: {[key: string]: any});

            updateSize(cell: dia.Cell, size: dia.Size): void;

            updateContent(cell: dia.Cell, content: string): void;
        }
    }

    namespace chess {
        class KingWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class KingBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class QueenWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class QueenBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class RookWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class RookBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class BishopWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class BishopBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class KnightWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class KnightBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class PawnWhite extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class PawnBlack extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }
    }

    namespace devs {
        /**
         * @deprecated
         */
        interface ModelAttributes extends GenericAttributes<dia.Selectors> {
            inPorts?: string[];
            outPorts?: string[];
            ports?: {[key: string]: any};
        }

        /**
         * @deprecated
         */
        class Model extends basic.Generic {
            constructor(attributes?: ModelAttributes, opt?: {[key: string]: any});

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
            constructor(attributes?: ModelAttributes, opt?: {[key: string]: any});
        }

        /**
         * @deprecated
         */
        class Atomic extends Model {
            constructor(attributes?: ModelAttributes, opt?: {[key: string]: any});
        }

        class Link extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
        }
    }

    namespace erd {
        class Entity extends basic.Generic {
            constructor(attributes?: GenericAttributes<TextAttrs>, opt?: {[key: string]: any});
        }

        class WeakEntity extends Entity {
            constructor(attributes?: GenericAttributes<TextAttrs>, opt?: {[key: string]: any});
        }

        class Relationship extends dia.Element {
            constructor(attributes?: GenericAttributes<TextAttrs>, opt?: {[key: string]: any});
        }

        class IdentifyingRelationship extends Relationship {
            constructor(attributes?: GenericAttributes<TextAttrs>, opt?: {[key: string]: any});
        }

        interface AttributeAttrs extends TextAttrs {
            ellipse?: ShapeAttrs;
        }

        class Attribute extends dia.Element {
            constructor(attributes?: GenericAttributes<AttributeAttrs>, opt?: {[key: string]: any});
        }

        class Multivalued extends Attribute {
            constructor(attributes?: GenericAttributes<AttributeAttrs>, opt?: {[key: string]: any});
        }

        class Derived extends Attribute {
            constructor(attributes?: GenericAttributes<AttributeAttrs>, opt?: {[key: string]: any});
        }

        class Key extends Attribute {
            constructor(attributes?: GenericAttributes<AttributeAttrs>, opt?: {[key: string]: any});
        }

        class Normal extends Attribute {
            constructor(attributes?: GenericAttributes<AttributeAttrs>, opt?: {[key: string]: any});
        }

        interface ISAAttrs extends dia.Element {
            polygon?: ShapeAttrs;
        }

        class ISA extends dia.Element {
            constructor(attributes?: GenericAttributes<ISAAttrs>, opt?: {[key: string]: any});
        }

        class Line extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});

            cardinality(value: string | number): void;
        }
    }

    namespace fsa {
        class State extends basic.Circle {
            constructor(attributes?: GenericAttributes<basic.CircleAttrs>, opt?: {[key: string]: any});
        }

        class StartState extends dia.Element {
            constructor(attributes?: GenericAttributes<basic.CircleAttrs>, opt?: {[key: string]: any});
        }

        class EndState extends dia.Element {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class Arrow extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
        }
    }

    namespace logic {

        interface IOAttrs extends TextAttrs {
            circle?: ShapeAttrs;
        }

        class Gate extends basic.Generic {
            constructor(attributes?: GenericAttributes<IOAttrs>, opt?: {[key: string]: any});
        }

        class IO extends Gate {
            constructor(attributes?: GenericAttributes<IOAttrs>, opt?: {[key: string]: any});
        }

        class Input extends IO {
            constructor(attributes?: GenericAttributes<IOAttrs>, opt?: {[key: string]: any});
        }

        class Output extends IO {
            constructor(attributes?: GenericAttributes<IOAttrs>, opt?: {[key: string]: any});
        }

        class Gate11 extends Gate {
            constructor(attributes?: GenericAttributes<IOAttrs>, opt?: {[key: string]: any});
        }

        class Gate21 extends Gate {
            constructor(attributes?: GenericAttributes<IOAttrs>, opt?: {[key: string]: any});
        }

        interface Image {
            'xlink:href'?: string;
        }

        interface ImageAttrs extends ShapeAttrs {
            image?: Image;
        }

        class Repeater extends Gate11 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, opt?: {[key: string]: any});

            operation(input: any): any;
        }

        class Not extends Gate11 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, opt?: {[key: string]: any});

            operation(input: any): boolean;
        }

        class Or extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, opt?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }

        class And extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, opt?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }

        class Nor extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, opt?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }

        class Nand extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, opt?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }

        class Xor extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, opt?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }

        class Xnor extends Gate21 {
            constructor(attributes?: GenericAttributes<ImageAttrs>, opt?: {[key: string]: any});

            operation(input1: any, input2: any): boolean;
        }

        class Wire extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
        }
    }

    namespace org {
        interface MemberAttrs {
            rect?: ShapeAttrs;
            image?: ShapeAttrs;
        }

        class Member extends dia.Element {
            constructor(attributes?: GenericAttributes<MemberAttrs>, opt?: {[key: string]: any});
        }

        class Arrow extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
        }
    }

    namespace pn {
        class Place extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class PlaceView extends dia.ElementView {
            renderTokens(): void;
        }

        class Transition extends basic.Generic {
            constructor(attributes?: GenericAttributes<basic.RectAttrs>, opt?: {[key: string]: any});
        }

        class Link extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
        }
    }

    namespace uml {
        interface ClassAttributes extends GenericAttributes<basic.RectAttrs> {
            name: string[];
            attributes: string[];
            methods: string[];
        }

        class Class extends basic.Generic {
            constructor(attributes?: ClassAttributes, opt?: {[key: string]: any});

            getClassName(): string[];

            updateRectangles(): void;
        }

        class ClassView extends dia.ElementView {
        }

        class Abstract extends Class {
            constructor(attributes?: ClassAttributes, opt?: {[key: string]: any});
        }

        class AbstractView extends ClassView {
            constructor(attributes?: ClassAttributes, opt?: {[key: string]: any});
        }

        class Interface extends Class {
            constructor(attributes?: ClassAttributes, opt?: {[key: string]: any});
        }

        class InterfaceView extends ClassView {
            constructor(attributes?: ClassAttributes, opt?: {[key: string]: any});
        }

        class Generalization extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
        }

        class Implementation extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
        }

        class Aggregation extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
        }

        class Composition extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
        }

        class Association extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
        }

        interface StateAttributes extends GenericAttributes<ShapeAttrs> {
            events?: string[];
        }

        class State extends basic.Generic {
            constructor(attributes?: GenericAttributes<basic.CircleAttrs>, opt?: {[key: string]: any});

            updateName(): void;

            updateEvents(): void;

            updatePath(): void;
        }

        class StartState extends basic.Circle {
            constructor(attributes?: GenericAttributes<basic.CircleAttrs>, opt?: {[key: string]: any});
        }

        class EndState extends basic.Generic {
            constructor(attributes?: GenericAttributes<dia.Selectors>, opt?: {[key: string]: any});
        }

        class Transition extends dia.Link {
            constructor(attributes?: dia.Link.Attributes, opt?: {[key: string]: any});
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

    export function breakText(text: string, size: dia.Size, attrs?: dia.NativeSVGAttributes, opt?: { svgDocument?: SVGElement }): string;

    export function normalizeSides(box: number | { x?: number, y?: number, height?: number, width?: number }): dia.BBox;

    export function getElementBBox(el: Element): dia.BBox;

    export function setAttributesBySelector(el: Element, attrs: dia.Selectors): void;

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

    export namespace DirectedGraph {

        interface Edge {
            minLen?: number;
            weight?: number;
            labelpos?: 'l' | 'c' | 'r';
            labeloffset?: number;
            width?: number;
            height?: number;
        }

        interface Node {
            width?: number;
            height?: number;
        }

        interface LayoutOptions {
            rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
            ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
            nodeSep?: number;
            edgeSep?: number;
            rankSep?: number;
            marginX?: number;
            marginY?: number;
            resizeCluster?: boolean;
            clusterPadding?: dia.Padding;
            setPosition?: (element: dia.Element, position: dia.BBox) => void;
            setVertices?: boolean | ((link: dia.Link, vertices: dia.Point[]) => void);
            setLabels?: boolean | ((link: dia.Link, position: dia.Point, points: dia.Point[]) => void);
            debugTiming?: boolean;
            exportElement?: (element: dia.Element) => Node;
            exportLink?: (link: dia.Link) => Edge;
            // deprecated
            setLinkVertices?: boolean;
        }

        export function layout(graph: dia.Graph | dia.Cell[], opt?: LayoutOptions): g.Rect;
    }
}

export namespace mvc {

    interface ViewOptions<T extends Backbone.Model> extends Backbone.ViewOptions<T> {
        theme?: string;
    }

    class View<T extends Backbone.Model> extends Backbone.View<T> {

        constructor(opt?: ViewOptions<T>);

        theme: string;

        themeClassNamePrefix: string

        defaultTheme: string;

        requireSetThemeOverride: boolean;

        setTheme(theme: string, opt?: { override?: boolean }): this;

        getEventNamespace(): string;

        protected init(): void;

        protected onRender(): void;

        protected onSetTheme(oldTheme: string, newTheme: string): void;

        protected onRemove(): void;
    }
}

export function setTheme(theme: string): void;
