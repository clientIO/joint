import type * as g from './geometry';
import type * as mvc from './mvc';
import type { Vectorizer } from './vectorizer';
import type * as util from './util';
import type * as attributes from './attributes';
import type * as routers from './routers';
import type * as connectors from './connectors';
import type * as anchors from './anchors';
import type * as connectionPoints from './connectionPoints';
import type * as connectionStrategies from './connectionStrategies';
import type * as highlighters from './highlighters';
import type * as layout from './layout';
import type { DOMElement, LiteralUnion, ExcludeIndexSignature, DeepPartial, Nullable } from './internal';

export type { attributes };

export type Event = mvc.TriggeredEvent;

export type ObjectHash = { [key: string]: any };

export type Point = g.PlainPoint;

export type BBox = g.PlainRect;

export type Size = Pick<BBox, 'width' | 'height'>;

export type PaddingJSON = {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
};

export type Padding = number | PaddingJSON;

export type SidesJSON = {
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;
    horizontal?: number;
    vertical?: number;
};

export type LegacyPositionName = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' |
    'topMiddle' | 'bottomMiddle' | 'leftMiddle' | 'rightMiddle' |
    'corner' | 'origin';

export type PositionName = 'top' | 'left' | 'bottom' | 'right' | 'center' |
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' |
    LegacyPositionName;

export type Sides = number | SidesJSON;

export type OrthogonalDirection =
    'left' | 'top' | 'right' | 'bottom';

export type DiagonalDirection =
    'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

export type Direction = OrthogonalDirection | DiagonalDirection;

export type LinkEnd =
    'source' | 'target';

export type MarkupNodeJSON = {
    tagName: string;
    selector?: string;
    groupSelector?: string | string[];
    namespaceURI?: string;
    className?: string;
    attributes?: attributes.NativeSVGAttributes;
    style?: { [key: string]: any };
    children?: MarkupJSON;
    textContent?: string;
};

export type MarkupJSON = Array<MarkupNodeJSON | string>;

export type Path = string | Array<string | number>;

export interface ModelSetOptions extends mvc.ModelSetOptions {
    dry?: boolean;
    isolate?: boolean;
    [key: string]: any;
}

export interface CollectionAddOptions extends mvc.AddOptions {
    dry?: boolean;
    [key: string]: any;
}

export interface SVGPatternJSON {
    id?: string;
    type: 'pattern';
    attrs?: attributes.NativeSVGAttributes;
    markup: string | MarkupJSON;
}

export interface SVGGradientJSON {
    id?: string;
    type: 'linearGradient' | 'radialGradient';
    attrs?: attributes.NativeSVGAttributes;
    stops: Array<{
        offset: number | string;
        color: string;
        opacity?: number;
    }>;
}

export type SVGMarkerJSON = SVGComplexMarkerJSON | SVGSimpleMarkerJSON;

export interface SVGComplexMarkerJSON {
    id?: string;
    markup: string | MarkupJSON;
    attrs?: attributes.NativeSVGAttributes;
}

export interface SVGSimpleMarkerJSON extends attributes.NativeSVGAttributes {
    id?: string;
    type?: string;
    /**
     * @deprecated use `attrs` instead
     */
    markerUnits?: string;
}

export type SVGFilterJSON =
    util.filter.FilterJSON<'outline'> |
    util.filter.FilterJSON<'highlight'> |
    util.filter.FilterJSON<'blur'> |
    util.filter.FilterJSON<'dropShadow'> |
    util.filter.FilterJSON<'grayscale'> |
    util.filter.FilterJSON<'sepia'> |
    util.filter.FilterJSON<'saturate'> |
    util.filter.FilterJSON<'hueRotate'> |
    util.filter.FilterJSON<'invert'> |
    util.filter.FilterJSON<'brightness'> |
    util.filter.FilterJSON<'contrast'>;

export class CellCollection<C extends Cell = Cell> extends mvc.Collection<C> {

    /** @deprecated Use graph.getCellNamespace() instead. */
    readonly cellNamespace: any;
    layer: GraphLayer;

    minZIndex(): number;

    maxZIndex(): number;
}

export class GraphLayerCollection<L extends GraphLayer = GraphLayer> extends mvc.Collection<L> {

    cellNamespace: any;
    layerNamespace: any;
    graph: Graph;

    insert(layer: Graph.LayerInit, beforeId: GraphLayer.ID | null, opt?: ObjectHash): void;

    getTypeConstructor<T extends Cell = Cell>(type: string): Cell.Constructor<T> | null;

    getCell(cellRef: Graph.CellRef): Cell | undefined;

    getCells(): Cell[];

    removeCell(cell: Cell, opt?: ObjectHash): void;

    moveCellBetweenLayers(cell: Cell, targetLayerId: GraphLayer.ID, opt?: ObjectHash): void;

    addCellToLayer(cell: Cell, layerId: GraphLayer.ID, opt?: ObjectHash): void;
}

export class GraphLayersController extends mvc.Listener<[]> {

    graph: Graph;

    layerCollection: GraphLayerCollection;

    startListening(): void;

    protected onCellChange(cell: Cell, opt: ObjectHash): void;

    protected onCellRemove(cell: Cell, opt: ObjectHash): void;

    protected onLayerCollectionEvent(eventName: string, ...args: any[]): void;

    protected forwardLayerEvent(...args: any[]): void;

    protected forwardCellEvent(...args: any[]): void;

    protected forwardCellCollectionEvent(...args: any[]): void;

    protected forwardLayerCollectionEvent(...args: any[]): void;
}

export class GraphTopologyIndex extends mvc.Listener<[]> {

    layerCollection: GraphLayerCollection;

    startListening(): void;

    getOutboundEdges(id: Cell.ID): { [edgeId: string]: true };

    getInboundEdges(id: Cell.ID): { [edgeId: string]: true };

    getSinkNodes(): string[];

    getSourceNodes(): string[];

    isSinkNode(id: Cell.ID): boolean;

    isSourceNode(id: Cell.ID): boolean;

    protected initializeIndex(): void;

    protected _restructureOnReset(): void;

    protected _restructureOnAdd(cell: Cell): void;

    protected _restructureOnRemove(cell: Cell): void;

    protected _restructureOnChangeSource(cell: Cell): void;

    protected _restructureOnChangeTarget(cell: Cell): void;
}

export class GraphHierarchyIndex extends mvc.Listener<[]> {

    layerCollection: GraphLayerCollection;

    startListening(): void;

    getChildrenIds(parentId: Cell.ID): Cell.ID[];

    hasChildren(parentId: Cell.ID): boolean;

    protected initializeIndex(): void;

    protected _restructureOnReset(): void;

    protected _restructureOnAdd(cell: Cell): void;

    protected _restructureOnRemove(cell: Cell): void;

    protected _restructureOnChangeParent(cell: Cell): void;

    protected _addChild(parentId: Cell.ID, childId: Cell.ID): void;

    protected _removeChild(parentId: Cell.ID, childId: Cell.ID): void;
}

export namespace Graph {

    interface Options {
        [key: string]: any;
    }

    interface ConnectionOptions extends Cell.EmbeddableOptions {
        inbound?: boolean;
        outbound?: boolean;
    }

    interface ExploreOptions extends ConnectionOptions {
        breadthFirst?: boolean;
    }

    interface FindAtPointOptions extends Options {
        strict?: boolean;
    }

    interface FindInAreaOptions extends Options {
        strict?: boolean;
    }

    interface SyncCellOptions extends Options {
        remove?: boolean;
    }

    interface RemoveCellOptions extends Options {
        disconnectLinks?: boolean;
        replace?: boolean;
        clear?: boolean;
    }

    type SearchByKey = 'bbox' | PositionName;

    interface FindUnderElementOptions extends FindInAreaOptions, FindAtPointOptions {
        searchBy?: SearchByKey;
    }

    type Cells = CellCollection;

    type CellInit = Cell | Cell.JSON;

    type CellRef = Cell | Cell.ID;

    type LayerInit = GraphLayer | GraphLayer.Attributes;

    type LayerRef = GraphLayer | GraphLayer.ID;

    interface Attributes {
        /** @deprecated use cellsCollection property **/
        cells?: CellCollection;
        [key: string]: any;
    }

    interface JSON {
        cells: Array<Cell.JSON>;
        layers?: Array<GraphLayer.Attributes>;
        defaultLayer?: string;
        [key: string]: any;
    }

    interface InsertLayerOptions extends Options {
        before?: GraphLayer.ID | null;
        index?: number;
    }

    interface EventMap {
        // cell collection events
        'add': (cell: Cell, collection: mvc.Collection<Cell>, options: Options) => void;
        'remove': (cell: Cell, collection: mvc.Collection<Cell>, options: Options) => void;
        'reset': (collection: mvc.Collection<Cell>, options: Options) => void;
        'sort': (collection: mvc.Collection<Cell>, options: Options) => void;
        'update': (collection: mvc.Collection<Cell>, options: Options) => void;
        // cell events
        'change': (cell: Cell, options: Options) => void;
        [changeEvent: `change:${string}`]: (cell: Cell, newValue: any, options: Options) => void;
        'move': (cell: Cell, options: Options) => void;
        'changeId': (cell: Cell, previousId: Cell.ID, options: Options) => void;
        // layer events
        'layer:add': (layer: GraphLayer, collection: GraphLayerCollection, options: Options) => void;
        'layer:remove': (layer: GraphLayer, collection: GraphLayerCollection, options: Options) => void;
        'layer:change': (layer: GraphLayer, options: Options) => void;
        [layerChangeEvent: `layer:change:${string}`]: (layer: GraphLayer, newValue: any, options: Options) => void;
        'layer:default': (layer: GraphLayer, options: Options) => void;
        'layers:sort': (collection: GraphLayerCollection, options: Options) => void;
        // batch
        'batch:start': (data: Options) => void;
        'batch:stop': (data: Options) => void;
        // custom
        [eventName: string]: mvc.EventHandler;
    }
}

export class Graph<A extends ObjectHash = Graph.Attributes, S = ModelSetOptions> extends mvc.Model<A, S> {

    layerCollection: GraphLayerCollection;

    defaultLayerId: GraphLayer.ID;

    layersController: GraphLayersController;

    topologyIndex: GraphTopologyIndex;

    hierarchyIndex: GraphHierarchyIndex;

