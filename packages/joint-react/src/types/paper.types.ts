import type { dia } from '@joint/core';
import type { GraphState } from '../store/graph-store';
import type { PortElementsCacheEntry } from '../store/paper-store';

/**
 * Cache interface for element view state.
 */
export interface ReactElementViewCache {
  elementViews: Record<dia.Cell.ID, dia.ElementView>;
  portsData: Record<string, SVGElement>;
}

/**
 * GraphStore reference interface for element view.
 */
export interface ReactElementViewGraphStoreRef {
  schedulePaperUpdate: () => void;
  readonly internalState: GraphState;
}

/**
 * PaperStore reference interface for element view.
 */
export interface ReactElementViewPaperStoreRef {
  getNewPorts: (options: {
    state: GraphState;
    cellId: dia.Cell.ID;
    portElementsCache: Record<string, PortElementsCacheEntry>;
    portsData: Record<string, SVGElement>;
  }) => Record<string, SVGElement> | undefined;
}

/**
 * Cache interface for link view state.
 */
export interface ReactLinkViewCache {
  linkViews: Record<dia.Cell.ID, dia.LinkView>;
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
  getLinkLabelId: (linkId: dia.Cell.ID, labelIndex: number) => string;
}

/**
 * Extended Paper interface with React-specific properties for both element and link views.
 */
export interface ReactPaper extends dia.Paper {
  reactElementCache: ReactElementViewCache;
  reactElementGraphStore: ReactElementViewGraphStoreRef;
  reactElementPaperStore: ReactElementViewPaperStoreRef;
  reactLinkCache: ReactLinkViewCache;
  reactLinkGraphStore: ReactLinkViewGraphStoreRef;
  reactLinkPaperStore: ReactLinkViewPaperStoreRef;
}
