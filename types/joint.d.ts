export namespace dia {

    type Point = g.PlainPoint;

    type BBox = g.PlainRect;

    type Size = Pick<BBox, 'width' | 'height'>;

    type PaddingJSON = {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number
    };

    type Padding = number | PaddingJSON;

    type Direction =
        'left' | 'right' | 'top' | 'bottom' | 'top-right' |
        'top-left' | 'bottom-left' | 'bottom-right';

    export namespace Graph {

        interface ConnectionOptions extends Cell.EmbeddableOptions {
            inbound?: boolean;
            outbound?: boolean;
        }

        interface ExploreOptions extends ConnectionOptions {
            breadthFirst?: boolean;
        }
    }

    class Graph extends Backbone.Model {

        constructor(attributes?: any, opt?: { cellNamespace?: any, cellModel?: typeof Cell });

        addCell(cell: Cell | Cell[], opt?: { [key: string]: any }): this;

        addCells(cells: Cell[], opt?: { [key: string]: any }): this;

        resetCells(cells: Cell[], opt?: { [key: string]: any }): this;

        getCell(id: string | number | Cell): Cell;

        getElements(): Element[];

        getLinks(): Link[];

        getCells(): Cell[];

        getFirstCell(): Cell | undefined;

        getLastCell(): Cell | undefined;

        getConnectedLinks(cell: Cell, opt?: Graph.ConnectionOptions): Link[];

        disconnectLinks(cell: Cell, opt?: { [key: string]: any }): void;

        removeLinks(cell: Cell, opt?: { [key: string]: any }): void;

        translate(tx: number, ty?: number, opt?: Element.TranslateOptions): this;

        cloneCells(cells: Cell[]): { [id: string]: Cell };

        getSubgraph(cells: Cell[], opt?: Cell.EmbeddableOptions): Cell[];

        cloneSubgraph(cells: Cell[], opt?: Cell.EmbeddableOptions): { [id: string]: Cell };

        dfs(element: Element, iteratee: (element: Element, distance: number) => boolean, opt?: Graph.ConnectionOptions): void;

        bfs(element: Element, iteratee: (element: Element, distance: number) => boolean, opt?: Graph.ConnectionOptions): void;

        search(element: Element, iteratee: (element: Element, distance: number) => boolean, opt?: Graph.ExploreOptions): void;

        getSuccessors(element: Element, opt?: Graph.ExploreOptions): Element[];

        getPredecessors(element: Element, opt?: Graph.ExploreOptions): Element[];

        isSuccessor(elementA: Element, elementB: Element): boolean;

        isPredecessor(elementA: Element, elementB: Element): boolean;

        isSource(element: Element): boolean;

        isSink(element: Element): boolean;

        getSources(): Element[];

        getSinks(): Element[];

        getNeighbors(element: Element, opt?: Graph.ConnectionOptions): Element[];

        isNeighbor(elementA: Element, elementB: Element, opt?: Graph.ConnectionOptions): boolean;

        getCommonAncestor(...cells: Cell[]): Element | undefined;

        toJSON(): any;

        fromJSON(json: any, opt?: { [key: string]: any }): this;

        clear(opt?: { [key: string]: any }): this;

        findModelsFromPoint(p: Point): Element[];

        findModelsInArea(rect: BBox, opt?: { strict?: boolean }): Element[];

        findModelsUnderElement(element: Element, opt?: {
            searchBy?: 'bottomLeft' | 'bottomMiddle' | 'center' |
                'corner' | 'leftMiddle' | 'origin' | 'rightMiddle' |
                'topMiddle' | 'topRight' | 'bbox'
        }): Element[];

        getBBox(cells?: Cell[], opt?: Cell.EmbeddableOptions): g.Rect | null;

        getCellsBBox(cells: Cell[], opt?: Cell.EmbeddableOptions): g.Rect | null;

        hasActiveBatch(name?: string): boolean;

        maxZIndex(): number;

        removeCells(cells: Cell[], opt?: Cell.DisconnectableOptions): this;

        resize(width: number, height: number, opt?: { [key: string]: any }): this;

        resizeCells(width: number, height: number, cells: Cell[], opt?: { [key: string]: any }): this;

        startBatch(name: string, data?: { [key: string]: any }): this;

        stopBatch(name: string, data?: { [key: string]: any }): this;

        toGraphLib(opt?: { [key: string]: any }): any;

        fromGraphLib(glGraph: any, opt?: { [key: string]: any }): this;
    }

    // dia.Cell

    export namespace Cell {

        interface GenericAttributes<T> {
            attrs?: T;
            z?: number;
        }

        interface Selectors {
            [selector: string]: attributes.SVGAttributes;
        }

        interface Attributes extends GenericAttributes<Selectors> {
            [key: string]: any;
        }

        interface Constructor<T extends Backbone.Model> {
            new (options?: { id: string }): T
        }

        interface EmbeddableOptions {
            deep?: boolean;
        }

        interface DisconnectableOptions {
            disconnectLinks?: boolean;
        }

        interface TransitionOptions {
            delay?: number;
            duration?: number;
            timingFunction?: util.timing.TimingFunction;
            valueFunction?: util.interpolate.InterpolateFunction<any>;
        }
    }

    class Cell extends Backbone.Model {

        constructor(attributes?: Cell.Attributes, opt?: { [key: string]: any });

        id: string | number;

        graph: Graph;

        toJSON(): any;

        remove(opt?: Cell.DisconnectableOptions): this;

        toFront(opt?: Cell.EmbeddableOptions): this;

        toBack(opt?: Cell.EmbeddableOptions): this;

        getAncestors(): Cell[];

        getEmbeddedCells(opt?: { deep?: boolean, breadthFirst?: boolean }): Cell[];

        isEmbeddedIn(cell: Cell, opt?: Cell.EmbeddableOptions): boolean;

        isEmbedded(): boolean;

        prop(key: string | string[]): any;
        prop(object: Cell.Attributes): this;
        prop(key: string | string[], value: any, opt?: { [key: string]: any }): this;

        removeProp(path: string | string[], opt?: { [key: string]: any }): this;

        attr(key?: string): any;
        attr(object: Cell.Selectors): this;
        attr(key: string, value: any): this;

        clone(): Cell;
        clone(opt: Cell.EmbeddableOptions): Cell | Cell[];

        removeAttr(path: string | string[], opt?: { [key: string]: any }): this;

        transition(path: string, value?: any, opt?: Cell.TransitionOptions, delim?: string): number;

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

    export namespace Element {

        interface GenericAttributes<T> extends Cell.GenericAttributes<T> {
            position?: Point;
            size?: Size;
            angle?: number;
            ports?: {
                groups?: { [key: string]: Port },
                items?: Port[]
            }
        }

        interface Attributes extends GenericAttributes<Cell.Selectors> {
            [key: string]: any
        }

        interface Port {
            id?: string;
            markup?: string;
            group?: string;
            attrs?: Cell.Selectors;
            args?: { [key: string]: any };
            size?: Size;
            label?: {
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

        interface TranslateOptions {
            restrictedArea?: BBox;
            transition?: Cell.TransitionOptions;
        }
    }

    class Element extends Cell {

        constructor(attributes?: Element.Attributes, opt?: { [key: string]: any });

        translate(tx: number, ty?: number, opt?: Element.TranslateOptions): this;

        position(opt?: { parentRelative?: boolean, [key: string]: any }): g.Point;
        position(x: number, y: number, opt?: { parentRelative?: boolean, deep?: boolean, [key: string]: any }): this;

        size(): Size;
        size(width: number, height?: number, opt?: { direction?: Direction, [key: string]: any }): this;

        resize(width: number, height: number, opt?: { direction?: Direction, [key: string]: any }): this;

        rotate(deg: number, absolute?: boolean, origin?: Point, opt?: { [key: string]: any }): this;

        scale(scaleX: number, scaleY: number, origin?: Point, opt?: { [key: string]: any }): this;

        fitEmbeds(opt?: { deep?: boolean, padding?: Padding }): this;

        getBBox(opt?: Cell.EmbeddableOptions): g.Rect;

        addPort(port: Element.Port, opt?: { [key: string]: any }): this;

        addPorts(ports: Element.Port[], opt?: { [key: string]: any }): this;

        removePort(port: string | Element.Port, opt?: { [key: string]: any }): this;

        hasPorts(): boolean;

        hasPort(id: string): boolean;

        getPorts(): Element.Port[];

        getPort(id: string): Element.Port;

        getPortsPositions(groupName: string): { [id: string]: Element.PortPosition };

        getPortIndex(port: string | Element.Port): number;

        portProp(portId: string, path: any, value?: any, opt?: { [key: string]: any }): Element;

        static define(type: string, defaults?: any, protoProps?: any, staticProps?: any): Cell.Constructor<Element>;
    }

    // dia.Link

    export namespace Link {

        interface GenericAttributes<T> extends Cell.GenericAttributes<T> {
            source?: Point | { id: string, selector?: string, port?: string };
            target?: Point | { id: string, selector?: string, port?: string };
            labels?: Label[];
            vertices?: Point[];
            smooth?: boolean;
            router?: routers.RouterJSON;
            connector?: connectors.ConnectorJSON;
        }

        interface LinkSelectors extends Cell.Selectors {
            '.connection'?: attributes.SVGPathAttributes;
            '.connection-wrap'?: attributes.SVGPathAttributes;
            '.marker-source'?: attributes.SVGPathAttributes;
            '.marker-target'?: attributes.SVGPathAttributes;
            '.labels'?: attributes.SVGAttributes;
            '.marker-vertices'?: attributes.SVGAttributes;
            '.marker-arrowheads'?: attributes.SVGAttributes;
            '.link-tools'?: attributes.SVGAttributes;
        }

        interface Attributes extends Cell.GenericAttributes<LinkSelectors> {
            [key: string]: any;
        }

        interface LabelPosition {
            distance: number;
            offset: number | { x: number; y: number; }
        }

        interface Label {
            position: LabelPosition | number;
            attrs?: Cell.Selectors;
            size?: Size;
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

        hasLoop(opt?: Cell.EmbeddableOptions): boolean;

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

        interface InteractivityOptions extends ElementView.InteractivityOptions, LinkView.InteractivityOptions {

        }
    }

    abstract class CellViewGeneric<T extends Cell> extends mvc.View<T> {

        constructor(opt?: CellView.Options<T>);

        highlight(el?: SVGElement | JQuery | string, opt?: { [key: string]: any }): this;

        unhighlight(el?: SVGElement | JQuery | string, opt?: { [key: string]: any }): this;

        can(feature: string): boolean;

        findMagnet(el: SVGElement | JQuery | string): SVGElement | undefined;

        findBySelector(selector: string, root?: SVGElement | JQuery | string): JQuery;

        getSelector(el: SVGElement, prevSelector?: string): string;

        getStrokeBBox(el?: SVGElement): g.Rect;

        notify(eventName: string, ...eventArguments: any[]): void;

        protected mouseover(evt: JQuery.Event): void;

        protected mousewheel(evt: JQuery.Event, x: number, y: number, delta: number): void

        protected pointerclick(evt: JQuery.Event, x: number, y: number): void;

        protected pointerdblclick(evt: JQuery.Event, x: number, y: number): void;

        protected pointerdown(evt: JQuery.Event, x: number, y: number): void;

        protected pointermove(evt: JQuery.Event, x: number, y: number): void;

        protected pointerup(evt: JQuery.Event, x: number, y: number): void;
    }

    class CellView extends CellViewGeneric<Cell> {

    }

    // dia.ElementView


    export namespace ElementView {

        interface InteractivityOptions {
            elementMove?: boolean;
            addLinkFromMagnet?: boolean;
        }
    }

    class ElementView extends CellViewGeneric<Element> {

        getBBox(opt?: { useModelGeometry?: boolean }): g.Rect;

        update(element: Element, renderingOnlyAttrs?: { [key: string]: any }): void;

        setInteractivity(value: boolean | ElementView.InteractivityOptions): void;

        protected renderMarkup(): void;
    }

    // dia.LinkView


    export namespace LinkView {

        interface InteractivityOptions {
            vertexAdd?: boolean,
            vertexMove?: boolean,
            vertexRemove?: boolean;
            arrowheadMove?: boolean;
            labelMove?: boolean;
            useLinkTools?: boolean;
        }

        interface GetConnectionPoint {
            (
                linkView: LinkView,
                view: ElementView,
                magnet: SVGElement,
                reference: Point,
                end: 'source' | 'target'
            ): Point;
        }
    }

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

        setInteractivity(value: boolean | LinkView.InteractivityOptions): void;

        protected onLabelsChange(link: Link, labels: Link.Label[], opt: { [key: string]: any }): void;

        protected onToolsChange(link: Link, toolsMarkup: string, opt: { [key: string]: any }): void;

        protected onVerticesChange(link: Link, vertices: Point[], opt: { [key: string]: any }): void;

        protected onSourceChange(element: Element, sourceEnd: any, opt: { [key: string]: any }): void;

        protected onTargetChange(element: Element, targetEnd: any, opt: { [key: string]: any }): void;
    }

    // dia.Paper

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
            linkConnectionPoint?: LinkView.GetConnectionPoint;
            drawGrid?: boolean | GridOptions | GridOptions[];
            background?: BackgroundOptions;
            async?: boolean | { batchSize: number };
            // interactions
            gridSize?: number;
            highlighting?: { [type: string]: highlighters.HighlighterJSON };
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
            elementView?: typeof ElementView | ((element: Element) => typeof ElementView);
            linkView?: typeof LinkView | ((link: Link) => typeof LinkView);
            // embedding
            embeddingMode?: boolean;
            findParentBy?: 'bbox' | 'center' | 'origin' | 'corner' | 'topRight' | 'bottomLeft';
            validateEmbedding?: (childView: ElementView, parentView: ElementView) => boolean;
            // default views, models & attributes
            cellViewNamespace?: any;
            highlighterNamespace?: any;
            defaultLink?: ((cellView: CellView, magnet: SVGElement) => Link) | Link;
            defaultRouter?: routers.Router | routers.RouterJSON;
            defaultConnector?: connectors.Connector | connectors.ConnectorJSON;
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
        clientToLocalPoint(point: Point): g.Point;

        clientToLocalRect(x: number, y: number, width: number, height: number): g.Rect;
        clientToLocalRect(rect: BBox): g.Rect;

        localToClientPoint(x: number, y: number): g.Point;
        localToClientPoint(point: Point): g.Point;

        localToClientRect(x: number, y: number, width: number, height: number): g.Rect;
        localToClientRect(rect: BBox): g.Rect;

        localToPagePoint(x: number, y: number): g.Point;
        localToPagePoint(point: Point): g.Point;

        localToPageRect(x: number, y: number, width: number, height: number): g.Rect;
        localToPageRect(rect: BBox): g.Rect;

        localToPaperPoint(x: number, y: number): g.Point;
        localToPaperPoint(point: Point): g.Point;

        localToPaperRect(x: number, y: number, width: number, height: number): g.Rect;
        localToPaperRect(rect: BBox): g.Rect;

        pageToLocalPoint(x: number, y: number): g.Point;
        pageToLocalPoint(point: Point): g.Point;

        pageToLocalRect(x: number, y: number, width: number, height: number): g.Rect;
        pageToLocalRect(rect: BBox): g.Rect;

        paperToLocalPoint(x: number, y: number): g.Point;
        paperToLocalPoint(point: Point): g.Point;

        paperToLocalRect(x: number, y: number, width: number, height: number): g.Rect;
        paperToLocalRect(x: BBox): g.Rect;

        snapToGrid(x: number, y: number): g.Point;
        snapToGrid(point: Point): g.Point;

        defineFilter(filter: { [key: string]: any }): string;

        defineGradient(gradient: Paper.GradientOptions): string;

        defineMarker(marker: { [key: string]: any }): string;

        isDefined(defId: string): boolean;

        getArea(): g.Rect;

        getRestrictedArea(): g.Rect | undefined;

        getContentBBox(): g.Rect;

        findView<T extends ElementView | LinkView>(element: string | JQuery | SVGElement): T;

        findViewByModel<T extends ElementView | LinkView>(model: Cell | string | number): T;

        findViewsFromPoint(point: string | Point): ElementView[];

        findViewsInArea(rect: BBox, opt?: { strict?: boolean }): ElementView[];

        fitToContent(opt?: Paper.FitToContentOptions): void;
        fitToContent(gridWidth?: number, gridHeight?: number, padding?: number, opt?: any): void;

        scaleContentToFit(opt?: Paper.ScaleContentOptions): void;

        cancelRenderViews(): void;

        drawBackground(opt?: Paper.BackgroundOptions): this;

        drawGrid(opt?: Paper.GridOptions | Paper.GridOptions[]): this;

        clearGrid(): this;

        getDefaultLink(cellView: CellView, magnet: SVGElement): Link;

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

        protected onCellHighlight(cellView: CellView, magnetEl: SVGElement, opt?: { highlighter?: highlighters.HighlighterJSON }): void;

        protected onCellUnhighlight(cellView: CellView, magnetEl: SVGElement, opt?: { highlighter?: highlighters.HighlighterJSON }): void;

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

    interface SVGTextSelector extends dia.Cell.Selectors {
        text?: attributes.SVGTextAttributes;
    }

    interface SVGRectSelector extends dia.Cell.Selectors {
        rect?: attributes.SVGRectAttributes;
    }

    interface SVGCircleSelector extends dia.Cell.Selectors {
        circle?: attributes.SVGCircleAttributes;
    }

    interface SVGEllipseSelector extends dia.Cell.Selectors {
        ellipse?: attributes.SVGEllipseAttributes;
    }

    interface SVGPolygonSelector extends dia.Cell.Selectors {
        polygon?: attributes.SVGPolygonAttributes;
    }

    interface SVGPolylineSelector extends dia.Cell.Selectors {
        polyline?: attributes.SVGPolylineAttributes;
    }

    interface SVGImageSelector extends dia.Cell.Selectors {
        image?: attributes.SVGImageAttributes;
    }

    interface SVGPathSelector extends dia.Cell.Selectors {
        path?: attributes.SVGPathAttributes;
    }

    namespace basic {

        class Generic extends dia.Element {

        }

        class Text extends Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<SVGTextSelector>,
                opt?: { [key: string]: any }
            );
        }

        interface RectSelectors extends SVGTextSelector, SVGRectSelector {

        }

        class Rect extends Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<RectSelectors>,
                opt?: { [key: string]: any }
            );
        }

        interface CircleSelectors extends SVGTextSelector, SVGCircleSelector {

        }

        class Circle extends Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<CircleSelectors>,
                opt?: { [key: string]: any }
            );
        }

        interface EllipseSelectors extends SVGTextSelector, SVGEllipseSelector {

        }


        class Ellipse extends Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<EllipseSelectors>,
                opt?: { [key: string]: any }
            );
        }

        interface PolygonSelectors extends SVGTextSelector, SVGPolygonSelector {

        }


        class Polygon extends Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<PolygonSelectors>,
                opt?: { [key: string]: any }
            );
        }

        interface PolylineSelectors extends SVGTextSelector, SVGPolylineSelector {

        }

        class Polyline extends Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<PolylineSelectors>,
                opt?: { [key: string]: any }
            );
        }

        interface ImageSelectors extends SVGTextSelector, SVGImageSelector {

        }

        class Image extends Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<ImageSelectors>,
                opt?: { [key: string]: any }
            );
        }

        interface PathSelectors extends SVGTextSelector, SVGPathSelector {

        }

        class Path extends Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<PathSelectors>,
                opt?: { [key: string]: any }
            );
        }

        class Rhombus extends Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<PathSelectors>,
                opt?: { [key: string]: any }
            );
        }

        interface TextBlockSelectors extends SVGTextSelector, SVGRectSelector {
            '.content'?: attributes.SVGTextAttributes;
        }

        class TextBlock extends Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<TextBlockSelectors>,
                opt?: { [key: string]: any }
            );
        }
    }

    namespace chess {

        class KingWhite extends basic.Generic {

        }

        class KingBlack extends basic.Generic {

        }

        class QueenWhite extends basic.Generic {

        }

        class QueenBlack extends basic.Generic {

        }

        class RookWhite extends basic.Generic {

        }

        class RookBlack extends basic.Generic {

        }

        class BishopWhite extends basic.Generic {

        }

        class BishopBlack extends basic.Generic {

        }

        class KnightWhite extends basic.Generic {

        }

        class KnightBlack extends basic.Generic {

        }

        class PawnWhite extends basic.Generic {

        }

        class PawnBlack extends basic.Generic {

        }
    }

    namespace devs {

        interface ModelSelectors extends dia.Cell.Selectors {
            '.label'?: attributes.SVGTextAttributes;
            '.body'?: attributes.SVGRectAttributes;
        }

        interface ModelAttributes extends dia.Element.GenericAttributes<ModelSelectors> {
            inPorts?: string[];
            outPorts?: string[];
        }

        class Model extends basic.Generic {

            constructor(attributes?: ModelAttributes, opt?: { [key: string]: any });

            changeInGroup(properties: any, opt?: any): boolean;

            changeOutGroup(properties: any, opt?: any): boolean;

            createPortItem(group: string, port: string): any;

            createPortItems(group: string, ports: string[]): any[];

            addOutPort(port: string, opt?: any): this;

            addInPort(port: string, opt?: any): this;

            removeOutPort(port: string, opt?: any): this;

            removeInPort(port: string, opt?: any): this;
        }

        class Coupled extends Model {

        }

        class Atomic extends Model {

        }

        class Link extends dia.Link {

        }
    }

    namespace erd {

        interface PolygonalSelectors extends dia.Cell.Selectors {
            '.label'?: attributes.SVGPolygonAttributes;
            '.body'?: attributes.SVGPolygonAttributes;
            'text'?: attributes.SVGTextAttributes;
        }

        interface EllipsoidSelectors extends dia.Cell.Selectors {
            '.label'?: attributes.SVGEllipseAttributes;
            '.body'?: attributes.SVGEllipseAttributes;
            'text'?: attributes.SVGTextAttributes;
        }

        class Entity extends basic.Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<PolygonalSelectors>,
                opt?: { [key: string]: any }
            );
        }

        class WeakEntity extends Entity {

        }

        class Relationship extends dia.Element {
            constructor(
                attributes?: dia.Element.GenericAttributes<PolygonalSelectors>,
                opt?: { [key: string]: any }
            );
        }

        class IdentifyingRelationship extends Relationship {

        }

        class Attribute extends dia.Element {
            constructor(
                attributes?: dia.Element.GenericAttributes<EllipsoidSelectors>,
                opt?: { [key: string]: any }
            );
        }

        class Multivalued extends Attribute {

        }

        class Derived extends Attribute {

        }

        class Key extends Attribute {

        }

        class Normal extends Attribute {

        }

        class ISA extends dia.Element {
            constructor(
                attributes?: dia.Element.GenericAttributes<basic.PolygonSelectors>,
                opt?: { [key: string]: any }
            );
        }

        class Line extends dia.Link {

            cardinality(value: string | number): void;
        }
    }

    namespace fsa {

        class State extends basic.Circle {

        }

        class StartState extends dia.Element {
            constructor(
                attributes?: dia.Element.GenericAttributes<SVGCircleSelector>,
                opt?: { [key: string]: any }
            );
        }

        interface CirculoidSelectors extends dia.Cell.Selectors {
            '.outer'?: attributes.SVGCircleAttributes;
            '.inner'?: attributes.SVGCircleAttributes;
        }

        class EndState extends dia.Element {
            constructor(
                attributes?: dia.Element.GenericAttributes<CirculoidSelectors>,
                opt?: { [key: string]: any }
            );
        }

        class Arrow extends dia.Link {

        }
    }

    namespace logic {

        abstract class Gate extends basic.Generic {

        }

        interface GateSelectors extends dia.Cell.Selectors {
            '.body'?: attributes.SVGRectAttributes;
            '.wire'?: attributes.SVGPathAttributes;
            'circle'?: attributes.SVGCircleAttributes;
            'text'?: attributes.SVGTextAttributes;
        }

        class IO extends Gate {
            constructor(
                attributes?: dia.Element.GenericAttributes<basic.CircleSelectors>,
                opt?: { [key: string]: any }
            );
        }

        class Input extends IO {

        }

        class Output extends IO {

        }

        interface Gate11Selectors extends dia.Cell.Selectors {
            '.input'?: attributes.SVGCircleAttributes;
            '.output'?: attributes.SVGCircleAttributes;
            '.body'?: attributes.SVGImageAttributes;
            'image'?: attributes.SVGImageAttributes;
        }

        class Gate11 extends Gate {
            constructor(
                attributes?: dia.Element.GenericAttributes<Gate11Selectors>,
                opt?: { [key: string]: any }
            );
        }

        interface Gate21Selectors extends dia.Cell.Selectors {
            '.input'?: attributes.SVGCircleAttributes;
            '.input1'?: attributes.SVGCircleAttributes;
            '.input2'?: attributes.SVGCircleAttributes;
            '.output'?: attributes.SVGCircleAttributes;
            '.body'?: attributes.SVGImageAttributes;
            'image'?: attributes.SVGImageAttributes;
        }

        class Gate21 extends Gate {
            constructor(
                attributes?: dia.Element.GenericAttributes<Gate21Selectors>,
                opt?: { [key: string]: any }
            );
        }

        class Repeater extends Gate11 {

            operation(input: any): any;
        }

        class Not extends Gate11 {

            operation(input: any): boolean;
        }

        class Or extends Gate21 {

            operation(input1: any, input2: any): boolean;
        }

        class And extends Gate21 {

            operation(input1: any, input2: any): boolean;
        }

        class Nor extends Gate21 {

            operation(input1: any, input2: any): boolean;
        }

        class Nand extends Gate21 {

            operation(input1: any, input2: any): boolean;
        }

        class Xor extends Gate21 {

            operation(input1: any, input2: any): boolean;
        }

        class Xnor extends Gate21 {

            operation(input1: any, input2: any): boolean;
        }

        class Wire extends dia.Link {

        }
    }

    namespace org {

        interface MemberSelectors extends dia.Cell.Selectors {
            '.card'?: attributes.SVGRectAttributes;
            '.rank'?: attributes.SVGTextAttributes;
            '.name'?: attributes.SVGTextAttributes;
            'image'?: attributes.SVGImageAttributes;
        }

        class Member extends dia.Element {
            constructor(
                attributes?: dia.Element.GenericAttributes<MemberSelectors>,
                opt?: { [key: string]: any }
            );
        }

        class Arrow extends dia.Link {

        }
    }

    namespace pn {

        class Place extends basic.Generic {
            constructor(attributes?: dia.Element.Attributes, opt?: { [key: string]: any });
        }

        class PlaceView extends dia.ElementView {
            renderTokens(): void;
        }

        class Transition extends basic.Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<SVGRectSelector>,
                opt?: { [key: string]: any }
            );
        }

        class Link extends dia.Link {

        }
    }

    namespace uml {

        interface ClassAttributes extends dia.Element.GenericAttributes<SVGRectSelector> {
            name: string[];
            attributes: string[];
            methods: string[];
        }

        class Class extends basic.Generic {

            constructor(attributes?: ClassAttributes, opt?: { [key: string]: any });

            getClassName(): string[];

            protected updateRectangles(): void;
        }

        class ClassView extends dia.ElementView {

        }

        class Abstract extends Class {
            constructor(attributes?: ClassAttributes, opt?: { [key: string]: any });
        }

        class AbstractView extends ClassView {
            constructor(attributes?: ClassAttributes, opt?: { [key: string]: any });
        }

        class Interface extends Class {
            constructor(attributes?: ClassAttributes, opt?: { [key: string]: any });
        }

        class InterfaceView extends ClassView {
            constructor(attributes?: ClassAttributes, opt?: { [key: string]: any });
        }

        class Generalization extends dia.Link {

        }

        class Implementation extends dia.Link {

        }

        class Aggregation extends dia.Link {

        }

        class Composition extends dia.Link {

        }

        class Association extends dia.Link {

        }

        interface StateSelectors extends dia.Cell.Selectors {
            '.uml-state-body'?: attributes.SVGRectAttributes;
            '.uml-state-separator'?: attributes.SVGPathAttributes;
            '.uml-state-name'?: attributes.SVGTextAttributes;
            '.uml-state-events'?: attributes.SVGTextAttributes;
        }

        class State extends basic.Generic {

            constructor(
                attributes?: dia.Element.GenericAttributes<StateSelectors>,
                opt?: { [key: string]: any }
            );

            protected updateName(): void;

            protected updateEvents(): void;

            protected updatePath(): void;
        }

        class StartState extends basic.Circle {
            constructor(
                attributes?: dia.Element.GenericAttributes<basic.CircleSelectors>,
                opt?: { [key: string]: any }
            );
        }

        interface EndStateSelectors extends dia.Cell.Selectors {
            'circle.outer'?: attributes.SVGCircleAttributes;
            'circle.inner'?: attributes.SVGCircleAttributes;
        }

        class EndState extends basic.Generic {
            constructor(
                attributes?: dia.Element.GenericAttributes<EndStateSelectors>,
                opt?: { [key: string]: any }
            );
        }

        class Transition extends dia.Link {

        }
    }
}