    constructor(attributes?: Graph.Attributes, opt?: {
        cellNamespace?: any,
        layerNamespace?: any,
        ignoreLayers?: boolean,
        /** @deprecated use cellNamespace instead */
        cellModel?: typeof Cell
    });

    // events

    on<T extends keyof Graph.EventMap>(
        eventName: T,
        callback: Graph.EventMap[T],
        context?: any
    ): this;
    on(
        eventName: LiteralUnion<keyof ExcludeIndexSignature<Graph.EventMap>>,
        callback: mvc.EventHandler,
        context?: any
    ): this;

    on<E extends Partial<Graph.EventMap>>(
        events: E,
        context?: any
    ): this;

    addCell(cell: Graph.CellInit, opt?: CollectionAddOptions): this;
    addCell(cell: Array<Graph.CellInit>, opt?: CollectionAddOptions): this;

    addCells(cells: Array<Graph.CellInit>, opt?: CollectionAddOptions): this;

    removeCell(cell: Graph.CellRef, opt?: Graph.RemoveCellOptions): void;

    removeCells(cells: Array<Graph.CellRef>, opt?: Graph.RemoveCellOptions): this;

    resetCells(cells: Array<Graph.CellInit>, opt?: Graph.Options): this;

    syncCells(cells: Array<Graph.CellInit>, opt?: Graph.SyncCellOptions): void;

    addLayer(layerInit: Graph.LayerInit, opt?: Graph.InsertLayerOptions): void;

    moveLayer(layerRef: Graph.LayerRef, opt?: Graph.InsertLayerOptions): void;

    removeLayer(layerRef: Graph.LayerRef, opt?: Graph.Options): void;

    getDefaultLayer(): GraphLayer;

    setDefaultLayer(id: string, opt?: Graph.Options): void;

    getLayer(id: string): GraphLayer;

    hasLayer(id: string): boolean;

    getLayers(): GraphLayer[];

    getCellLayerId(cell: Graph.CellRef): GraphLayer.ID;

    getCellNamespace(): Record<string, any>;

    setCellNamespace(namespace: Record<string, any>): void;

    getTypeConstructor<T extends Cell = Cell>(type: string): Cell.Constructor<T> | null;

    getTypeDefaults(type: string): Cell.Attributes;

    getCell(id: Graph.CellRef): Cell;

    getElements(): Element[];

    getLinks(): Link[];

    getCells(): Cell[];

    getFirstCell(layerId?: string): Cell | undefined;

    getLastCell(layerId?: string): Cell | undefined;

    getConnectedLinks(cell: Cell, opt?: Graph.ConnectionOptions): Link[];

    disconnectLinks(cell: Cell, opt?: S): void;

    removeLinks(cell: Graph.CellRef, opt?: Graph.RemoveCellOptions): void;

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

    toJSON(opt?: { cellAttributes?: Cell.ExportOptions }): any;

    fromJSON(json: any, opt?: S): this;

    clear(opt?: { [key: string]: any }): this;

    findElementsAtPoint(p: Point, opt?: Graph.FindAtPointOptions): Element[];

    findElementsInArea(rect: BBox, opt?: Graph.FindInAreaOptions): Element[];

    findElementsUnderElement(element: Element, opt?: Graph.FindUnderElementOptions): Element[];

    findLinksAtPoint(p: Point, opt?: Graph.FindAtPointOptions): Link[];

    findLinksInArea(rect: BBox, opt?: Graph.FindInAreaOptions): Link[];

    findLinksUnderElement(element: Element, opt?: Graph.FindUnderElementOptions): Link[];

    findCellsAtPoint(p: Point, opt?: Graph.FindAtPointOptions): Cell[];

    findCellsInArea(rect: BBox, opt?: Graph.FindInAreaOptions): Cell[];

    findCellsUnderElement(element: Element, opt?: Graph.FindUnderElementOptions): Cell[];

    protected _getFindUnderElementGeometry(element: Element, searchBy: Graph.SearchByKey): g.Point | g.Rect;

    protected _validateCellsUnderElement<T extends Cell[]>(cells: T, element: Element): T;

    protected _isValidElementUnderElement(el1: Element, el2: Element): boolean;

    protected _isValidLinkUnderElement(link: Link, element: Element): boolean;

    protected _filterCellsUnderElement(cells: Cell[], element: Element, opt: Graph.FindUnderElementOptions): Cell[];

    protected _syncCell(cellInit: Graph.CellInit, opt?: Graph.Options): void;

    protected _replaceCell(currentCell: Cell, newCellInit: Graph.CellInit,  opt?: Graph.Options): void;

    protected _resetLayers(layers: Array<Graph.LayerInit>, defaultLayerId: GraphLayer.ID | null, opt?: Graph.Options): this;

    /** @deprecated use `findElementsAtPoint` instead */
    findModelsFromPoint(p: Point): Element[];

    /** @deprecated use `findElementsInArea` instead */
    findModelsInArea(rect: BBox, opt?: Graph.FindInAreaOptions): Element[];

    /** @deprecated use `findElementsUnderElement` instead */
    findModelsUnderElement(element: Element, opt?: Graph.FindUnderElementOptions): Element[];

    getBBox(): g.Rect | null;

    getCellsBBox(cells: Cell[], opt?: Cell.EmbeddableOptions): g.Rect | null;

    hasActiveBatch(name?: string | string[]): boolean;

    maxZIndex(layerId?: GraphLayer.ID): number;

    minZIndex(layerId?: GraphLayer.ID): number;

    transferCellEmbeds(sourceCell: Cell, targetCell: Cell, opt?: S): void;

    transferCellConnectedLinks(sourceCell: Cell, targetCell: Cell, opt?: Graph.ConnectionOptions): void;

    resize(width: number, height: number, opt?: S): this;

    resizeCells(width: number, height: number, cells: Cell[], opt?: S): this;

    startBatch(name: string, data?: { [key: string]: any }): this;

    stopBatch(name: string, data?: { [key: string]: any }): this;
}

// dia.Cell

export namespace Cell {

    type ID = string | number;

    interface GenericAttributes<T> {
        attrs?: T;
        z?: number;
        layer?: string;
        [key: string]: any;
    }

    interface Selectors {
        [selector: string]: Nullable<attributes.SVGAttributes> | undefined;
    }

    interface Attributes extends GenericAttributes<Selectors> {
    }

    type JSON<K extends Selectors = Selectors, T extends GenericAttributes<K> = GenericAttributes<K>> = T & {
        [attribute in keyof T]: T[attribute];
    } & {
        id: ID;
        type: string;
    };

    interface Constructor<T extends mvc.Model> {
        new(opt?: { id?: ID, [key: string]: any }): T;
        define(type: string, defaults?: any, protoProps?: any, staticProps?: any): Cell.Constructor<T>;
    }

    interface Options {
        [key: string]: any;
    }

    interface EmbedOptions extends Options {
        reparent?: boolean;
    }

    interface EmbeddableOptions<T = boolean> extends Options {
        deep?: T;
    }

    type DisconnectableOptions = Graph.RemoveCellOptions;

    interface GetEmbeddedCellsOptions extends EmbeddableOptions {
        breadthFirst?: boolean;
        sortSiblings?: boolean;
    }

    interface ToFrontAndBackOptions extends GetEmbeddedCellsOptions {
        foregroundEmbeds?: boolean;
    }

    interface TransitionOptions extends Options {
        delay?: number;
        duration?: number;
        timingFunction?: util.timing.TimingFunction;
        valueFunction?: util.interpolate.InterpolateFunction<any>;
    }

    interface ConstructorOptions extends Graph.Options {
        mergeArrays?: boolean;
    }

    interface ExportOptions {
        ignoreDefaults?: boolean | string[];
        ignoreEmptyAttributes?: boolean;
    }

    type UnsetCallback<V> = (
        this: V,
        node: DOMElement,
        nodeAttributes: { [name: string]: any },
        cellView: V
    ) => string | Array<string> | null | void;

    type SetCallback<V> = (
        this: V,
        attributeValue: any,
        refBBox: g.Rect,
        node: DOMElement,
        nodeAttributes: { [name: string]: any },
        cellView: V
    ) => { [key: string]: any } | string | number | void;

    type PositionCallback<V> = (
        this: V,
        attributeValue: any,
        refBBox: g.Rect,
        node: DOMElement,
        nodeAttributes: { [name: string]: any },
        cellView: V
    ) => Point | null | void;

    type OffsetCallback<V> = (
        this: V,
        attributeValue: any,
        nodeBBox: g.Rect,
        node: DOMElement,
        nodeAttributes: { [name: string]: any },
        cellView: V
    ) => Point | null | void;

    interface PresentationAttributeDefinition<V = CellView> {
        set?: SetCallback<V> | string;
        unset?: UnsetCallback<V> | string | Array<string>;
        position?: PositionCallback<V>;
        offset?: OffsetCallback<V>;
    }
}

export class Cell<A extends ObjectHash = Cell.Attributes, S extends mvc.ModelSetOptions = ModelSetOptions> extends mvc.Model<A, S> {

    constructor(attributes?: DeepPartial<A>, opt?: Cell.ConstructorOptions);

    id: Cell.ID;
    graph: Graph;
    markup: string | MarkupJSON;
    useCSSSelectors: boolean;

    protected generateId(): string | number;

    protected stopPendingTransitions(path?: Path, delim?: string): void;

    protected stopScheduledTransitions(path?: Path, delim?: string): void;

    toJSON(opt?: Cell.ExportOptions): Cell.JSON<any, A>;

    remove(opt?: Cell.DisconnectableOptions): this;

    toFront(opt?: Cell.ToFrontAndBackOptions): this;

    toBack(opt?: Cell.ToFrontAndBackOptions): this;

    parent(): string;

    getParentCell(): Cell | null;

    getAncestors(): Cell[];

    getEmbeddedCells(opt?: Cell.GetEmbeddedCellsOptions): Cell[];

    isEmbeddedIn(cell: Cell, opt?: Cell.EmbeddableOptions): boolean;

    isEmbedded(): boolean;

    prop(key: Path): any;
    prop(object: DeepPartial<A>, opt?: Cell.Options): this;
    prop(key: Path, value: any, opt?: Cell.Options): this;

    removeProp(path: Path, opt?: Cell.Options): this;

