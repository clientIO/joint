declare namespace joint {
    namespace dia {
        interface PaperOptions extends Backbone.ViewOptions<Graph> {
            el?: string | JQuery | HTMLElement;
            width?: number;
            height?: number;
            origin?: Point;
            gridSize?: number;
            perpendicularLinks?: boolean;
            elementView?: (element: Element) => ElementView | ElementView;
            linkView?: (link: Link) => LinkView | LinkView;
            defaultLink?: ((cellView: CellView, magnet: SVGElement) => Link) | Link;
            defaultRouter?: ((vertices: Point[], args: Object, linkView: LinkView) => Point[]) | { name: string, args?: ManhattanRouterArgs };
            defaultConnector?: ((sourcePoint: Point, targetPoint: Point, vertices: Point[], args: Object, linkView: LinkView) => string) | { name: string, args?: { radius?: number } };
            interactive?: ((cellView: CellView, event: string) => boolean) | boolean | { vertexAdd?: boolean, vertexMove?: boolean, vertexRemove?: boolean, arrowheadMove?: boolean };
            validateMagnet?: (cellView: CellView, magnet: SVGElement) => boolean;
            validateConnection?: (cellViewS: CellView, magnetS: SVGElement, cellViewT: CellView, magnetT: SVGElement, end: 'source' | 'target', linkView: LinkView) => boolean;
            linkConnectionPoint?: (linkView: LinkView, view: ElementView, magnet: SVGElement, reference: Point) => Point;
            snapLinks?: boolean | { radius: number };
            linkPinning?: boolean;
            markAvailable?: boolean;
            async?: boolean | { batchSize: number };
            embeddingMode?: boolean;
            validateEmbedding?: (childView: ElementView, parentView: ElementView) => boolean;
            restrictTranslate?: ((elementView: ElementView) => BBox) | boolean;
            guard?: (evt: Event, view: CellView) => boolean;
            multiLinks?: boolean;
            cellViewNamespace?: Object;
            /** useful undocumented option */
            clickThreshold?: number;
        }

        class Paper extends Backbone.View<Graph> {
            constructor(options?: PaperOptions);
            options: PaperOptions;
            svg: SVGElement;
            viewport: SVGGElement;
            defs: SVGDefsElement;
            setDimensions(width: number, height: number): void;
            setOrigin(x: number, y: number): void;
            scale(sx: number, sy?: number, ox?: number, oy?: number): this;
            findView(element: any): CellView;
            findViewByModel(model: Cell | string): CellView;
            findViewsFromPoint(point: Point): ElementView[];
            findViewsInArea(rect: BBox, options?: { strict?: boolean }): CellView[];
            fitToContent(options?: FitToContentOptions): void;
            scaleContentToFit(options?: ScaleContentOptions): void;
            getContentBBox(): BBox;
            clientToLocalPoint(p: Point): Point;
            rotate(deg: number, ox?: number, oy?: number): Paper;
            afterRenderViews(): void;
            asyncRenderViews(cells: Cell[], options?: any): void;
            beforeRenderViews(cells: Cell[]): Cell[];
            cellMouseout(evt: Event): void;
            cellMouseover(evt: Event): void;
            clearGrid(): this;
            contextmenu(evt: Event): void;
            createViewForModel(cell: Cell): CellView;
            drawGrid(options?: any): this;
            fitToContent(gridWidth?: number, gridHeight?: number, padding?: number, options?: any): void;
            getArea(): BBox;
            getDefaultLink(cellView: CellView, magnet: HTMLElement): Link;
            getModelById(id: string): Cell;
            getRestrictedArea(): BBox;
            guard(evt: Event, view: CellView): boolean;
            linkAllowed(linkViewOrModel: LinkView | Link): boolean;
            mouseclick(evt: Event): void;
            mousedblclick(evt: Event): void;
            mousewheel(evt: Event): void;
            onCellAdded(cell: Cell, graph: Graph, options: Object): void;
            onCellHighlight(cellView: CellView, magnetEl: HTMLElement, options?: any): void;
            onCellUnhighlight(cellView: CellView, magnetEl: HTMLElement, options?: any): void;
            onRemove(): void;
            pointerdown(evt: Event): void;
            pointermove(evt: Event): void;
            pointerup(evt: Event): void;
            remove(): this;
            removeView(cell: Cell): CellView;
            removeViews(): void;
            renderView(cell: Cell): CellView;
            resetViews(cellsCollection: Cell[], options: any): void;
            resolveHighlighter(options?: any): boolean | Object;
            setGridSize(gridSize: number): this;
            setInteractivity(value: any): void;
            snapToGrid(p: Point): Point;
            sortViews(): void;
        }
    }
}
