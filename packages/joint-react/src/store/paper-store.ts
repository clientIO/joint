import type { dia } from '@joint/core';
import type { CellId } from '../types/cell.types';
import type { RenderElement, RenderLink } from '../components';
import type { PortalSelector } from '../mvc/paper.types';
import type { GraphStore } from './graph-store';
import { PaperView } from '../mvc/paper';
import type { Feature } from '../types/feature.types';
import type { IncrementalChange } from '../state/incremental.types';
import type { PaperStoreState } from './graph-store';
import { simpleScheduler } from '../utils/scheduler';
import { toSVGMatrix } from '../utils/transform';
import type { PaperTransform } from '../components/paper/paper.types';

/**
 * Options for adding a new paper instance to the graph store.
 */
export interface AddPaperOptions {
  /** JointJS Paper configuration options */
  readonly paperOptions: dia.Paper.Options;
  /** Optional initial transform for the paper (CSS string or `DOMMatrix`). */
  readonly transform?: PaperTransform;
  /** Optional custom renderer for elements */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly renderElement?: RenderElement<any>;
  /** Optional custom renderer for links */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly renderLink?: RenderLink<any>;

  /** Optional selector for locating React portal targets within cell views */
  readonly portalSelector?: PortalSelector;

  /**
   * Pre-created PaperView instance to adopt.
   * When provided, PaperStore wraps this paper instead of creating a new one.
   */
  readonly paper?: PaperView;
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
  public paper: PaperView;
  /** Unique identifier for this paper instance */
  public paperId: string;
  /** Optional custom element renderer */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public renderElement?: RenderElement<any>;
  /** Optional custom link renderer */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public renderLink?: RenderLink<any>;

  public features: Record<string, Feature> = {};

  /**
   * True when this store adopted a pre-created paper (e.g. `<Stencil>`'s drag
   * paper) instead of creating its own. The adopting wrapper does not own the
   * paper's lifecycle, so it must not remove it on `destroy()`.
   */
  private readonly isAdoptedPaper: boolean;
  /**
   * The native `cellVisibility` callback resolved from the `<Paper>`
   * `cellVisibility` prop. Kept current on every prop change regardless of
   * ownership, so a feature that claims the option (see
   * {@link claimCellVisibility}) always has access to the latest value.
   */
  public nativeCellVisibility: dia.Paper.Options['cellVisibility'];

  /**
   * Feature id that currently owns `paper.options.cellVisibility`, or `null`
   * when no feature owns it. While owned, the Paper component stops writing
   * `cellVisibility` onto the paper and instead routes
   * {@link nativeCellVisibility} to the owner. Generic — the store has no
   * knowledge of which feature claims it.
   */
  private cellVisibilityOwner: string | null = null;

  /** Link changes pending flush — populated by clearView, flushed in afterRender. */
  private pendingLinkChanges: Map<CellId, IncrementalChange<dia.Cell>> = new Map();