    attr(key?: Path): any;
    attr(object: Cell.Selectors, opt?: Cell.Options): this;
    attr(key: Path, value: any, opt?: Cell.Options): this;

    clone(): this;
    clone(opt: Cell.EmbeddableOptions<false>): this;
    clone(opt: Cell.EmbeddableOptions<true>): Cell[];

    removeAttr(path: Path, opt?: Cell.Options): this;

    transition(path: Path, value?: any, opt?: Cell.TransitionOptions, delim?: string): number;

    getTransitions(): string[];

    stopTransitions(path?: Path, delim?: string): this;

    embed(cell: Cell | Cell[], opt?: Cell.EmbedOptions): this;

    unembed(cell: Cell | Cell[], opt?: Graph.Options): this;

    canEmbed(cell: Cell | Cell[]): boolean;

    addTo(graph: Graph, opt?: Graph.Options): this;

    findView(paper: Paper): CellView;

    isLink(): this is Link;

    isElement(): this is Element;

    startBatch(name: string, opt?: Graph.Options): this;

    stopBatch(name: string, opt?: Graph.Options): this;

    position(): g.Point;

    z(): number;

    layer(): string | null;
    layer(id: string | null, opt?: Graph.Options): this;

    angle(): number;

    getBBox(): g.Rect;

    getCenter(): g.Point;

    getPointFromConnectedLink(link: Link, endType: LinkEnd): g.Point;

    getPointRotatedAroundCenter(angle: number, x: number, y: number): g.Point;
    getPointRotatedAroundCenter(angle: number, point: Point): g.Point;

    getRelativePointFromAbsolute(x: number, y: number): g.Point;
    getRelativePointFromAbsolute(absolutePoint: Point): g.Point;

    getAbsolutePointFromRelative(x: number, y: number): g.Point;
    getAbsolutePointFromRelative(relativePoint: Point): g.Point;

    getChangeFlag(attributes: { [key: string]: number }): number;

    static define(type: string, defaults?: any, protoProps?: any, staticProps?: any): Cell.Constructor<Cell>;

    static getAttributeDefinition(attrName: string): Cell.PresentationAttributeDefinition<CellView> | null;

    /**
     * @deprecated
     */
    protected processPorts(): void;
}

// dia.Element

export namespace Element {

    interface GenericAttributes<T> extends Cell.GenericAttributes<T> {
        markup?: string | MarkupJSON;
        position?: Point;
        size?: Size;
        angle?: number;
        ports?: {
            groups?: { [key: string]: PortGroup };
            items?: Port[];
        };
    }

    interface Attributes extends GenericAttributes<Cell.Selectors> {
    }

    interface ConstructorOptions extends Cell.ConstructorOptions {
        portLayoutNamespace?: { [key: string]: layout.Port.LayoutFunction };
        portLabelLayoutNamespace?: { [key: string]: layout.PortLabel.LayoutFunction };
    }

    type PortPositionCallback = layout.Port.LayoutFunction;

    type PortLabelPositionCallback = layout.PortLabel.LayoutFunction;

    interface PortPositionJSON {
        name?: string;
        args?: layout.Port.Options;
    }

    interface PortLabelPositionJSON {
        name?: string;
        args?: layout.PortLabel.Options;
    }

    type PositionType = string | PortPositionCallback | PortPositionJSON;

    type PortLabelPositionType = PortLabelPositionCallback | PortPositionJSON;

    interface PortGroup {
        position?: PositionType;
        markup?: string | MarkupJSON;
        attrs?: Cell.Selectors;
        size?: Size;
        label?: PortLabel;
    }

    interface PortLabel {
        markup?: string | MarkupJSON;
        position?: PortLabelPositionType;
    }

    interface Port {
        id?: string;
        markup?: string | MarkupJSON;
        group?: string;
        attrs?: Cell.Selectors;
        position?: {
            args?: layout.Port.Options;
        };
        /** @deprecated use `position.args` instead */
        args?: layout.Port.Options;
        size?: Size;
        label?: PortLabel;
        z?: number | 'auto';
    }

    interface PortPosition extends Point {
        angle: number;
    }

    interface PortRect extends BBox {
        angle: number;
    }

    interface TranslateOptions extends Cell.Options {
        restrictedArea?: BBox | Paper.PointConstraintCallback;
        transition?: Cell.TransitionOptions;
    }

    interface PositionOptions extends TranslateOptions {
        parentRelative?: boolean;
        deep?: boolean;
    }

    interface ResizeOptions extends Cell.Options {
        direction?: Direction;
    }

    interface FitToChildrenOptions {
        filter?: (cell: Cell) => boolean;
        deep?: boolean;
        padding?: Padding;
        minRect?: Partial<BBox>;
        expandOnly?: boolean;
        shrinkOnly?: boolean;
    }

    interface FitParentOptions extends FitToChildrenOptions {
        terminator?: Graph.CellRef;
    }

    interface RotateOptions {
        rotate?: boolean;
    }

    interface BBoxOptions extends Cell.EmbeddableOptions, RotateOptions {

    }
}

export class Element<A extends ObjectHash = Element.Attributes, S extends mvc.ModelSetOptions = ModelSetOptions> extends Cell<A, S> {

    constructor(attributes?: DeepPartial<A>, opt?: Element.ConstructorOptions);

    translate(tx: number, ty?: number, opt?: Element.TranslateOptions): this;

    position(opt?: Element.PositionOptions): g.Point;
    position(x: number, y: number, opt?: Element.PositionOptions): this;

    size(): Size;
    size(size: Partial<Size>, opt?: Element.ResizeOptions): this;
    size(width: number, height: number, opt?: Element.ResizeOptions): this;

    resize(width: number, height: number, opt?: Element.ResizeOptions): this;

    rotate(deg: number, absolute?: boolean, origin?: Point, opt?: { [key: string]: any }): this;

    angle(): number;

    scale(scaleX: number, scaleY: number, origin?: Point, opt?: { [key: string]: any }): this;

    fitEmbeds(opt?: Element.FitToChildrenOptions): this;
    fitToChildren(opt?: Element.FitToChildrenOptions): this;

    fitParent(opt?: Element.FitParentOptions): this;

    getBBox(opt?: Element.BBoxOptions): g.Rect;

    addPort(port: Element.Port, opt?: S): this;

    addPorts(ports: Element.Port[], opt?: S): this;

    insertPort(before: number | string | Element.Port, port: Element.Port, opt?: S): this;

    removePort(port: string | Element.Port, opt?: S): this;

    removePorts(opt?: S): this;
    removePorts(ports: Array<Element.Port | string>, opt?: S): this;

    hasPorts(): boolean;

    hasPort(id: string): boolean;

    getPorts(): Element.Port[];

    getGroupPorts(groupName: string): Element.Port[];

    getPort(id: string): Element.Port;

    getPortsPositions(groupName: string): { [id: string]: Element.PortPosition };

    getPortRelativePosition(portId: string): Element.PortPosition;

    getPortRelativeRect(portId: string): Element.PortRect;

    getPortCenter(portId: string): g.Point;

    getPortBBox(portId: string, opt?: Element.RotateOptions): g.Rect;

    getPortIndex(port: string | Element.Port): number;

    getPortGroupNames(): string[];

    portProp(portId: string, path: Path): any;

    portProp(portId: string, path: Path, value?: any, opt?: S): Element;

    protected generatePortId(): string | number;

    static define(type: string, defaults?: any, protoProps?: any, staticProps?: any): Cell.Constructor<Element>;

    static attributes: { [attributeName: string]: Cell.PresentationAttributeDefinition<ElementView> };
}

// dia.Link

export namespace Link {

    interface EndCellArgs {
        magnet?: string;
        selector?: string;
        port?: string;
        anchor?: anchors.AnchorJSON;
        connectionPoint?: connectionPoints.ConnectionPointJSON;
        priority?: boolean;
    }

    interface EndJSON extends EndCellArgs {
        id?: Cell.ID;
        x?: number;
        y?: number;
    }

    interface GenericAttributes<T> extends Cell.GenericAttributes<T> {
        source?: EndJSON;
        target?: EndJSON;
        labels?: Label[];
        vertices?: Point[];
        router?: routers.Router | routers.RouterJSON;
        connector?: connectors.Connector | connectors.ConnectorJSON;
    }

    interface Attributes extends GenericAttributes<Cell.Selectors> {
    }

    interface LabelPosition {
        distance?: number; // optional for default labels
        offset?: number | { x: number, y: number };
        angle?: number;
        args?: LinkView.LabelOptions;
    }

    interface Label {
        markup?: string | MarkupJSON;
        position?: LabelPosition | number; // optional for default labels
        attrs?: Cell.Selectors;
        size?: Size;
    }

    interface Vertex extends Point {
        [key: string]: any;
    }
}

export class Link<A extends ObjectHash = Link.Attributes, S extends mvc.ModelSetOptions = ModelSetOptions> extends Cell<A, S> {

    toolMarkup: string;
    doubleToolMarkup?: string;
    vertexMarkup: string;
    arrowHeadMarkup: string;
    defaultLabel?: Link.Label; // default label props
    /**
     * @deprecated use `defaultLabel.markup` instead
     */
    labelMarkup?: string | MarkupJSON; // default label markup

    disconnect(): this;

    source(): Link.EndJSON;
    source(source: Link.EndJSON, opt?: S): this;
    source(source: Cell, args?: Link.EndCellArgs, opt?: S): this;

    target(): Link.EndJSON;
    target(target: Link.EndJSON, opt?: S): this;
    target(target: Cell, args?: Link.EndCellArgs, opt?: S): this;

    router(): routers.Router | routers.RouterJSON | null;
    router(router: routers.Router | routers.RouterJSON, opt?: S): this;
    router(name: routers.RouterType, args?: routers.RouterArguments, opt?: S): this;

    connector(): connectors.Connector | connectors.ConnectorJSON | null;
    connector(connector: connectors.Connector | connectors.ConnectorJSON, opt?: S): this;
    connector(name: connectors.ConnectorType, args?: connectors.ConnectorArguments, opt?: S): this;

    label(index?: number): Link.Label;
    label(index: number, label: Link.Label, opt?: S): this;

    labels(): Link.Label[];
    labels(labels: Link.Label[], opt?: S): this;

    hasLabels(): boolean;

    insertLabel(index: number, label: Link.Label, opt?: S): Link.Label[];

