import type { CellId } from '../types/cell-id';
import type { FlatElementData, FlatLinkData } from '../types/data-types';

export type PaperControlState = {
  readonly draggingIds: Record<string, boolean>;
};
/**
 * Paper snapshot is a simple version counter.
 * Incremented on every view mount/unmount change to trigger React re-renders.
 */
export type PaperStoreState = {
  version: number;
  featuresState?: Record<string, unknown>;
  controlState?: PaperControlState;
};

/**
 * Public snapshot of the graph store containing elements and links.
 */
export interface GraphDataState<ElementData = FlatElementData, LinkData = FlatLinkData> {
  elements: Record<CellId, ElementData>;
  links: Record<CellId, LinkData>;
}

/**
 * Layout data for a single node (element).
 */
export interface ElementLayout {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly angle: number;
}

/**
 * Layout data for a single link.
 */
export interface LinkLayout {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly d: string;
}

/**
 * Size of a single element.
 */
export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

/**
 * Position of a single element.
 */
export interface ElementPosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Layout snapshot for all elements, split into sizes, positions, and angles.
 * Each record preserves its reference when unrelated properties change —
 * e.g. a position-only change does not create a new `sizes` object.
 */
export interface ElementsLayoutState {
  readonly sizes: Record<CellId, ElementSize>;
  readonly positions: Record<CellId, ElementPosition>;
  readonly angles: Record<CellId, number>;
  /** Total number of elements in the graph. */
  readonly count: number;
  /** Number of elements whose width and height are both > 1 (considered measured). */
  readonly observedElements: number;
  readonly measuredObservedElements: number;
  /** IDs of elements whose width or height was not provided by the user (auto-sized). */
  readonly autoSizedElementIds: ReadonlySet<CellId>;
}

/**
 * Layout snapshot for all links, keyed by paper ID then by link cell ID.
 */
export type LinksLayoutState = Record<string, Record<CellId, LinkLayout>>;

/**
 * Snapshot containing layout data for all elements and links (per paper).
 */
export interface GraphLayoutState {
  readonly elements: ElementsLayoutState;
  readonly links: LinksLayoutState;
}

/**
 * Full internal snapshot of the graph store.
 */
export interface GraphStoreInternalSnapshot {
  papers: Record<string, PaperStoreState>;
  resetVersion: number;
  graphFeaturesVersion: number;
}