// util

export namespace util {

    export function hashCode(str: string): string;

    export function getByPath(object: { [key: string]: any }, path: string | string[], delim?: string): any;

    export function setByPath(object: { [key: string]: any }, path: string | string[], value: any, delim?: string): any;

    export function unsetByPath(object: { [key: string]: any }, path: string | string[], delim?: string): any;

    export function flattenObject(object: { [key: string]: any }, delim?: string, stop?: (node: any) => boolean): any;

    export function uuid(): string;

    export function guid(obj?: { [key: string]: any }): string;

    export function toKebabCase(str: string): string;

    export function normalizeEvent(evt: JQuery.Event): JQuery.Event;

    export function nextFrame(callback: () => void, context?: { [key: string]: any }): number;

    export function cancelFrame(requestId: number): void;

    export var shapePerimeterConnectionPoint: dia.LinkView.GetConnectionPoint;

    export function parseCssNumber(str: string, restrictUnits?: string[]): { value: number; unit?: string; };

    export function breakText(text: string, size: dia.Size, attrs?: attributes.NativeSVGAttributes, opt?: { svgDocument?: SVGElement }): string;

    export function imageToDataUri(url: string, callback: (err: Error, dataUri: string) => void): void;

    export function getElementBBox(el: Element): dia.BBox;

