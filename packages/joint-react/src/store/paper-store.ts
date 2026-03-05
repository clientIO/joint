import { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { RenderElement, RenderLink } from '../components';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import type { GraphStore } from './graph-store';
import { ReactPaper } from '../models/react-paper';
import { connectionPoint } from './default-connection-point';
import { measureNode } from './default-measure-node';

const DEFAULT_CLICK_THRESHOLD = 10;
type PaperHighlighting = Extract<dia.Paper.Options['highlighting'], Record<string, unknown>>;

const DEFAULT_PORT_HIGHLIGHTING: PaperHighlighting = {
  [dia.CellView.Highlighting.DEFAULT]: {
    name: 'stroke',
    options: {
      padding: 3,
    },
  },
  [dia.CellView.Highlighting.MAGNET_AVAILABILITY]: {
    name: 'stroke',
    options: {
      padding: 4,
      attrs: {
        stroke: '#DDE6ED',
        'stroke-width': 2,
      },
    },
  },
  [dia.CellView.Highlighting.ELEMENT_AVAILABILITY]: {
    name: 'addClass',
    options: {
      className: 'available-cell',
    },
  },
};
/**
 * Options for adding a new paper instance to the graph store.
 */
export interface AddPaperOptions {
  /** JointJS Paper configuration options */
  readonly paperOptions: dia.Paper.Options;
  /** Optional initial scale for the paper */
  readonly scale?: number;
  /** Optional custom renderer for elements */
  readonly renderElement?: RenderElement<FlatElementData>;
  /** Optional custom renderer for links */
  readonly renderLink?: RenderLink<FlatLinkData>;
}

/**
 * Options for creating a PaperStore instance.
 * Extends AddPaperOptions with required graph store and ID.
 */
export interface PaperStoreOptions extends AddPaperOptions {
  /** The graph store instance this paper belongs to */
  readonly graphStore: GraphStore;
  /** Unique identifier for this paper instance */
  readonly id: string;
}

/**
 * Snapshot of paper-specific state.
 * Contains serializable metadata for paper view state.
 */
export interface PaperStoreSnapshot {
  /** True once this paper has emitted at least one view snapshot */
  readonly hasElementViewSnapshot: boolean;
  /** IDs of mounted element views in this paper */
  readonly elementViewIds: Record<CellId, true>;
  /** IDs of mounted link views in this paper */
  readonly linkViewIds: Record<CellId, true>;
}

/**
 * Creates an empty paper snapshot.
 * @returns Empty serializable paper metadata snapshot.
 */
export function createPaperStoreSnapshot(): PaperStoreSnapshot {
  return {
    hasElementViewSnapshot: false,
    elementViewIds: {},
    linkViewIds: {},
  };
}

/**
 * Creates a record map of `CellId -> true` from a keyed object.
 * @param values - Object keyed by cell ids.
 * @returns Plain lookup record with boolean markers.
 */
function toCellIdRecord(values: Record<CellId, unknown>): Record<CellId, true> {
  const ids: Record<CellId, true> = {};
  for (const id of Object.keys(values)) {
    ids[id as CellId] = true;
  }
  return ids;
}

/**
 * Store for managing a single Paper instance and its associated state.
 *
 * Each Paper component creates a PaperStore instance that:
 * - Manages the JointJS Paper instance
 * - Tracks element views for rendering
 * - Coordinates with the GraphStore for state updates
 */
export class PaperStore {
  /** The underlying JointJS Paper instance with React-specific properties */
  public paper: ReactPaper;
  /** Unique identifier for this paper instance */
  public paperId: string;
  /** Optional custom element renderer */
  public renderElement?: RenderElement<FlatElementData>;
  /** Optional custom link renderer */
  public renderLink?: RenderLink<FlatLinkData>;

  /**
   * Cleanup function to unregister paper update callback from GraphStore.
   * @internal
   */
  private unregisterPaperUpdate?: () => void;

  constructor(options: PaperStoreOptions) {
    const { graphStore, paperOptions = {}, scale, renderElement, renderLink, id } = options;
    const { width, height } = paperOptions;
    const { graph } = graphStore;
    const hasHighlightingOverride = typeof paperOptions.highlighting === 'object';
    const highlightingOverride = hasHighlightingOverride
      ? (paperOptions.highlighting as PaperHighlighting)
      : undefined;

    const mergedHighlighting: dia.Paper.Options['highlighting'] =
      paperOptions.highlighting === false
        ? false
        : {
            ...DEFAULT_PORT_HIGHLIGHTING,
            ...highlightingOverride,
          };
    this.paperId = id;
    this.renderElement = renderElement;
    this.renderLink = renderLink;
    const cache: {
      elementViews: Record<CellId, dia.ElementView>;
      linkViews: Record<CellId, dia.LinkView>;
      linksData: Record<string, SVGElement>;
    } = {
      elementViews: {},
      linkViews: {},
      linksData: {},
    };
    let previousElementViews = cache.elementViews;
    let previousLinkViews = cache.linkViews;
    // Register paper update callback with GraphStore's unified scheduler
    // This ensures paper updates are batched together with link/port updates
    const paperUpdateCallback = () => {
      const areElementViewsChanged = previousElementViews !== cache.elementViews;
      const areLinkViewsChanged = previousLinkViews !== cache.linkViews;
      if (!areElementViewsChanged && !areLinkViewsChanged) {
        return;
      }
      previousElementViews = cache.elementViews;
      previousLinkViews = cache.linkViews;
      const elementViewIds = toCellIdRecord(cache.elementViews);
      const linkViewIds = toCellIdRecord(cache.linkViews);
      graphStore.updatePaperSnapshot(options.id, (current) => {
        const base = current ?? createPaperStoreSnapshot();
        return {
          ...base,
          hasElementViewSnapshot: true,
          elementViewIds,
          linkViewIds,
        };
      });
    };
    this.unregisterPaperUpdate = graphStore.registerPaperUpdate(paperUpdateCallback);
    // Create a new ReactPaper instance
    // ReactPaper handles view lifecycle internally via insertView/removeView
    // NOTE: We don't use cellVisibility to hide links because JointJS's
    // unmountedList.rotate() causes O(n) checks per frame when returning false.
    // Link visibility should be handled in React layer instead.
    const paper = new ReactPaper({
      async: true,
      sorting: dia.Paper.sorting.APPROX,
      preventDefaultBlankAction: false,
      frozen: true,
      model: graph,
      afterRender: (() => {
        // Re-entrance guard to prevent infinite loops
        let isProcessing = false;
        return function (this: ReactPaper) {
          if (isProcessing) {
            return;
          }
          isProcessing = true;

          // Check if any pending links can now be shown
          this.checkPendingLinks();

          isProcessing = false;
        };
      })(),
      defaultConnectionPoint: connectionPoint,
      measureNode: measureNode as unknown as dia.Paper.Options['measureNode'],
      ...paperOptions,
      highlighting: mergedHighlighting,
      markAvailable: paperOptions.markAvailable ?? true,
      clickThreshold: paperOptions.clickThreshold ?? DEFAULT_CLICK_THRESHOLD,
      autoFreeze: true,
      viewManagement: {
        disposeHidden: true,
        lazyInitialize: true,
      },
      graphStore,
    });

    // Attach React-specific properties to the paper for view access
    paper.reactElementCache = {
      get elementViews() {
        return cache.elementViews;
      },
      set elementViews(value) {
        cache.elementViews = value;
      },
    };
    paper.reactElementGraphStore = {
      schedulePaperUpdate: () => graphStore.schedulePaperUpdate(),
      get internalState() {
        return graphStore.internalState;
      },
    };
    paper.reactLinkCache = {
      get linkViews() {
        return cache.linkViews;
      },
      set linkViews(value) {
        cache.linkViews = value;
      },
      get linksData() {
        return cache.linksData;
      },
      set linksData(value) {
        cache.linksData = value;
      },
    };
    paper.reactLinkGraphStore = {
      schedulePaperUpdate: () => graphStore.schedulePaperUpdate(),
      flushPendingUpdates: () => graphStore.flushPendingUpdates(),
    };
    paper.reactLinkPaperStore = {
      getLinkLabelId: this.getLinkLabelId,
    };

    this.paper = paper;

    if (scale !== undefined) {
      this.paper.scale(scale);
    }

    if (width !== undefined && height !== undefined) {
      this.paper.setDimensions(width, height);
    }
    this.paper.unfreeze();
  }

  /**
   * Generates a unique link label ID by combining link ID and label index.
   * @param linkId - The ID of the link containing the label
   * @param labelIndex - The index of the label in the labels array
   * @returns A unique identifier for the link label
   */
  public getLinkLabelId(linkId: CellId, labelIndex: number) {
    return `${linkId}-label-${labelIndex}`;
  }

  public getElementView(id: CellId): dia.ElementView | undefined {
    return this.paper.reactElementCache.elementViews[id];
  }

  public getLinkView(id: CellId): dia.LinkView | undefined {
    return this.paper.reactLinkCache.linkViews[id];
  }

  public hasElementView(id: CellId): boolean {
    return !!this.getElementView(id);
  }

  public hasLinkView(id: CellId): boolean {
    return !!this.getLinkView(id);
  }

  /**
   * Cleans up the paper instance and all associated resources.
   * Should be called when the paper is being removed from the graph store.
   */
  public destroy = () => {
    // Unregister from GraphStore's update scheduler
    this.unregisterPaperUpdate?.();
    this.unregisterPaperUpdate = undefined;

    // Remove the JointJS paper instance - this cleans up:
    // - All event listeners on the paper
    // - All cell views
    // - The paper's DOM element
    this.paper.remove();
  };
}
