import type { dia } from '@joint/core';
import type { CellId } from './cell-id';
import type { GraphState } from '../store/graph-store';

/**
 * Cache interface for element view state.
 */
export interface ReactElementViewCache {
  elementViews: Record<CellId, dia.ElementView>;
}

/**
 * GraphStore reference interface for element view.
 */
export interface ReactElementViewGraphStoreRef {
  schedulePaperUpdate: () => void;
  readonly internalState: GraphState;
}

/**
 * Cache interface for link view state.
 */
export interface ReactLinkViewCache {
  linkViews: Record<CellId, dia.LinkView>;
  linksData: Record<string, SVGElement>;
}

/**
 * GraphStore reference interface for link view.
 */
export interface ReactLinkViewGraphStoreRef {
  schedulePaperUpdate: () => void;
  flushPendingUpdates: () => void;
}

/**
 * PaperStore reference interface for link view.
 */
export interface ReactLinkViewPaperStoreRef {
  getLinkLabelId: (linkId: CellId, labelIndex: number) => string;
}

/**
 * Extended Paper interface with React-specific properties for both element and link views.
 */
export interface ReactPaper extends dia.Paper {
  reactElementCache: ReactElementViewCache;
  reactElementGraphStore: ReactElementViewGraphStoreRef;
  reactLinkCache: ReactLinkViewCache;
  reactLinkGraphStore: ReactLinkViewGraphStoreRef;
  reactLinkPaperStore: ReactLinkViewPaperStoreRef;
}