    export function sortElements(
        elements: Element[] | string | JQuery,
        comparator: (a: Element, b: Element) => number
    ): Element[];

    export function setAttributesBySelector(el: Element, attrs: { [selector: string]: { [attribute: string]: any } }): void;

    export function normalizeSides(sides: number | { top?: number, bottom?: number, left?: number, right?: number }): dia.PaddingJSON;

    export function template(html: string): (data: any) => string;

    export function toggleFullScreen(el?: Element): void;

    export namespace timing {

        type TimingFunction = (time: number) => number;

        export var linear: TimingFunction;
        export var quad: TimingFunction;
        export var cubic: TimingFunction;
        export var inout: TimingFunction;
        export var exponential: TimingFunction;
        export var bounce: TimingFunction;

        export function reverse(f: TimingFunction): TimingFunction;

        export function reflect(f: TimingFunction): TimingFunction;

        export function clamp(f: TimingFunction, min?: number, max?: number): TimingFunction;

        export function back(s?: number): TimingFunction;

        export function elastic(x?: number): TimingFunction;
    }

    export namespace interpolate {

        type InterpolateFunction<T> = (start: T, end: T) => ((time: number) => T);

        export var number: InterpolateFunction<number>;
        export var object: InterpolateFunction<{ [key: string]: any }>;
        export var hexColor: InterpolateFunction<string>;
        export var unit: InterpolateFunction<string>;
    }

