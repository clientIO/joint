import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { RenderElement, RenderLink } from '../components';
import type { PortalSelector } from '../models/portal-paper.types';
import type { GraphStore } from './graph-store';
import { PortalPaper } from '../models/portal-paper';
import type { Feature } from '../types/feature.types';
import type { IncrementalChange } from '../state/incremental.types';
import type { PaperStoreState } from './graph-store';
import { simpleScheduler } from '../utils/scheduler';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly graphStore: GraphStore<any, any>;
  /** Unique identifier for this paper instance */
  readonly id: string;
}

/**
 * Creates an initial paper state.
 * Starts at version 1 to avoid falsy zero issues.
 * Returns a new object each time to prevent shared-reference mutations.
 */
export function getDefaultPaperState(): PaperStoreState {
  return { version: 1 };
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

  /** Link changes pending flush — populated by clearView, flushed in afterRender. */
  private pendingLinkChanges: Map<string, IncrementalChange<dia.Cell>> = new Map();

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
      // Create a new PortalPaper instance
      // PortalPaper handles view lifecycle internally via insertView/removeView
      // NOTE: We don't use cellVisibility to hide links because JointJS's
      // unmountedList.rotate() causes O(n) checks per frame when returning false.
      // Link visibility should be handled in React layer instead.
      const paper = new PortalPaper({
        model: graph,
        id,
        portalSelector,
        afterRender: (() => {
          // Re-entrance guard to prevent infinite loops
          let isProcessing = false;
          const store = this;
          return function (this: PortalPaper) {
            if (isProcessing) {
              return;
            }
            isProcessing = true;

            // Check if any pending links can now be shown
            this.checkPendingLinks();

            // Flush pending link changes — link views now have correct geometry
            // after JointJS finished its async render cycle.
            store.flushPendingLinkChanges(graphStore);

            isProcessing = false;
          };
        })(),
        ...paperOptions,
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
   * Queues link changes for flush after the next JointJS render cycle.
   * @param changes - Link changes to queue
   */
  public addPendingLinkChanges(changes: Map<string, IncrementalChange<dia.Cell>>): void {
    for (const [id, change] of changes) {
      this.pendingLinkChanges.set(id, change);
    }
  }

  /**
   * Flushes pending link changes via setPaperViews so React re-reads correct link layout.
   * Called from afterRender when JointJS has finished rendering.
   */
  private flushPendingLinkChanges(graphStore: GraphStore): void {
    simpleScheduler(() => {
      if (this.pendingLinkChanges.size === 0) {
        return;
      }
      const changes = this.pendingLinkChanges;
      this.pendingLinkChanges = new Map();
      graphStore.setPaperViews(this.paperId, changes);
    });
  }

  public getElementView(id: CellId): dia.ElementView | undefined {
    return this.paper.getElementView(id);
  }

  public getLinkView(id: CellId): dia.LinkView | undefined {
    return this.paper.getLinkView(id);
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
