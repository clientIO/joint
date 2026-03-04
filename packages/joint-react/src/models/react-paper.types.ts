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