    export namespace filter {

        interface FilterArgumentsMap {
            'outline': {
                color?: string;
                opacity?: number;
                margin?: number;
                width?: number;
            };
            'highlight': {
                color?: string;
                blur?: number;
                opacity?: number;
                width?: number;
            };
            'blur': {
                x?: number;
                y?: number;
            };
            'dropShadow': {
                dx?: number;
                dy?: number;
                opacity?: number;
                color?: string;
                blur?: number;
            };
            'grayscale': {
                amount?: number;
            };
            'sepia': {
                amount?: number;
            };
            'saturate': {
                amount?: number;
            };
            'hueRotate': {
                angle?: number;
            };
            'invert': {
                amount?: number;
            };
            'brightness': {
                amount?: number;
            };
            'contrast': {
                amount?: number;
            };
        }

        type FilterFunction<K extends keyof FilterArgumentsMap> = (args: FilterArgumentsMap[K]) => string;

        export var outline: FilterFunction<'outline'>;
        export var highlight: FilterFunction<'highlight'>;
        export var blur: FilterFunction<'blur'>;
        export var dropShadow: FilterFunction<'dropShadow'>;
        export var grayscale: FilterFunction<'grayscale'>;
        export var sepia: FilterFunction<'sepia'>;
        export var saturate: FilterFunction<'saturate'>;
        export var hueRotate: FilterFunction<'hueRotate'>;
        export var invert: FilterFunction<'invert'>;
        export var brightness: FilterFunction<'brightness'>;
        export var contrast: FilterFunction<'contrast'>;
    }

