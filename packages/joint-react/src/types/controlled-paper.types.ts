import type { dia } from '@joint/core';

/**
 * Types of external elements that can be registered with ControlledPaper.
 * These represent the DOM elements that React will manage instead of JointJS.
 */
export type ExternalElementType =
  | 'svg'
  | 'defs'
  | 'layers'
  | 'grid-layer'
  | 'back-layer'
  | 'cells-layer'
  | 'labels-layer'
  | 'front-layer'
  | 'tools-layer'
  | 'element'
  | 'link';

/**
 * External DOM elements that can be provided to ControlledPaper at construction time.
 * When provided, ControlledPaper will use these elements instead of creating its own.
 */
export interface ExternalElements {
  /** The main SVG element */
  readonly svg?: SVGSVGElement;
  /** The defs element for definitions */
  readonly defs?: SVGDefsElement;
  /** The layers container element */
  readonly layers?: SVGGElement;
  /** The background div element */
  readonly background?: HTMLDivElement;
}

/**
 * Options for ControlledPaper extending standard Paper options.
 */
export interface ControlledPaperOptions extends dia.Paper.Options {
  /**
   * When true, ControlledPaper will not create DOM elements for cells.
   * All cell elements must be registered externally via React.
   * @default true
   */
  readonly controlled?: boolean;

  /**
   * External DOM elements to use instead of creating new ones.
   * When provided, ControlledPaper will use these elements for its structure
   * instead of creating its own during render().
   */
  readonly externalElements?: ExternalElements;

  /**
   * When true, React will render links (via renderLink prop).
   * LinkView DOM methods are overridden to prevent JointJS rendering.
   * When false, JointJS renders links natively with standard LinkView.
   * @default true
   */
  readonly reactRendersLinks?: boolean;
}