    appendLabel(label: Link.Label, opt?: S): Link.Label[];

    removeLabel(index?: number, opt?: S): Link.Label[];

    vertex(index?: number): Link.Vertex;
    vertex(index: number, vertex: Link.Vertex, opt?: S): this;

    vertices(): Link.Vertex[];
    vertices(vertices: Link.Vertex[], opt?: S): this;

    insertVertex(index: number, vertex: Link.Vertex, opt?: S): Link.Vertex[];

    removeVertex(index?: number, opt?: S): Link.Vertex[];

    reparent(opt?: S): Element;

    getSourceElement(): null | Element;

    getTargetElement(): null | Element;

    getSourceCell(): null | Cell;

    getTargetCell(): null | Cell;

    getPolyline(): g.Polyline;

    getSourcePoint(): g.Point;

    getTargetPoint(): g.Point;

    getBBox(): g.Rect;

    hasLoop(opt?: Cell.EmbeddableOptions): boolean;

    getRelationshipAncestor(): undefined | Element;

    isRelationshipEmbeddedIn(cell: Cell): boolean;

    applyToPoints(fn: (p: Point) => Point, opt?: S): this;

    scale(sx: number, sy: number, origin?: Point, opt?: S): this;

    translate(tx: number, ty: number, opt?: S): this;

    static define(type: string, defaults?: any, protoProps?: any, staticProps?: any): Cell.Constructor<Link>;

    static attributes: { [attributeName: string]: Cell.PresentationAttributeDefinition<LinkView> };
}

// dia.CellView

export namespace CellView {

    enum Highlighting {
        DEFAULT = 'default',
        EMBEDDING = 'embedding',
        CONNECTING = 'connecting',
        MAGNET_AVAILABILITY = 'magnetAvailability',
        ELEMENT_AVAILABILITY = 'elementAvailability'
    }

    interface EventHighlightOptions {
        partial: boolean;
        type: Highlighting;
        [key: string]: any;
    }

    interface Options<T extends Cell> extends mvc.ViewOptions<T, SVGElement> {
        id?: string;
    }

    interface InteractivityOptions extends ElementView.InteractivityOptions, LinkView.InteractivityOptions {

    }

    type FlagLabel = string | string[];
    type PresentationAttributes = { [key: string]: FlagLabel };

    type NodeData = { [key: string]: any };

    type NodeMetrics = {
        data: NodeData;
        boundingRect: g.Rect;
        magnetMatrix: SVGMatrix;
        geometryShape: g.Shape;
    };
}

export abstract class CellViewGeneric<T extends Cell> extends mvc.View<T, SVGElement> {

    constructor(opt?: CellView.Options<T>);

    paper: Paper | null;

    initFlag(): CellView.FlagLabel;

    presentationAttributes(): CellView.PresentationAttributes;

    highlight(el?: mvc.$SVGElement, opt?: { [key: string]: any }): this;

    unhighlight(el?: mvc.$SVGElement, opt?: { [key: string]: any }): this;

    can(feature: string): boolean;

    findMagnet(el: mvc.$SVGElement): SVGElement | undefined;

    findNode(selector: string): SVGElement | HTMLElement | null;

    findNodes(groupSelector: string): Array<SVGElement | HTMLElement>;

    findProxyNode(el: SVGElement | null, type: string): SVGElement;

    getSelector(el: SVGElement, prevSelector?: string): string;

    notify(eventName: string, ...eventArguments: any[]): void;

    addTools(tools: ToolsView): this;

    hasTools(name?: string): boolean;

    removeTools(): this;

    showTools(): this;

    hideTools(): this;

    updateTools(opt?: { [key: string]: any }): this;

    mountTools(): this;

    unmountTools(): this;

    getNodeMatrix(node: SVGElement): SVGMatrix;

    getNodeRotateMatrix(node: SVGElement): SVGMatrix;

    getNodeBoundingRect(node: SVGElement): g.Rect;

    getBBox(opt?: { useModelGeometry?: boolean }): g.Rect;

    getNodeBBox(node: SVGElement): g.Rect;

    getNodeUnrotatedBBox(node: SVGElement): g.Rect;

    isNodeConnection(node: SVGElement): boolean;

    getEventTarget(evt: Event, opt?: { fromPoint?: boolean }): DOMElement;

    checkMouseleave(evt: Event): void;

    getFlag(label: CellView.FlagLabel): number;

    requestUpdate(flags: number, opt?: { [key: string]: any }): void;

    dragLinkStart(evt: Event, magnet: SVGElement, x: number, y: number): void;

    dragLink(evt: Event, x: number, y: number): void;

    dragLinkEnd(evt: Event, x: number, y: number): void;

    preventDefaultInteraction(evt: Event): void;

    isDefaultInteractionPrevented(evt: Event): boolean;

    isIntersecting(geometryShape: g.Shape, geometryData?: g.SegmentSubdivisionsOpt | null): boolean;

    cleanNodesCache(): void;

    cleanNodeCache(node: SVGElement): void

    protected isEnclosedIn(area: g.Rect): boolean;

    protected isInArea(area: g.Rect, options: g.StrictOpt): boolean;

    protected isAtPoint(point: g.Point, options: g.StrictOpt): boolean;

    protected findBySelector(selector: string, root?: SVGElement): SVGElement[];

    protected removeHighlighters(): void;

    protected updateHighlighters(): void;

    protected transformHighlighters(): void;

    protected hasFlag(flags: number, label: CellView.FlagLabel): boolean;

    protected removeFlag(flags: number, label: CellView.FlagLabel): number;

    protected setFlags(): void;

    protected onToolEvent(eventName: string): void;

    protected pointerdblclick(evt: Event, x: number, y: number): void;

    protected pointerclick(evt: Event, x: number, y: number): void;

    protected contextmenu(evt: Event, x: number, y: number): void;

    protected pointerdown(evt: Event, x: number, y: number): void;

    protected pointermove(evt: Event, x: number, y: number): void;

    protected pointerup(evt: Event, x: number, y: number): void;

    protected mouseover(evt: Event): void;

    protected mouseout(evt: Event): void;

    protected mouseenter(evt: Event): void;

    protected mouseleave(evt: Event): void;

    protected mousewheel(evt: Event, x: number, y: number, delta: number): void;

    protected onevent(evt: Event, eventName: string, x: number, y: number): void;

    protected onmagnet(evt: Event, x: number, y: number): void;

    protected getLinkEnd(magnet: SVGElement, x: number, y: number, link: Link, endType: LinkEnd): Link.EndJSON;

    protected getMagnetFromLinkEnd(end: Link.EndJSON): SVGElement;

    protected customizeLinkEnd(end: Link.EndJSON, magnet: SVGElement, x: number, y: number, link: Link, endType: LinkEnd): Link.EndJSON;

    protected addLinkFromMagnet(magnet: SVGElement, x: number, y: number): LinkView;

    protected nodeCache(magnet: SVGElement): CellView.NodeMetrics;

    protected getNodeData(magnet: SVGElement): CellView.NodeData;

    protected getNodeShape(magnet: SVGElement): g.Shape;

    protected onMount(isInitialMount: boolean): void;

    protected onDetach(): void;

    static addPresentationAttributes(attributes: CellView.PresentationAttributes): CellView.PresentationAttributes;

    static evalAttribute(attrName: string, attrValue: any, refBBox: BBox): any;
}

export class CellView extends CellViewGeneric<Cell> {

}

// dia.ElementView


export namespace ElementView {

    enum Flags {
        UPDATE = 'UPDATE',
        TRANSLATE = 'TRANSLATE',
        TOOLS = 'TOOLS',
        RESIZE = 'RESIZE',
        PORTS = 'PORTS',
        ROTATE = 'ROTATE',
        RENDER = 'RENDER'
    }

    interface InteractivityOptions {
        elementMove?: boolean;
        addLinkFromMagnet?: boolean;
        stopDelegation?: boolean;
    }
}

export class ElementView<E extends Element = Element> extends CellViewGeneric<E> {

    update(element?: DOMElement, renderingOnlyAttrs?: { [key: string]: any }): void;

    setInteractivity(value: boolean | ElementView.InteractivityOptions): void;

    getDelegatedView(): ElementView | null;

    getTargetParentView(evt: Event): CellView | null;

    findPortNode(portId: string | number): SVGElement | null;
    findPortNode(portId: string | number, selector: string): DOMElement | null;

    findPortNodes(portId: string | number, groupSelector: string): DOMElement[];

    protected renderMarkup(): void;

    protected renderJSONMarkup(markup: MarkupJSON): void;

    protected renderStringMarkup(markup: string): void;

    protected updateTransformation(): void;

    protected resize(): void;

    protected translate(): void;

    protected rotate(): void;

    protected getTranslateString(): string;

    protected getRotateString(): string;

    protected dragStart(evt: Event, x: number, y: number): void;

    protected dragMagnetStart(evt: Event, x: number, y: number): void;

    protected drag(evt: Event, x: number, y: number): void;

    protected dragMagnet(evt: Event, x: number, y: number): void;

    protected dragEnd(evt: Event, x: number, y: number): void;

    protected dragMagnetEnd(evt: Event, x: number, y: number): void;

    protected snapToGrid(evt: Event, x: number, y: number): Point;

    protected prepareEmbedding(data: any): void;

    protected processEmbedding(data: any, evt: Event, x: number, y: number): void;

    protected clearEmbedding(data: any): void;

    protected finalizeEmbedding(data: any): void;
}

// dia.LinkView


export namespace LinkView {

    enum Flags {
        RENDER = 'RENDER',
        UPDATE = 'UPDATE',
        TOOLS = 'TOOLS',
        LEGACY_TOOLS = 'LEGACY_TOOLS',
        LABELS = 'LABELS',
        VERTICES = 'VERTICES',
        SOURCE = 'SOURCE',
        TARGET = 'TARGET',
        CONNECTOR = 'CONNECTOR'
    }

    interface InteractivityOptions {
        labelMove?: boolean;
        linkMove?: boolean;
    }

    interface LabelOptions extends Cell.Options {
        absoluteDistance?: boolean;
        reverseDistance?: boolean;
        absoluteOffset?: boolean;
        keepGradient?: boolean;
        ensureLegibility?: boolean;
    }

    interface VertexOptions extends Cell.Options {

    }

