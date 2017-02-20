declare namespace joint {
  namespace dia {
    class Link extends Cell {
      markup: string;
      labelMarkup: string;
      toolMarkup: string;
      vertexMarkup: string;
      arrowHeadMarkup: string;

      constructor(attributes?: LinkAttributes, options?: any);
      disconnect(): this;
      label(index?: number): any;
      label(index: number, value: Label): this;
      reparent(options?: any): Element;
      findView(paper: Paper): LinkView;
      getSourceElement(): Element;
      getTargetElement(): Element;
      hasLoop(options?: { deep?: boolean }): boolean;
      applyToPoints(fn: Function, options?: any): this;
      getRelationshipAncestor(): Element;
      isLink(): boolean;
      isRelationshipEmbeddedIn(element: Element): boolean;
      scale(sx: number, sy: number, origin: Point, optionts?: any): this;
      translate(tx: number, ty: number, options?: any): this;
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
      getPointAtLength(length: number): Point; // Marked as public api in source but not in the documents
      createWatcher(endType: { id: string }): Function;
      findRoute(oldVertices: Point[]): Point[];
      getConnectionPoint(end: 'source' | 'target', selectorOrPoint: Element | Point, referenceSelectorOrPoint: Element | Point): Point;
      getPathData(vertices: Point[]): any;
      onEndModelChange(endType: 'source' | 'target', endModel?: Element, opt?: any): void;
      onLabelsChange(): void;
      onSourceChange(cell: Cell, sourceEnd: { id: string }, options: any): void;
      onTargetChange(cell: Cell, targetEnd: { id: string }, options: any): void;
      onToolsChange(): void;
      onVerticesChange(cell: Cell, changed: any, options: any): void;
      pointerdown(evt: Event, x: number, y: number): void;
      pointermove(evt: Event, x: number, y: number): void;
      pointerup(evt: Event, x: number, y: number): void;
      removeVertex(idx: number): this;
      render(): this;
      renderArrowheadMarkers(): this;
      renderLabels(): this;
      renderTools(): this;
      renderVertexMarkers(): this;
      startArrowheadMove(end: 'source' | 'target', options?: any): void;
      startListening(): void;
      update(model: any, attributes: any, options?: any): this;
      updateArrowheadMarkers(): this;
      updateAttributes(): void;
      updateConnection(options?: any): void;
      updateLabelPositions(): this;
      updateToolsPosition(): this;
    }
  }
}
