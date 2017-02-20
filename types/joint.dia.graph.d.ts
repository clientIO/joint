declare namespace joint {
  namespace dia {
    class Graph extends Backbone.Model {
      constructor(attributes?: any, options?: { cellNamespace: any });
      addCell(cell: Cell | Cell[]): this;
      addCells(cells: Cell[]): this;
      resetCells(cells: Cell[], options?: any): this;
      getCell(id: string): Cell;
      getElements(): Element[];
      getLinks(): Link[];
      getCells(): Cell[];
      getFirstCell(): Cell;
      getLastCell(): Cell;
      getConnectedLinks(element: Cell, options?: { inbound?: boolean, outbound?: boolean, deep?: boolean }): Link[];
      disconnectLinks(cell: Cell, options?: any): void;
      removeLinks(cell: Cell, options?: any): void;
      translate(tx: number, ty?: number, options?: TranslateOptions): void;
      cloneCells(cells: Cell[]): { [id: string]: Cell };
      getSubgraph(cells: Cell[], options?: { deep?: boolean }): Cell[];
      cloneSubgraph(cells: Cell[], options?: { deep?: boolean }): { [id: string]: Cell };
      dfs(element: Element, iteratee: (element: Element, distance: number) => boolean, options?: DfsBfsOptions, visited?: Object, distance?: number): void;
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
      toJSON(): any;
      fromJSON(json: any, options?: any): this;
      clear(options?: any): this;
      findModelsFromPoint(rect: BBox): Element[];
      findModelsUnderElement(element: Element, options?: { searchBy?: 'bbox' | 'center' | 'origin' | 'corner' | 'topRight' | 'bottomLeft' }): Element[];
      getBBox(elements: Element[], options?: any): BBox;
      toGraphLib(): any; // graphlib graph object
      findModelsInArea(rect: BBox, options?: any): BBox | boolean;
      getCellsBBox(cells: Cell[], options?: any): BBox;
      getInboundEdges(node: string): Object;
      getOutboundEdges(node: string): Object;
      hasActiveBatch(name?: string): number | boolean;
      maxZIndex(): number;
      removeCells(cells: Cell[], options?: any): this;
      resize(width: number, height: number, options?: number): this;
      resizeCells(width: number, height: number, cells: Cell[], options?: number): this;
      set(key: Object | string, value: any, options?: any): this;
      startBatch(name: string, data?: Object): any;
      stopBatch(name: string, data?: Object): any;
    }
  }
}