    namespace format {

        interface NumberLocale {
            currency: [string, string],
            decimal: string,
            thousands: string,
            grouping: number[]
        }

        export function number(specifier: string, value: number, locale?: NumberLocale): string;

        export function string(str: string, value: string): string;

        export function convert(type: string, value: number, precision: number): string;

        export function round(value: number, precision?: number): number

        export function precision(value: number, precision: number): number;

        export function prefix(value: number, precision: number): { scale: (d: number) => number; symbol: string; } | undefined
    }

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

// env

export namespace env {

    export function addTest(name: string, fn: () => boolean): void;

    export function test(name: string): boolean;
}

// layout

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

// mvc

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

// routers

export namespace routers {

    interface NormalRouterArguments {

    }

    interface ManhattanRouterArguments {
        excludeTypes?: string[];
        excludeEnds?: 'source' | 'target';
        startDirections?: ['left' | 'right' | 'top' | 'bottom'];
        endDirections?: ['left' | 'right' | 'top' | 'bottom'];
        step?: number;
        maximumLoops?: number;
    }

    interface OrthogonalRouterArguments {
        elementPadding?: number;
    }

    interface OneSideRouterArguments {
        side?: 'bottom' | 'top' | 'left' | 'right';
        padding?: number;
    }

    interface RouterArgumentsMap {
        'normal': NormalRouterArguments;
        'manhattan': ManhattanRouterArguments;
        'metro': ManhattanRouterArguments;
        'orthogonal': OrthogonalRouterArguments;
        'oneSide': OneSideRouterArguments;
    }