    interface Options<L extends Link = Link> extends mvc.ViewOptions<L, SVGElement> {
        labelsLayer?: Paper.Layers | string | false;
    }
}

export class LinkView<L extends Link = Link> extends CellViewGeneric<L> {

    options: LinkView.Options<L>;
    sourceAnchor: g.Point;
    targetAnchor: g.Point;
    sourcePoint: g.Point;
    targetPoint: g.Point;
    sourceBBox: g.Rect;
    targetBBox: g.Rect;
    route: g.Point[];

    sendToken(token: SVGElement, duration?: number, callback?: () => void): void;
    sendToken(token: SVGElement, opt?: { duration?: number, direction?: string, connection?: string }, callback?: () => void): void;

    addLabel(coordinates: Point, opt?: LinkView.LabelOptions): number;
    addLabel(coordinates: Point, angle: number, opt?: LinkView.LabelOptions): number;
    addLabel(x: number, y: number, opt?: LinkView.LabelOptions): number;
    addLabel(x: number, y: number, angle: number, opt?: LinkView.LabelOptions): number;

    addVertex(coordinates: Point, opt?: LinkView.VertexOptions): number;
    addVertex(x: number, y: number, opt?: LinkView.VertexOptions): number;

    getConnection(): g.Path;

    getSerializedConnection(): string;

    getConnectionSubdivisions(): g.Curve[][];

    getConnectionLength(): number;

    getPointAtLength(length: number): g.Point;

    getPointAtRatio(ratio: number): g.Point;

    getTangentAtLength(length: number): g.Line;

    getTangentAtRatio(ratio: number): g.Line;

    getClosestPoint(point: Point): g.Point;

    getClosestPointLength(point: Point): number;

    getClosestPointRatio(point: Point): number;

    getLabelPosition(x: number, y: number, opt?: LinkView.LabelOptions): Link.LabelPosition;
    getLabelPosition(x: number, y: number, angle: number, opt?: LinkView.LabelOptions): Link.LabelPosition;

    getLabelCoordinates(labelPosition: Link.LabelPosition): g.Point;

    getVertexIndex(x: number, y: number): number;
    getVertexIndex(point: Point): number;

    update(): this;

    translate(tx: number, ty: number): void;

    requestConnectionUpdate(opt?: { [key: string]: any }): void;

    setInteractivity(value: boolean | LinkView.InteractivityOptions): void;

    getEndView(endType: LinkEnd): CellView | null;

    getEndAnchor(endType: LinkEnd): g.Point;

    getEndConnectionPoint(endType: LinkEnd): g.Point;

    getEndMagnet(endType: LinkEnd): SVGElement | null;

    findLabelNode(labelIndex: string | number): SVGElement | null;
    findLabelNode(labelIndex: string | number, selector: string): DOMElement | null;

    findLabelNodes(labelIndex: string | number, groupSelector: string): DOMElement[];

    removeRedundantLinearVertices(opt?: ModelSetOptions): number;

    startArrowheadMove(end: LinkEnd, options?: any): unknown;

    protected updateRoute(): void;

    protected updatePath(): void;

    protected updateDOM(): void;

    protected onLabelsChange(link: Link, labels: Link.Label[], opt: { [key: string]: any }): void;

    protected onToolsChange(link: Link, toolsMarkup: string, opt: { [key: string]: any }): void;

    protected onVerticesChange(link: Link, vertices: Point[], opt: { [key: string]: any }): void;

    protected onSourceChange(element: Element, sourceEnd: any, opt: { [key: string]: any }): void;

    protected onTargetChange(element: Element, targetEnd: any, opt: { [key: string]: any }): void;

    protected onlabel(evt: Event, x: number, y: number): void;

    protected dragLabelStart(evt: Event, x: number, y: number): void;

    protected dragArrowheadStart(evt: Event, x: number, y: number): void;

    protected dragStart(evt: Event, x: number, y: number): void;

    protected dragLabel(evt: Event, x: number, y: number): void;

    protected dragArrowhead(evt: Event, x: number, y: number): void;

    protected drag(evt: Event, x: number, y: number): void;

    protected dragLabelEnd(evt: Event, x: number, y: number): void;

    protected dragArrowheadEnd(evt: Event, x: number, y: number): void;

    protected dragEnd(evt: Event, x: number, y: number): void;

    protected findPath(route: Point[], sourcePoint: Point, targetPoint: Point): g.Path;

    protected notifyPointerdown(evt: Event, x: number, y: number): void;

    protected notifyPointermove(evt: Event, x: number, y: number): void;

    protected notifyPointerup(evt: Event, x: number, y: number): void;

    protected mountLabels(): void;

    protected unmountLabels(): void;
}

// dia.Paper

export namespace Paper {

    /** A callback that resolves which view class to use for a given model. Return `null` or `undefined` to use the default view. */
    type CellViewCallback<V extends typeof CellViewGeneric<any>> = (model: InstanceType<V> extends CellViewGeneric<infer M> ? M : Cell, NSView: V | null) => V | null | undefined;

    interface GradientOptions {
        id?: string;
        type: 'linearGradient' | 'radialGradient';
        stops: Array<{
            offset: string;
            color: string;
            opacity?: number;
        }>;
    }
    interface FilterOptions {
        [key: string]: any;
    }

    interface PatternOptions {
        [key: string]: any;
    }

    interface MarkerOptions {
        [key: string]: any;
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

    type Dimension = number | string | null;

    enum sorting {
        EXACT = 'sorting-exact',
        APPROX = 'sorting-approximate',
        NONE = 'sorting-none'
    }

    enum Layers {
        LABELS = 'labels',
        BACK = 'back',
        FRONT = 'front',
        /** @deprecated */
        CELLS = 'cells',
        TOOLS = 'tools',
        GRID = 'grid',
    }

    type LayerRef = Layers | string | LayerView | GraphLayer;

    interface RenderStats {
        priority: number;
        updated: number;
    }

    interface UpdateVisibilityStats {
        mounted: number;
        unmounted: number;
    }

    interface RenderBatchStats extends RenderStats, UpdateVisibilityStats {
        postponed: number;
        empty: boolean;
    }

    type UpdateStats = RenderStats & Partial<RenderBatchStats> & {
        batches?: number;
    };

    type ViewportCallback = (view: mvc.View<any, any>, isMounted: boolean, paper: Paper) => boolean;
    type CellVisibilityCallback = (cell: Cell, isMounted: boolean, paper: Paper) => boolean;
    type ProgressCallback = (done: boolean, processed: number, total: number, stats: UpdateStats, paper: Paper) => void;
    type BeforeRenderCallback = (opt: { [key: string]: any }, paper: Paper) => void;
    type AfterRenderCallback = (stats: UpdateStats, opt: { [key: string]: any }, paper: Paper) => void;

    interface CellVisibilityOptions {
        cellVisibility?: CellVisibilityCallback | null;

        /** @deprecated disable `legacyMode` and use `cellVisibility` instead */
        viewport?: ViewportCallback | null;
    }

    interface MountOptions {
        mountBatchSize?: number;
    }

    interface UnmountOptions {
        unmountBatchSize?: number;
    }

    interface BatchSizeOptions {
        batchSize?: number;
    }

    interface BeforeRenderOptions {
        beforeRender?: BeforeRenderCallback;
    }

    interface AfterRenderOptions {
        afterRender?: AfterRenderCallback;
    }

    interface RenderCallbackOptions extends BeforeRenderOptions, AfterRenderOptions, mvc.Silenceable {

    }

    interface KeyOptions {
        key?: string;
    }

    interface UpdateViewOptions {
        [key: string]: any;
    }

    interface UpdateViewsBatchOptions extends UpdateViewOptions, BatchSizeOptions, CellVisibilityOptions {

    }

    interface UpdateViewsOptions extends UpdateViewsBatchOptions, RenderCallbackOptions {

    }

    interface UpdateViewsAsyncOptions extends UpdateViewsBatchOptions, ScheduleCellsVisibilityUpdateOptions, RenderCallbackOptions {
        progress?: ProgressCallback;
    }

    interface ScheduleCellsVisibilityUpdateOptions extends CellVisibilityOptions, MountOptions, UnmountOptions {

    }

    interface FreezeOptions extends KeyOptions {

    }

    interface UnfreezeOptions extends KeyOptions, UpdateViewsAsyncOptions, UpdateViewsOptions {

    }

    interface SnapLinksOptions {
        radius?: number;
        findInAreaOptions?: FindInAreaOptions;
    }

    type PointConstraintCallback = (x: number, y: number, opt: any) => Point;
    type RestrictTranslateCallback = (elementView: ElementView, x0: number, y0: number) => BBox | boolean | PointConstraintCallback;
    type FindParentByType = 'bbox' | 'pointer' | PositionName;
    type FindParentByCallback = ((this: Graph, elementView: ElementView, evt: Event, x: number, y: number) => Cell[]);
    type MeasureNodeCallback = (node: SVGGraphicsElement, cellView: CellView) => g.Rect;

