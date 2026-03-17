import { dia } from '@joint/core';
import { isRecord } from '../utils/is';
import type { CellId } from '../types/cell-id';
import type { RenderElement, RenderLink } from '../components';
import type { PortalSelector } from '../models/portal-paper.types';
import type { GraphStore } from './graph-store';
import { PortalPaper } from '../models/portal-paper';
import { connectionPoint } from './default-connection-point';
import { measureNode } from './default-measure-node';
import type { Feature } from '../hooks/use-create-paper-features';
import type { IncrementalChange } from '../state/incremental.types';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly renderElement?: RenderElement<any>;
  /** Optional custom renderer for links */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly renderLink?: RenderLink<any>;

  /** Optional selector for locating React portal targets within cell views */
  readonly portalSelector?: PortalSelector;

  /**
   * Pre-created PortalPaper instance to adopt.
   * When provided, PaperStore wraps this paper instead of creating a new one.
   */
  readonly paper?: PortalPaper;
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
  /** IDs of mounted element views in this paper */
  readonly elementViewIds: Record<CellId, true>;
  /** IDs of mounted link views in this paper */
  readonly linkViewIds: Record<CellId, true>;
  /** Incremented on every paper snapshot to trigger updates in derived state */
  readonly version: number;
}

/**
 * Creates an empty paper snapshot.
 * @returns Empty serializable paper metadata snapshot.
 */
export function createPaperStoreSnapshot(): PaperStoreSnapshot {
  return {
    elementViewIds: {},
    linkViewIds: {},
    version: 0,
  };
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
  public paper: PortalPaper;
  /** Unique identifier for this paper instance */
  public paperId: string;
  /** Optional custom element renderer */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public renderElement?: RenderElement<any>;
  /** Optional custom link renderer */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public renderLink?: RenderLink<any>;

  public features: Record<string, Feature> = {};

  constructor(options: PaperStoreOptions) {
    const {
      graphStore,
      paperOptions = {},
      scale,
      renderElement,
      renderLink,
      id,
      portalSelector,
      paper: externalPaper,
    } = options;

    this.paperId = id;
    this.renderElement = renderElement;
    this.renderLink = renderLink;

    if (externalPaper) {
      // Adopt an externally created PortalPaper (e.g. from PortalStencil).
      // Hook into view mount changes so the GraphStore stays in sync.
      externalPaper.onViewMountChange = (changes: Map<string, IncrementalChange<dia.Cell>>) => {
        graphStore.setPaperViews(this.paperId, changes);
      };
      this.paper = externalPaper;
    } else {
      const { graph } = graphStore;
      const hasHighlightingOverride = isRecord(paperOptions.highlighting);
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
      // Create a new PortalPaper instance
      // PortalPaper handles view lifecycle internally via insertView/removeView
      // NOTE: We don't use cellVisibility to hide links because JointJS's
      // unmountedList.rotate() causes O(n) checks per frame when returning false.
      // Link visibility should be handled in React layer instead.
      const paper = new PortalPaper({
        async: true,
        sorting: dia.Paper.sorting.APPROX,
        preventDefaultBlankAction: false,
        frozen: true,
        model: graph,
        id,
        portalSelector,
        afterRender: (() => {
          // Re-entrance guard to prevent infinite loops
          let isProcessing = false;
          return function (this: PortalPaper) {
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
        onViewMountChange: (changes: Map<string, IncrementalChange<dia.Cell>>) => {
          graphStore.setPaperViews(this.paperId, changes);
        },
      });

      this.paper = paper;
    }

    if (scale !== undefined) {
      this.paper.scale(scale);
    }
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
    return this.paper.getElementView(id);
  }

  public getLinkView(id: CellId): dia.LinkView | undefined {
    return this.paper.getLinkView(id);
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
    // Remove the JointJS paper instance - this cleans up:
    // - All event listeners on the paper
    // - All cell views
    // - The paper's DOM element
    this.paper.remove();

    // Clear registered features
    for (const feature of Object.values(this.features)) {
      feature.clean?.();
    }
  };
}
