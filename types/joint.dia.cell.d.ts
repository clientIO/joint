declare namespace joint {
  namespace dia {
    class Cell extends Backbone.Model {
      id: string;
      toJSON(): any;
      remove(options?: { disconnectLinks?: boolean }): this;
      toFront(options?: { deep?: boolean }): this;
      toBack(options?: { deep?: boolean }): this;
      getAncestors(): Cell[];
      isEmbeddedIn(element: Element, options?: { deep: boolean }): boolean;
      prop(key: string): any;
      prop(object: any): this;
      prop(key: string, value: any, options?: any): this;
      removeProp(path: string, options?: any): this;
      attr(key: string): any;
      attr(object: SVGAttributes): this;
      attr(key: string, value: any): this;
      clone(): Cell;
      clone(opt: { deep?: boolean }): Cell | Cell[];
      removeAttr(path: string | string[], options?: any): this;
      transition(path: string, value?: any, options?: TransitionOptions, delim?: string): number;
      getTransitions(): string[];
      stopTransitions(path?: string, delim?: string): this;
      addTo(graph: Graph, options?: any): this;
      isLink(): boolean;
      embed(cell: Cell, options?: any): this;
      findView(paper: Paper): CellView;
      getEmbeddedCells(options?: any): Cell[];
      initialize(options?: any): void;
      isElement(): boolean;
      isEmbedded(): boolean;
      processPorts(): void;
      startBatch(name: string, options?: any): this;
      stopBatch(name: string, options?: any): this;
      unembed(cell: Cell, options?: any): this;
    }

    interface GradientOptions {
      type: 'linearGradient' | 'radialGradient';
      stops: Array<{
        offset: string;
        color: string;
        opacity?: number;
      }>;
    }
    class CellViewGeneric<T extends Backbone.Model> extends Backbone.View<T> {
      getBBox(options?: { useModelGeometry?: boolean }): BBox;
      highlight(el?: any, options?: any): this;
      unhighlight(el?: any, options?: any): this;
      applyFilter(selector: string | HTMLElement, filter: Object): void;
      applyGradient(selector: string | HTMLElement, attr: 'fill' | 'stroke', gradient: GradientOptions): void;
      can(feature: string): boolean;
      findBySelector(selector: string): JQuery;
      findMagnet(el: any): HTMLElement;
      getSelector(el: HTMLElement, prevSelector: string): string;
      getStrokeBBox(el: any): BBox; // string|HTMLElement|Vectorizer
      mouseout(evt: Event): void;
      mouseover(evt: Event): void;
      mousewheel(evt: Event, x: number, y: number, delta: number): void
      notify(eventName: string): void;
      onChangeAttrs(cell: Cell, attrs: Backbone.ViewOptions<T>, options?: any): this;
      onSetTheme(oldTheme: string, newTheme: string): void;
      pointerclick(evt: Event, x: number, y: number): void;
      pointerdblclick(evt: Event, x: number, y: number): void;
      pointerdown(evt: Event, x: number, y: number): void;
      pointermove(evt: Event, x: number, y: number): void;
      pointerup(evt: Event, x: number, y: number): void;
      remove(): this;
      setInteractivity(value: any): void;
      setTheme(theme: string, options?: any): this;
    }

    class CellView extends CellViewGeneric<Cell> { }
  }
}

