declare namespace joint {
  const version: string;

  namespace config {
    const classNamePrefix: string;
    const defaultTheme: string;
  }

  // `joint.dia` namespace.
  namespace dia {
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


    type Padding = number | {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number
    };

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

    interface Label {
      position: number;
      attrs?: TextAttrs;
    }

    interface LinkAttributes extends CellAttributes {
      source?: Point | {id: string, selector?: string, port?: string};
      target?: Point | {id: string, selector?: string, port?: string};
      labels?: Label[];
      vertices?: Point[];
      smooth?: boolean;
      attrs?: TextAttrs;
    }

    interface ManhattanRouterArgs {
      excludeTypes?: string[];
      excludeEnds?: 'source' | 'target';
      startDirections?: ['left' | 'right' | 'top' | 'bottom'];
      endDirections?: ['left' | 'right' | 'top' | 'bottom'];
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

  // `joint.ui` namespace.
  namespace ui {
  }

  // `joint.layout` namespace.
  namespace layout {
  }

  // `joint.shapes` namespace.
  namespace shapes {
  }

  // `joint.format` namespace.
  namespace format {
  }

  // `joint.connectors` namespace.
  namespace connectors {
  }

  // `joint.highlighters` namespace.
  namespace highlighters {
  }

  // `joint.routers` namespace.
  namespace routers {
  }

  // `joint.mvc` namespace.
  namespace mvc {
    namespace views {
    }
  }

  function setTheme(theme: string, opt: any);

  namespace util {

    namespace format {
      function number(specifier: string, value: number): string;
    }

    function hashCode(str: string): number;
    function uuid(): string;
    function guid(obj?: any): string;
    function nextFrame(callback: () => void, context?: any): number;
    function cancelFrame(requestId: number): void;
    function flattenObject(object: any, delim: string, stop: (node: any) => boolean): any;
    function getByPath(object: any, path: string, delim: string): any;
    function setByPath(object: any, path: string, value: any, delim: string): any;
    function unsetByPath(object: any, path: string, delim: string): any;
    function breakText(text: string, size: dia.Size, attrs?: dia.SVGAttributes, options?: { svgDocument?: SVGElement }): string;
    function normalizeSides(box: number | { x?: number, y?: number, height?: number, width?: number }): dia.BBox;
    function getElementBBox(el: Element): dia.BBox;
    function setAttributesBySelector(el: Element, attrs: dia.SVGAttributes): void;
    function sortElements(elements: Element[] | string | JQuery, comparator: (a: Element, b: Element) => number): Element[];
    function shapePerimeterConnectionPoint(linkView: dia.LinkView, view: dia.ElementView, magnet: SVGElement, ref: dia.Point): dia.Point;
    function imageToDataUri(url: string, callback: (err: Error, dataUri: string) => void): void;

    // Not documented but used in examples
    /** @deprecated use lodash _.defaultsDeep */
    function deepSupplement(objects: any, defaultIndicator?: any): any;

    // Private functions
    /** @deprecated use lodash _.assign */
    function mixin(objects: any[]): any;
    /** @deprecated use lodash _.defaults */
    function supplement(objects: any[]): any;
    /** @deprecated use lodash _.mixin  */
    function deepMixin(objects: any[]): any;
  }
}