    interface Options extends mvc.ViewOptions<Graph>, CellVisibilityOptions, BeforeRenderOptions, AfterRenderOptions {
        // appearance
        width?: Dimension;
        height?: Dimension;
        drawGrid?: boolean | GridOptions | GridOptions[];
        drawGridSize?: number | null;
        background?: BackgroundOptions;
        labelsLayer?: boolean | Paper.Layers | string;
        // interactions
        gridSize?: number;
        highlighting?: boolean | Record<string | CellView.Highlighting, highlighters.HighlighterJSON | boolean>;
        interactive?: ((cellView: CellView, event: string) => boolean | CellView.InteractivityOptions) | boolean | CellView.InteractivityOptions;
        snapLabels?: boolean;
        snapLinks?: boolean | SnapLinksOptions;
        snapLinksSelf?: boolean | { distance: number };
        markAvailable?: boolean;
        // validations
        validateMagnet?: (cellView: CellView, magnet: SVGElement, evt: Event) => boolean;
        validateConnection?: (cellViewS: CellView, magnetS: SVGElement, cellViewT: CellView, magnetT: SVGElement, end: LinkEnd, linkView: LinkView) => boolean;
        restrictTranslate?: RestrictTranslateCallback | boolean | BBox;
        multiLinks?: boolean;
        linkPinning?: boolean;
        allowLink?: ((linkView: LinkView, paper: Paper) => boolean) | null;
        // events
        guard?: (evt: Event, view: CellView) => boolean;
        preventContextMenu?: boolean;
        preventDefaultViewAction?: boolean;
        preventDefaultBlankAction?: boolean;
        clickThreshold?: number;
        moveThreshold?: number;
        magnetThreshold?: number | string;
        // views
        elementView?: typeof ElementView<Element> | CellViewCallback<typeof ElementView<Element>>;
        linkView?: typeof LinkView<Link> | CellViewCallback<typeof LinkView<Link>>;
        measureNode?: MeasureNodeCallback;
        // embedding
        embeddingMode?: boolean;
        frontParentOnly?: boolean;
        findParentBy?: FindParentByType | FindParentByCallback;
        validateEmbedding?: (this: Paper, childView: ElementView, parentView: ElementView) => boolean;
        validateUnembedding?: (this: Paper, childView: ElementView) => boolean;
        // default views, models & attributes
        cellViewNamespace?: any;
        layerViewNamespace?: any;
        routerNamespace?: any;
        connectorNamespace?: any;
        highlighterNamespace?: any;
        anchorNamespace?: any;
        linkAnchorNamespace?: any;
        connectionPointNamespace?: any;
        defaultLink?: ((cellView: CellView, magnet: SVGElement) => Link) | Link;
        defaultRouter?: routers.Router | routers.RouterJSON;
        defaultConnector?: connectors.Connector | connectors.ConnectorJSON;
        defaultAnchor?: anchors.AnchorJSON | anchors.Anchor;
        defaultLinkAnchor?: anchors.AnchorJSON | anchors.Anchor;
        defaultConnectionPoint?: connectionPoints.ConnectionPointJSON | connectionPoints.ConnectionPoint | ((...args: any[]) => connectionPoints.ConnectionPoint);
        // connecting
        connectionStrategy?: connectionStrategies.ConnectionStrategy;
        // rendering
        async?: boolean;
        sorting?: sorting;
        frozen?: boolean;
        autoFreeze?: boolean;
        viewManagement?: ViewManagementOptions | boolean;
        onViewUpdate?: (view: mvc.View<any, any>, flag: number, priority: number, opt: { [key: string]: any }, paper: Paper) => void;
        onViewPostponed?: (view: mvc.View<any, any>, flag: number, paper: Paper) => boolean;
        overflow?: boolean;
    }

    interface ViewManagementOptions {
        lazyInitialize?: boolean;
        disposeHidden?: boolean;
    }

    interface TransformToFitContentOptions {
        padding?: Padding;
        preserveAspectRatio?: boolean;
        minScale?: number;
        minScaleX?: number;
        minScaleY?: number;
        maxScale?: number;
        maxScaleX?: number;
        maxScaleY?: number;
        scaleGrid?: number;
        useModelGeometry?: boolean;
        fittingBBox?: BBox;
        contentArea?: BBox;
        verticalAlign?: 'top' | 'middle' | 'bottom';
        horizontalAlign?: 'left' | 'middle' | 'right';
    }

    /**
     * @deprecated
    */
    type ScaleContentOptions = TransformToFitContentOptions;

    interface FitToContentOptions {
        gridWidth?: number;
        gridHeight?: number;
        padding?: Padding;
        allowNewOrigin?: false | 'negative' | 'positive' | 'any';
        allowNegativeBottomRight?: boolean;
        minWidth?: number;
        minHeight?: number;
        maxWidth?: number;
        maxHeight?: number;
        useModelGeometry?: boolean;
        contentArea?: BBox;
    }

    interface EventMap {
        // pointerclick
        'cell:pointerclick': (cellView: CellView, evt: Event, x: number, y: number) => void;
        'element:pointerclick': (elementView: ElementView, evt: Event, x: number, y: number) => void;
        'link:pointerclick': (linkView: LinkView, evt: Event, x: number, y: number) => void;
        'blank:pointerclick': (evt: Event, x: number, y: number) => void;
        // pointerdblclick
        'cell:pointerdblclick': (cellView: CellView, evt: Event, x: number, y: number) => void;
        'element:pointerdblclick': (elementView: ElementView, evt: Event, x: number, y: number) => void;
        'link:pointerdblclick': (linkView: LinkView, evt: Event, x: number, y: number) => void;
        'blank:pointerdblclick': (evt: Event, x: number, y: number) => void;
        // contextmenu
        'cell:contextmenu': (cellView: CellView, evt: Event, x: number, y: number) => void;
        'element:contextmenu': (elementView: ElementView, evt: Event, x: number, y: number) => void;
        'link:contextmenu': (linkView: LinkView, evt: Event, x: number, y: number) => void;
        'blank:contextmenu': (evt: Event, x: number, y: number) => void;
        // pointerdown
        'cell:pointerdown': (cellView: CellView, evt: Event, x: number, y: number) => void;
        'element:pointerdown': (elementView: ElementView, evt: Event, x: number, y: number) => void;
        'link:pointerdown': (linkView: LinkView, evt: Event, x: number, y: number) => void;
        'blank:pointerdown': (evt: Event, x: number, y: number) => void;
        // pointerdown
        'cell:pointermove': (cellView: CellView, evt: Event, x: number, y: number) => void;
        'element:pointermove': (elementView: ElementView, evt: Event, x: number, y: number) => void;
        'link:pointermove': (linkView: LinkView, evt: Event, x: number, y: number) => void;
        'blank:pointermove': (evt: Event, x: number, y: number) => void;
        // pointerup
        'cell:pointerup': (cellView: CellView, evt: Event, x: number, y: number) => void;
        'element:pointerup': (elementView: ElementView, evt: Event, x: number, y: number) => void;
        'link:pointerup': (linkView: LinkView, evt: Event, x: number, y: number) => void;
        'blank:pointerup': (evt: Event, x: number, y: number) => void;
        // mouseover
        'cell:mouseover': (cellView: CellView, evt: Event) => void;
        'element:mouseover': (elementView: ElementView, evt: Event) => void;
        'link:mouseover': (linkView: LinkView, evt: Event) => void;
        'blank:mouseover': (evt: Event) => void;
        // mouseout
        'cell:mouseout': (cellView: CellView, evt: Event) => void;
        'element:mouseout': (elementView: ElementView, evt: Event) => void;
        'link:mouseout': (linkView: LinkView, evt: Event) => void;
        'blank:mouseout': (evt: Event) => void;
        // mouseenter
        'cell:mouseenter': (cellView: CellView, evt: Event) => void;
        'element:mouseenter': (elementView: ElementView, evt: Event) => void;
        'link:mouseenter': (linkView: LinkView, evt: Event) => void;
        'blank:mouseenter': (evt: Event) => void;
        // mouseleave
        'cell:mouseleave': (cellView: CellView, evt: Event) => void;
        'element:mouseleave': (elementView: ElementView, evt: Event) => void;
        'link:mouseleave': (linkView: LinkView, evt: Event) => void;
        'blank:mouseleave': (evt: Event) => void;
        // mousewheel
        'cell:mousewheel': (cellView: CellView, evt: Event, x: number, y: number, delta: number) => void;
        'element:mousewheel': (elementView: ElementView, evt: Event, x: number, y: number, delta: number) => void;
        'link:mousewheel': (linkView: LinkView, evt: Event, x: number, y: number, delta: number) => void;
        'blank:mousewheel': (evt: Event, x: number, y: number, delta: number) => void;
        // touchpad
        'paper:pan': (evt: Event, deltaX: number, deltaY: number) => void;
        'paper:pinch': (evt: Event, x: number, y: number, scale: number) => void;
        // magnet
        'element:magnet:pointerclick': (elementView: ElementView, evt: Event, magnetNode: SVGElement, x: number, y: number) => void;
        'element:magnet:pointerdblclick': (elementView: ElementView, evt: Event, magnetNode: SVGElement, x: number, y: number) => void;
        'element:magnet:contextmenu': (elementView: ElementView, evt: Event, magnetNode: SVGElement, x: number, y: number) => void;
        // highlighting
        'cell:highlight': (cellView: CellView, node: SVGElement, options: CellView.EventHighlightOptions) => void;
        'cell:unhighlight': (cellView: CellView, node: SVGElement, options: CellView.EventHighlightOptions) => void;
        'cell:highlight:invalid': (cellView: CellView, highlighterId: string, highlighter: HighlighterView) => void;
        // connect
        'link:connect': (linkView: LinkView, evt: Event, newCellView: CellView, newCellViewMagnet: SVGElement, arrowhead: LinkEnd) => void;
        'link:disconnect': (linkView: LinkView, evt: Event, prevCellView: CellView, prevCellViewMagnet: SVGElement, arrowhead: LinkEnd) => void;
        'link:snap:connect': (linkView: LinkView, evt: Event, newCellView: CellView, newCellViewMagnet: SVGElement, arrowhead: LinkEnd) => void;
        'link:snap:disconnect': (linkView: LinkView, evt: Event, prevCellView: CellView, prevCellViewMagnet: SVGElement, arrowhead: LinkEnd) => void;
        // render
        'render:done': (stats: UpdateStats, opt: any) => void;
        'render:idle': (opt: Paper.UpdateViewsAsyncOptions) => void;
        // paper
        'paper:mouseenter': (evt: Event) => void;
        'paper:mouseleave': (evt: Event) => void;
        // transformations
        'translate': (tx: number, ty: number, data: unknown) => void;
        'scale': (sx: number, sy: number, data: unknown) => void;
        'resize': (width: number, height: number, data: unknown) => void;
        'transform': (matrix: SVGMatrix, data: unknown) => void;
        // custom
        [eventName: string]: mvc.EventHandler;
    }

    interface BufferOptions {
        /**
         * A buffer around the area to extend the search to
         * to mitigate the differences between the model and view geometry.
         */
        buffer?: number;
    }

    interface FindAtPointOptions extends Graph.FindAtPointOptions, BufferOptions {
    }

    interface FindInAreaOptions extends Graph.FindInAreaOptions, BufferOptions {
    }

    interface FindClosestMagnetToPointOptions {
        radius?: number;
        findInAreaOptions?: FindInAreaOptions;
        filter?: (view: CellView, magnet: SVGElement) => boolean;
    }

    interface ClosestMagnet {
        view: CellView;
        magnet: SVGElement;
    }

    interface InsertLayerViewOptions {
        before?: LayerRef | null;
        index?: number;
    }
}

export class Paper extends mvc.View<Graph> {

