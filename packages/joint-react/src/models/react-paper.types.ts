import type { dia } from '@joint/core';
import type { GraphStore } from '../store/graph-store';

/**
 * Options for creating a ReactPaper instance.
 * Extends dia.Paper.Options with required graphStore reference.
 */
export interface ReactPaperOptions extends dia.Paper.Options {
  /** Reference to the GraphStore for scheduling updates */
  readonly graphStore: GraphStore;
}

/**
 * Extended Paper class with React-specific view management.
 * Uses reactElementCache and reactLinkCache to track mounted views for portal rendering.
 */
export interface IReactPaper extends dia.Paper {
  /** Cache for element views - managed by ReactPaper */
  readonly reactElementCache: {
    elementViews: Record<dia.Cell.ID, dia.ElementView>;
  };
  /** Cache for link views - managed by ReactPaper */
  readonly reactLinkCache: {
    linkViews: Record<dia.Cell.ID, dia.LinkView>;
    linksData: Record<string, SVGElement>;
  };
}