    type RouterType = string & keyof RouterArgumentsMap;

    interface GenericRouter<K extends RouterType> {
        (
            points: dia.Point[],
            args?: RouterArgumentsMap[K],
            linkView?: dia.LinkView
        ): dia.Point[];
    }

    interface GenericRouterJSON<K extends RouterType> {
        name: K;
        args?: RouterArgumentsMap[K];
    }

    type Router = GenericRouter<RouterType>;

    type RouterJSON = GenericRouterJSON<RouterType>;

    export var manhattan: GenericRouter<'manhattan'>;
    export var metro: GenericRouter<'metro'>;
    export var normal: GenericRouter<'normal'>;
    export var orthogonal: GenericRouter<'orthogonal'>;
    export var oneSide: GenericRouter<'oneSide'>;
}

// connectors

export namespace connectors {

    interface NormalConnectorArguments {

    }

    interface RoundedConnectorArguments {
        radius?: number
    }

    interface SmoothConnectorArguments {

    }

    interface JumpOverConnectorArguments {
        size?: number;
        jump?: 'arc' | 'gap' | 'cubic'
    }

    interface ConnectorArgumentsMap {
        'normal': NormalConnectorArguments;
        'rounded': RoundedConnectorArguments;
        'smooth': SmoothConnectorArguments;
        'jumpover': JumpOverConnectorArguments;
    }