    constructor(opt: Paper.Options);

    options: Paper.Options;

    stylesheet: string;

    svg: SVGSVGElement;
    defs: SVGDefsElement;

    /** @deprecated use getLayerViewNode()*/
    cells: SVGGElement;
    /** @deprecated use layers property*/
    viewport: SVGGElement;

    tools: SVGGElement;
    layers: SVGGElement;

    GUARDED_TAG_NAMES: string[];
    FORM_CONTROL_TAG_NAMES: string[];

    matrix(): SVGMatrix;
    matrix(ctm: SVGMatrix | Vectorizer.Matrix, data?: any): this;

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

    defineFilter(filter: SVGFilterJSON): string;

    defineGradient(gradient: SVGGradientJSON): string;

    defineMarker(marker: SVGMarkerJSON): string;

    definePattern(pattern: Omit<SVGPatternJSON, 'type'>): string;

    isDefined(defId: string): boolean;

    getComputedSize(): Size;

    getArea(): g.Rect;

    getRestrictedArea(): g.Rect | null;
    getRestrictedArea(elementView: ElementView, x: number, y: number): g.Rect | null | Paper.PointConstraintCallback;

    getContentArea(opt?: { useModelGeometry: boolean }): g.Rect;

    getContentBBox(opt?: { useModelGeometry: boolean }): g.Rect;

    findView<T extends ElementView | LinkView>(element: mvc.$SVGElement): T;

    findViewByModel<T extends ElementView | LinkView>(model: Graph.CellRef): T;

    /**
     * Finds all the element views at the specified point
     * @param point a point in local paper coordinates
     * @param opt options for the search
     */
    findElementViewsAtPoint(point: Point, opt?: Paper.FindAtPointOptions): ElementView[];

    /**
     * Finds all the link views at the specified point
     * @param point a point in local paper coordinates
     * @param opt options for the search
     */
    findLinkViewsAtPoint(point: Point, opt?: Paper.FindAtPointOptions): LinkView[];

    /**
     * Finds all the cell views at the specified point
     * @param point a point in local paper coordinates
     * @param opt options for the search
     */
    findCellViewsAtPoint(point: Point, opt?: Paper.FindAtPointOptions): CellView[];

    /**
     * Finds all the element views in the specified area
     * @param area a rectangle in local paper coordinates
     * @param opt options for the search
     */
    findElementViewsInArea(area: BBox, opt?: Paper.FindInAreaOptions): ElementView[];

    /**
     * Finds all the link views in the specified area
     * @param area a rectangle in local paper coordinates
     * @param opt options for the search
     */
    findLinkViewsInArea(area: BBox, opt?: Paper.FindInAreaOptions): LinkView[];

    /**
     * Finds all the cell views in the specified area
     * @param area a rectangle in local paper coordinates
     * @param opt options for the search
     */
    findCellViewsInArea(area: BBox, opt?: Paper.FindInAreaOptions): CellView[];

    /**
     * Finds the closest magnet to the specified point
     * @param point a point in local paper coordinates
     * @param opt options for the search
     */
    findClosestMagnetToPoint(point: Point, opt?: Paper.FindClosestMagnetToPointOptions): Paper.ClosestMagnet | null;

    fitToContent(opt?: Paper.FitToContentOptions): g.Rect;
    fitToContent(gridWidth?: number, gridHeight?: number, padding?: number, opt?: any): g.Rect;

    getFitToContentArea(opt?: Paper.FitToContentOptions): g.Rect;

    transformToFitContent(opt?: Paper.TransformToFitContentOptions): void;

    drawBackground(opt?: Paper.BackgroundOptions): this;

    getDefaultLink(cellView: CellView, magnet: SVGElement): Link;

    getModelById(id: Graph.CellRef): Cell;

    setDimensions(width: Paper.Dimension, height: Paper.Dimension, data?: any): void;

    setInteractivity(value: any): void;

    scale(): Vectorizer.Scale;
    scale(sx: number, sy?: number, data?: any): this;

    scaleUniformAtPoint(scale: number, point: Point, data?: any): this;

    translate(): Vectorizer.Translation;
    translate(tx: number, ty?: number, data?: any): this;

    update(): this;

    getPointerArgs(evt: Event): [Event, number, number];

    // grid

    setGrid(opt?: null | boolean | string | Paper.GridOptions | Paper.GridOptions[]): this;

    setGridSize(gridSize: number): this;

    // tools

    removeTools(): this;

    hideTools(): this;

    showTools(): this;

    dispatchToolsEvent(eventName: string, ...args: any[]): void;

    // layers

    getLayerView(layerRef: Paper.LayerRef): LayerView;
    getLayerView(layer: GraphLayer): GraphLayerView;

    hasLayerView(layerRef: Paper.LayerRef): boolean;

    getLayerViews(): Array<LayerView>;

    getGraphLayerViews(): Array<GraphLayerView>;

    addLayerView(layerView: LayerView, options?: Paper.InsertLayerViewOptions): void;

    moveLayerView(layerRef: Paper.LayerRef, options?: Paper.InsertLayerViewOptions): void;

    removeLayerView(layerRef: Paper.LayerRef): void;

    protected insertLayerView(layerView: LayerView, beforeLayerView?: LayerView): void;

    protected requestLayerViewRemoval(layerRef: Paper.LayerRef, opt?: { [key: string]: any }): void;

    protected createLayerView(options: Omit<LayerView.Options, 'paper'>): LayerView;

    protected getLayerViewOrder(): string[];

    protected renderLayerViews(): void;

    protected renderImplicitLayerViews(): void;

    protected renderGraphLayerViews(): void;

    protected removeLayerViews(): void;

    protected resetLayerViews(): void;

    // rendering

    freeze(opt?: Paper.FreezeOptions): void;

    unfreeze(opt?: Paper.UnfreezeOptions): void;

    wakeUp(): void;

    isFrozen(): boolean;

    requestViewUpdate(view: mvc.View<any, any>, flag: number, priority: number, opt?: { [key: string]: any }): void;

    requestCellViewInsertion(cell: Graph.CellRef, opt?: { [key: string]: any }): void;

    requireView<T extends ElementView | LinkView>(cellOrId: Graph.CellRef, opt?: Paper.UpdateViewOptions & Paper.RenderCallbackOptions): T;

    updateViews(opt?: Paper.UpdateViewsOptions): Paper.RenderStats & { batches: number };

    hasScheduledUpdates(): boolean;

    disposeHiddenCellViews(): void;

    isCellVisible(cellOrId: Graph.CellRef): boolean;

    updateCellVisibility(
        cell: Graph.CellRef,
        opt?: Paper.CellVisibilityOptions & Paper.UpdateViewOptions & Paper.RenderCallbackOptions
    ): void;

    updateCellsVisibility(
        opt?: Paper.ScheduleCellsVisibilityUpdateOptions & Paper.UpdateViewsOptions
    ): void;

    // events

    on<T extends keyof Paper.EventMap>(
        eventName: T,
        callback: Paper.EventMap[T],
        context?: any
    ): this;
    on(
        eventName: LiteralUnion<keyof ExcludeIndexSignature<Paper.EventMap>>,
        callback: mvc.EventHandler,
        context?: any
    ): this;

    on<E extends Partial<Paper.EventMap>>(
        events: E,
        context?: any
    ): this;

    // protected

    /**
    * For the specified view, calls the cell visibility function specified by the `paper.options.cellVisibility` function.
    * If the function returns true, the view is attached to the DOM; in other case it is detached.
    * While async papers do this automatically, synchronous papers require an explicit call to this method for this functionality to be applied. To show the view again, use `paper.requestView()`.
    * If you are using `autoFreeze` option you should call this function if you are calling `paper.requestView()` if you want `paper.options.cellVisibility` function to be applied.
    * @param cellView cellView for which the visibility check is performed
    * @param opt if opt.cellVisibility is provided, it is used as the callback function instead of paper.options.cellVisibility.
    */
    protected checkViewVisibility(
        cellView: CellView,
        opt?: Paper.CellVisibilityOptions
    ): Paper.UpdateVisibilityStats;


    protected scheduleCellsVisibilityUpdate(opt?: Paper.ScheduleCellsVisibilityUpdateOptions): Paper.UpdateVisibilityStats;

    protected scheduleViewUpdate(view: mvc.View<any, any>, flag: number, priority: number, opt?: { [key: string]: any }): void;

    protected dumpViewUpdate(view: mvc.View<any, any>): number;

    protected dumpView(view: mvc.View<any, any>, opt?: Paper.UpdateViewOptions & Paper.RenderCallbackOptions): number;

    protected updateView(view: mvc.View<any, any>, flag: number, opt?: Paper.UpdateViewOptions): number;

    protected registerUnmountedView(view: mvc.View<any, any>): number;

    protected registerMountedView(view: mvc.View<any, any>): number;

    protected updateViewsAsync(opt?: Paper.UpdateViewsAsyncOptions): void;

    protected updateViewsBatch(opt?: Paper.UpdateViewsBatchOptions): Paper.RenderBatchStats;

    protected checkMountedViews(viewport: Paper.ViewportCallback | Paper.CellVisibilityCallback | null, opt?: Paper.UnmountOptions): number;

    protected checkUnmountedViews(viewport: Paper.ViewportCallback | Paper.CellVisibilityCallback | null, opt?: Paper.MountOptions): number;

    protected prioritizeCellViewMount(cellOrId: Graph.CellRef): boolean;

    protected prioritizeCellViewUnmount(cellOrId: Graph.CellRef): boolean;

    protected isViewMounted(viewOrCid: CellView | string): boolean;

    protected isAsync(): boolean;

    protected isIdle(): boolean;

    protected isExactSorting(): boolean;

    protected sortLayerViews(): void;

    protected sortLayerViewsExact(): void;

    protected pointerdblclick(evt: Event): void;

    protected pointerclick(evt: Event): void;

    protected contextmenu(evt: Event): void;

    protected pointerdown(evt: Event): void;

    protected pointermove(evt: Event): void;

    protected pointerup(evt: Event): void;

    protected mouseover(evt: Event): void;

    protected mouseout(evt: Event): void;

    protected mouseenter(evt: Event): void;

    protected mouseleave(evt: Event): void;

    protected mousewheel(evt: Event): void;

    protected onevent(evt: Event): void;