  constructor(options: PaperStoreOptions) {
    const {
      graphStore,
      paperOptions = {},
      transform,
      renderElement,
      renderLink,
      id,
      portalSelector,
      paper: externalPaper,
    } = options;

    this.paperId = id;
    this.renderElement = renderElement;
    this.renderLink = renderLink;
    this.isAdoptedPaper = !!externalPaper;

    if (externalPaper) {
      // Adopt an externally created PaperView (e.g. from PortalStencil).
      // Hook into view mount changes so the GraphStore stays in sync.
      externalPaper.onViewMountChange = (changes: Map<CellId, IncrementalChange<dia.Cell>>) => {
        graphStore.setPaperViews(this.paperId, changes);
      };
      this.paper = externalPaper;
    } else {
      const { graph } = graphStore;
      // Create a new PaperView instance
      // PaperView handles view lifecycle internally via insertView/removeView
      // NOTE: We don't use cellVisibility to hide links because JointJS's
      // unmountedList.rotate() causes O(n) checks per frame when returning false.
      // Link visibility should be handled in React layer instead.
      const paper = new PaperView({
        model: graph,
        id,
        portalSelector,
        afterRender: (() => {
          // Re-entrance guard to prevent infinite loops
          let isProcessing = false;
          // `afterRender` is invoked by JointJS with the `PaperView` as its
          // `this`, so we cannot use an arrow function; we must capture the
          // outer `PaperStore` instance to call `flushPendingLinkChanges`.
          // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
          const store = this;
          return function (this: PaperView) {
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
        onViewMountChange: (changes: Map<CellId, IncrementalChange<dia.Cell>>) => {
          graphStore.setPaperViews(this.paperId, changes);
        },
      });

      this.paper = paper;
    }

    // Seed the resolved native callback from the paper's initial option so
    // `releaseCellVisibility` restores a correct value even before any
    // prop-update effect runs (or when the store is used without the hook).
    this.nativeCellVisibility = this.paper.options.cellVisibility;

    if (transform !== undefined) {
      this.paper.matrix(toSVGMatrix(transform));
    }
  }

  /**
   * Queues link changes for flush after the next JointJS render cycle.
   * @param changes - Link changes to queue
   */
  public addPendingLinkChanges(changes: Map<CellId, IncrementalChange<dia.Cell>>): void {
    for (const [id, change] of changes) {
      this.pendingLinkChanges.set(id, change);
    }
  }

  /**
   * Flushes pending link changes via setPaperViews so React re-reads correct link layout.
   * Called from afterRender when JointJS has finished rendering.
   * @param graphStore
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

  /** Whether some feature currently owns `paper.options.cellVisibility`. */
  public get isCellVisibilityOwned(): boolean {
    return this.cellVisibilityOwner !== null;
  }

  /**
   * Claim ownership of `paper.options.cellVisibility` for a feature. Clears
   * the option on the paper so a feature (e.g. a virtual-rendering scroller)
   * can install its own callback without conflicting with the Paper
   * component's write. Idempotent for the same owner; a different owner takes
   * over. Generic — no knowledge of the claiming feature.
   * @param ownerId - The claiming feature's id.
   */
  public claimCellVisibility(ownerId: string): void {
    this.cellVisibilityOwner = ownerId;
    this.paper.options.cellVisibility = undefined;
  }

  /**
   * Release ownership previously taken via {@link claimCellVisibility}.
   * Restores the paper's `cellVisibility` to the latest resolved native
   * callback so the Paper component resumes managing it. No-op when a
   * different feature owns it.
   * @param ownerId - The releasing feature's id.
   */
  public releaseCellVisibility(ownerId: string): void {
    if (this.cellVisibilityOwner !== ownerId) return;
    this.cellVisibilityOwner = null;
    this.paper.options.cellVisibility = this.nativeCellVisibility;
  }

  /**
   * Notify the owning feature that the native `cellVisibility` callback
   * changed (e.g. the `<Paper>` prop updated), so it can re-apply it.
   * Routed through the owner's {@link Feature.onCellVisibilityChange} hook —
   * no separate listener registry. No-op when unowned or the owner provides
   * no hook.
   * @param cb - The refreshed native callback.
   */
  public notifyCellVisibilityOwner(cb: dia.Paper.Options['cellVisibility']): void {
    if (this.cellVisibilityOwner === null) return;
    this.features[this.cellVisibilityOwner]?.onCellVisibilityChange?.(cb);
  }

  /**
   * Cleans up the paper instance and all associated resources.
   * Should be called when the paper is being removed from the graph store.
   */
  public destroy = () => {
    // An adopted paper is owned by its creator (e.g. `<Stencil>`), which
    // removes it itself — removing it here would kill a paper still in use,
    // breaking the next adoption (notably under React StrictMode remounts).
    if (!this.isAdoptedPaper) {
      // Remove the JointJS paper instance - this cleans up:
      // - All event listeners on the paper
      // - All cell views
      // - The paper's DOM element
      this.paper.remove();
    }

    // Clear registered features
    for (const feature of Object.values(this.features)) {
      feature.clean?.();
    }
  };
}