    type ConnectorType = string & keyof ConnectorArgumentsMap;

    interface GenericConnector<K extends ConnectorType> {
        (
            sourcePoint: dia.Point,
            targetPoint: dia.Point,
            vertices: dia.Point[],
            args?: ConnectorArgumentsMap[K],
            linkView?: dia.LinkView
        ): string;
    }

    interface GenericConnectorJSON<K extends ConnectorType> {
        name: K;
        args?: ConnectorArgumentsMap[K];
    }

    type Connector = GenericConnector<ConnectorType>;

    type ConnectorJSON = GenericConnectorJSON<ConnectorType>;

    export var normal: GenericConnector<'normal'>;
    export var rounded: GenericConnector<'rounded'>;
    export var smooth: GenericConnector<'smooth'>;
    export var jumpover: GenericConnector<'jumpover'>;
}

// highlighters

export namespace highlighters {

    interface AddClassHighlighterArguments {
        className?: string;
    }

    interface OpacityHighlighterArguments {

    }

    interface StrokeHighlighterArguments {
        padding?: number;
        rx?: number;
        ry?: number;
        attrs?: attributes.NativeSVGAttributes;
    }

    interface HighlighterArgumentsMap {
        'addClass': AddClassHighlighterArguments;
        'opacity': OpacityHighlighterArguments;
        'stroke': StrokeHighlighterArguments;
    }

    type HighlighterType = string & keyof HighlighterArgumentsMap;

    interface GenericHighlighterJSON<K extends HighlighterType> {
        name: K;
        options?: HighlighterArgumentsMap[K];
    }

    interface GenericHighlighter<K extends HighlighterType> {
        highlight(cellView: dia.CellView, magnetEl: SVGElement, opt?: HighlighterArgumentsMap[K]): void;

        unhighlight(cellView: dia.CellView, magnetEl: SVGElement, opt?: HighlighterArgumentsMap[K]): void;
    }

    type Highlighter = GenericHighlighter<HighlighterType>;

    type HighlighterJSON = GenericHighlighterJSON<HighlighterType>;

    export var addClass: GenericHighlighter<'addClass'>;
    export var opacity: GenericHighlighter<'opacity'>;
    export var stroke: GenericHighlighter<'stroke'>;
}

export namespace attributes {

    interface SVGCoreAttributes {
        'id'?: string;
        'xml:base'?: string;
        'xml:lang'?: string;
        'xml:space'?: string;
        'tabindex'?: number;
    }

    interface SVGConditionalProcessingAttributes {
        'requiredExtensions'?: boolean;
        'requiredFeatures'?: string;
        'systemLanguage'?: string;
    }