    protected onmagnet(evt: Event): void;

    protected onlabel(evt: Event): void;

    protected guard(evt: Event, view: CellView): boolean;

    protected drawBackgroundImage(img: HTMLImageElement | null, opt?: { [key: string]: any }): void;

    protected updateBackgroundColor(color?: string): void;

    protected updateBackgroundImage(opt: { position?: any, size?: any }): void;

    protected createViewForModel(cell: Cell, cid?: string): CellView;

    protected cloneOptions(): void;

    protected onCellAdded(cell: Cell, collection: mvc.Collection<Cell>, opt: Graph.Options): void;

    protected onCellRemoved(cell: Cell, collection: mvc.Collection<Cell>, opt: Graph.Options): void;

    protected onCellChanged(cell: Cell, opt: Cell.Options): void;
    protected onCellChanged(cell: mvc.Collection<Cell>, opt: Graph.Options): void;

    protected onGraphLayerAdd(layer: GraphLayer, collection: mvc.Collection<GraphLayer>, opt: Graph.Options): void;

    protected onGraphLayerRemove(layer: GraphLayer, collection: mvc.Collection<GraphLayer>, opt: Graph.Options): void;

    protected onGraphLayerCollectionReset(layer: mvc.Collection<GraphLayer>, opt: Graph.Options): void;

    protected onGraphLayerCollectionSort(layerCollection: mvc.Collection<GraphLayer>): void;

    protected onGraphReset(cells: mvc.Collection<Cell>, opt: Graph.Options): void;

    protected onGraphSort(): void;

    protected onGraphBatchStop(data?: { batchName: string }): void;

    protected onCellHighlight(cellView: CellView, magnetEl: SVGElement, opt?: { highlighter?: highlighters.HighlighterJSON }): void;

    protected onCellUnhighlight(cellView: CellView, magnetEl: SVGElement, opt?: { highlighter?: highlighters.HighlighterJSON }): void;

    protected onRemove(): void;

    protected removeView(cell: Cell): CellView;

    protected removeViews(): void;

    protected renderView(cell: Cell, opt?: { [key: string]: any }): CellView;

    protected resetViews(cells?: Cell[], opt?: { [key: string]: any }): void;

    protected insertView(cellView: CellView, isInitialInsert: boolean): void;

    protected _hideCellView(cellView: CellView): void;

    protected _detachCellView(cellView: CellView): void;

    protected customEventTrigger(event: Event, view: CellView, rootNode?: SVGElement): Event | null;

    protected addStylesheet(stylesheet: string): void;

    /**
     * @deprecated use `getLayerView(id).el` instead
     * **/
    getLayerNode(id: Paper.Layers | string): SVGElement;

    /**
     * @deprecated use `findElementViewsAtPoint()
     */
    findViewsFromPoint(point: string | Point): ElementView[];

    /**
     *  @deprecated use `findElementViewsInArea()
     */
    findViewsInArea(rect: BBox, opt?: { strict?: boolean }): ElementView[];

    /**
     * @deprecated use transformToFitContent
     */
    scaleContentToFit(opt?: Paper.ScaleContentOptions): void;

    /**
     * @deprecated Use `updateCellsVisibility()`
     */
    checkViewport(opt?: Paper.ScheduleCellsVisibilityUpdateOptions): Paper.UpdateVisibilityStats;

    /**
     * @deprecated Use `updateCellsVisibility()`
     */
    dumpViews(opt?: Paper.ScheduleCellsVisibilityUpdateOptions & Paper.UpdateViewsOptions): void;
}

export namespace LayerView {

    interface Options<T extends mvc.Model | undefined = undefined> extends mvc.ViewOptions<T, SVGElement> {
        id: string;
        paper: Paper;
        type?: string;
    }
}

export class LayerView<T extends mvc.Model | undefined = undefined> extends mvc.View<T, SVGElement> {

    constructor(opt?: LayerView.Options);

    options: LayerView.Options;

    pivotNodes: { [z: number]: Comment };

    insertSortedNode(node: SVGElement, z: number): void;

    insertNode(node: SVGElement): void;

    insertPivot(z: number): Comment;

    isEmpty(): boolean;

    reset(): void;

    setPaperReference(paper: Paper): void;

    unsetPaperReference(): void;

    protected removePivots(): void;

    protected afterPaperReferenceSet(paper: Paper): void;

    protected beforePaperReferenceUnset(paper: Paper): void;

    protected assertPaperReferenceSet(): void;
}

export namespace GraphLayer {

    type ID = string;

    interface Attributes extends mvc.ObjectHash {
        id: ID;
        type?: string;
    }
}

export class GraphLayer<C extends CellCollection = CellCollection, A extends GraphLayer.Attributes = GraphLayer.Attributes, S extends mvc.ModelSetOptions = ModelSetOptions> extends mvc.Model<A, S> {

    declare id: string;

    cellCollection: C;
    graph: Graph | null;

    constructor(attributes?: DeepPartial<A>, options?: mvc.ModelConstructorOptions<GraphLayer>);

    getCells(): Cell[];
}

export class GraphLayerView<T extends GraphLayer = GraphLayer> extends LayerView<T> {

    sort(): void;

    sortExact(): void;

    insertCellView(cellView: CellView): void;

    protected onCellMove(cell: Cell, opt: Graph.Options): void;

    protected onCellChange(cell: Cell, opt: Cell.Options): void;

    protected onCellCollectionSort(collection: CellCollection, opt: Graph.Options): void;

    protected onGraphBatchStop(data: any): void;
}

export namespace GridLayerView {

    interface Options extends LayerView.Options {
        patterns?: Record<string, Paper.GridOptions[]>;
    }
}

export class GridLayerView extends LayerView {

    setGrid(opt?: null | boolean | string | Paper.GridOptions | Paper.GridOptions[]): void;

    renderGrid(): void;

    updateGrid(): void;

    removeGrid(): void;
}

export namespace ToolsView {

    interface Options extends mvc.ViewOptions<undefined, SVGElement> {
        tools?: ToolView[];
        name?: string | null;
        relatedView?: CellView;
        component?: boolean;
        layer?: Paper.Layers | string | null;
        z?: number;
    }
}

export class ToolsView extends mvc.View<undefined, SVGElement> {

    constructor(opt?: ToolsView.Options);

    isRendered: boolean;

    options: ToolsView.Options;

    configure(opt?: ToolsView.Options): this;

    getName(): string | null;

    focusTool(tool: ToolView): this;

    blurTool(tool?: ToolView): this;

    show(): this;

    hide(): this;

    mount(): this;

    getLayer(): string | null;

    hasLayer(): boolean;
}

export namespace ToolView {

    type VisibilityCallback<V = CellView> = (this: ToolView, view: V, tool: ToolView) => boolean;

    interface Options<V = CellView> extends mvc.ViewOptions<undefined, SVGElement> {
        focusOpacity?: number;
        visibility?: VisibilityCallback<V>;
    }
}

export class ToolView<V = CellView> extends mvc.View<undefined, SVGElement> {

    name: string | null;
    parentView: ToolsView;
    relatedView: CellView;
    paper: Paper;

    constructor(opt?: ToolView.Options<V>);

    configure(opt?: ToolView.Options<V>): this;

    protected simulateRelatedView(el: SVGElement): void;

    show(): void;

    hide(): void;

    isVisible(): boolean;

    isExplicitlyVisible(): boolean;

    updateVisibility(): void;

    protected computeVisibility(): boolean;

    focus(): void;

    blur(): void;

    update(): void;

    isOverlay(): boolean;

    protected guard(evt: Event): boolean;
}


export namespace HighlighterView {

    type Constructor<T> = { new(): T };

    type NodeSelectorJSON = {
        selector?: string;
        port?: string;
        label?: number;
    };

    type NodeSelector = string | SVGElement | NodeSelectorJSON;

    interface Options extends mvc.ViewOptions<undefined, SVGElement> {
        layer?: Paper.Layers | string | null;
        z?: number;
    }
}

export class HighlighterView<Options extends mvc.ViewOptions<undefined, SVGElement> = HighlighterView.Options> extends mvc.View<undefined, SVGElement> {

    constructor(options?: Options);

    options: Options;

    UPDATABLE: boolean;
    MOUNTABLE: boolean;
    UPDATE_ATTRIBUTES: string[] | ((this: HighlighterView<Options>) => string[]);

    cellView: CellView;
    nodeSelector: HighlighterView.NodeSelector | null;
    node: SVGElement | null;
    updateRequested: boolean;
    postponedUpdate: boolean;
    transformGroup: Vectorizer | null;
    detachedTransformGroup: Vectorizer | null;

    protected findNode(cellView: CellView, nodeSelector: HighlighterView.NodeSelector): SVGElement | null;

    protected transform(): void;

    protected update(): void;

    protected highlight(cellView: CellView, node: SVGElement): void;

    protected unhighlight(cellView: CellView, node: SVGElement): void;

    protected listenToUpdateAttributes(cellView: CellView): void;

    protected onCellAttributeChange(): void;

    protected getNodeMatrix(cellView: CellView, node: SVGElement): SVGMatrix;

    static uniqueId(node: SVGElement, options?: any): string;

    static add<T extends HighlighterView>(
        this: HighlighterView.Constructor<T>,
        cellView: CellView,
        selector: HighlighterView.NodeSelector,
        id: string,
        options?: any
    ): T;

    static remove(
        cellView: CellView,
        id?: string
    ): void;

    static removeAll(
        paper: Paper,
        id?: string
    ): void;

    static get<T extends HighlighterView>(
        this: HighlighterView.Constructor<T>,
        cellView: CellView,
        id: string
    ): T | null;
    static get<T extends HighlighterView>(
        this: HighlighterView.Constructor<T>,
        cellView: CellView
    ): T[];

    static getAll<T extends HighlighterView = HighlighterView>(
        paper: Paper,
        id?: string
    ): T[];

    static has(cellView: CellView, id?: string): boolean;

    static update(cellView: CellView, id?: string): void;

    static transform(cellView: CellView, id?: string): void;

    static highlight(cellView: CellView, node: SVGElement, options?: any): void;

    static unhighlight(cellView: CellView, node: SVGElement, options?: any): void;

    protected static _addRef(cellView: CellView, id: string, view: HighlighterView): void;

    protected static _removeRef(cellView: CellView, id?: string): void;
}