    interface SVGXLinkAttributes {
        'xlink:href'?: string;
        'xlink:type'?: string;
        'xlink:role'?: string;
        'xlink:arcrole'?: string;
        'xlink:title'?: string;
        'xlink:show'?: string;
        'xlink:actuate'?: string;
    }

    interface SVGPresentationAttributes {
        'alignment-baseline'?: any;
        'baseline-shift'?: any;
        'clip'?: any;
        'clip-path'?: any;
        'clip-rule'?: any;
        'color'?: any;
        'color-interpolation'?: any;
        'color-interpolation-filters'?: any;
        'color-profile'?: any;
        'color-rendering'?: any;
        'cursor'?: any;
        'direction'?: any;
        'display'?: any;
        'dominant-baseline'?: any;
        'enable-background'?: any;
        'fill'?: any;
        'fill-opacity'?: any;
        'fill-rule'?: any;
        'filter'?: any;
        'flood-color'?: any;
        'flood-opacity'?: any;
        'font-family'?: any;
        'font-size'?: any;
        'font-size-adjust'?: any;
        'font-stretch'?: any;
        'font-style'?: any;
        'font-variant'?: any;
        'font-weight'?: any;
        'glyph-orientation-horizontal'?: any;
        'glyph-orientation-vertical'?: any;
        'image-rendering'?: any;
        'kerning'?: any;
        'letter-spacing'?: any;
        'lighting-color'?: any;
        'marker-end'?: any;
        'marker-mid'?: any;
        'marker-start'?: any;
        'mask'?: any;
        'opacity'?: any;
        'overflow'?: any;
        'pointer-events'?: any;
        'shape-rendering'?: any;
        'stop-color'?: any;
        'stop-opacity'?: any;
        'stroke'?: any;
        'stroke-dasharray'?: any;
        'stroke-dashoffset'?: any;
        'stroke-linecap'?: any;
        'stroke-linejoin'?: any;
        'stroke-miterlimit'?: any;
        'stroke-opacity'?: any;
        'stroke-width'?: any;
        'text-anchor'?: any;
        'text-decoration'?: any;
        'text-rendering'?: any;
        'unicode-bidi'?: any;
        'visibility'?: any;
        'word-spacing'?: any;
        'writing-mode'?: any;
    }

    interface NativeSVGAttributes extends SVGCoreAttributes, SVGPresentationAttributes, SVGConditionalProcessingAttributes, SVGXLinkAttributes {
        'class'?: string;
        'style'?: string;
        'transform'?: string;
        'externalResourcesRequired'?: boolean;

        [key: string]: any;
    }

    interface SVGAttributes extends NativeSVGAttributes {
        // Special attributes
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
        // CamelCase variants of native attributes
        alignmentBaseline?: any;
        baselineShift?: any;
        clipPath?: any;
        clipRule?: any;
        colorInterpolation?: any;
        colorInterpolationFilters?: any;
        colorProfile?: any;
        colorRendering?: any;
        dominantBaseline?: any;
        enableBackground?: any;
        fillOpacity?: any;
        fillRule?: any;
        floodColor?: any;
        floodOpacity?: any;
        fontFamily?: any;
        fontSize?: any;
        fontSizeAdjust?: any;
        fontStretch?: any;
        fontStyle?: any;
        fontVariant?: any;
        fontWeight?: any;
        glyphOrientationHorizontal?: any;
        glyphOrientationVertical?: any;
        imageRendering?: any;
        letterSpacing?: any;
        lightingColor?: any;
        markerEnd?: any;
        markerMid?: any;
        markerStart?: any;
        pointerEvents?: any;
        shapeRendering?: any;
        stopColor?: any;
        stopOpacity?: any;
        strokeDasharray?: any;
        strokeDashoffset?: any;
        strokeLinecap?: any;
        strokeLinejoin?: any;
        strokeMiterlimit?: any;
        strokeOpacity?: any;
        strokeWidth?: any;
        textAnchor?: any;
        textDecoration?: any;
        textRendering?: any;
        unicodeBidi?: any;
        wordSpacing?: any;
        writingMode?: any;
        xlinkHref?: string;
        xlinkShow?: string;
        xlinkType?: string;
        xlinkRole?: string;
        xlinkArcrole?: string;
        xlinkTitle?: string;
        xlinkActuate?: string;
        xmlSpace?: string;
        xmlBase?: string;
        xmlLang?: string;
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

    interface SVGTextAttributes extends SVGAttributes {
        x?: string | number;
        y?: string | number;
        dx?: string | number;
        dy?: string | number;
        rotate?: string;
        textAnchor?: string;
        textLength?: number;
        lengthAdjust?: string;
        'text-anchor'?: string;
        'text-lenght'?: number;
        'length-adjust'?: string;
    }

    interface SVGRectAttributes extends SVGAttributes {
        x?: string | number;
        y?: string | number;
        width?: string | number;
        height?: string | number;
        ry?: string | number;
        rx?: string | number;
    }

    interface SVGCircleAttributes extends SVGAttributes {
        cx?: string | number;
        cy?: string | number;
        r?: string | number;
    }

    interface SVGEllipseAttributes extends SVGAttributes {
        cx?: string | number;
        cy?: string | number;
        rx?: string | number;
        ry?: string | number;
    }

    interface SVGPolygonAttributes extends SVGAttributes {
        points?: string;
    }

    interface SVGPolylineAttributes extends SVGAttributes {
        points?: string;
    }

    interface SVGImageAttributes extends SVGAttributes {
        x?: string | number;
        y?: string | number;
        width?: string | number;
        height?: string | number;
        preserveAspectRatio?: string;
    }

    interface SVGPathAttributes extends SVGAttributes {
        d?: string;
        pathLength?: number;
        'path-length'?: number;
    }

}

export function setTheme(theme: string): void;
