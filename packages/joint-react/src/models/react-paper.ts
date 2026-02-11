import { dia } from '@joint/core';
import type { GraphStore } from '../store/graph-store';
import type { ReactPaperOptions } from './react-paper.types';
import type { ReactElementViewCache, ReactLinkViewCache } from '../types/paper.types';

/**
 * Extended Paper class that manages React view lifecycle.
 *
 * ReactPaper centralizes view management by:
 * - Tracking mounted views in React caches for portal rendering
 * - Scheduling React updates when views mount/unmount
 * - Disabling magnets on React elements
 * - Hiding links until their source/target elements have rendered
 * @example
 * ```typescript
 * const paper = new ReactPaper({
 *   el: container,
 *   model: graph,
 *   graphStore,
 * });
 * ```
 */
export class ReactPaper extends dia.Paper {
  /** Reference to GraphStore for scheduling updates */
  private graphStore: GraphStore;

  /** Cache for element views - set by PaperStore */
  public reactElementCache!: ReactElementViewCache;

  /** Cache for link views - set by PaperStore */
  public reactLinkCache!: ReactLinkViewCache;

  /** Links waiting for source/target elements to render */
  private pendingLinks: Set<dia.Cell.ID> = new Set();

  constructor(options: ReactPaperOptions) {
    super(options);
    this.graphStore = options.graphStore;
  }

  /**
   * Check if an element view has rendered its React content.
   * @param elementId - The element ID to check
   * @returns true if element view exists and has children
   */
  private isElementReady(elementId: dia.Cell.ID | undefined): boolean {
    if (!elementId) return false;
    const elementView = this.reactElementCache.elementViews[elementId];
    return !!elementView?.el && elementView.el.children.length > 0;
  }

  /**
   * Check pending links and show them if their source/target are ready.
   * Called after React renders element content.
   */
  public checkPendingLinks(): void {
    if (this.pendingLinks.size === 0) return;

    const linksToShow: dia.Cell.ID[] = [];

    for (const linkId of this.pendingLinks) {
      const linkView = this.reactLinkCache.linkViews[linkId];
      if (!linkView) {
        // Link was removed, clean up
        this.pendingLinks.delete(linkId);
        continue;
      }

      const link = linkView.model;
      const sourceId = link.source().id as dia.Cell.ID;
      const targetId = link.target().id as dia.Cell.ID;

      if (this.isElementReady(sourceId) && this.isElementReady(targetId)) {
        linksToShow.push(linkId);
      }
    }

    // Show ready links
    for (const linkId of linksToShow) {
      this.pendingLinks.delete(linkId);
      const linkView = this.reactLinkCache.linkViews[linkId];
      if (linkView?.el) {
        linkView.el.style.visibility = '';
      }
    }
  }

  /**
   * Remove a cell from the appropriate cache.
   * Uses Reflect.deleteProperty to satisfy `@typescript-eslint/no-dynamic-delete` rule.
   * Performance is identical to `delete` operator.
   * @param cell - The cell to remove from cache
   */
  private removeFromCache(cell: dia.Cell): void {
    const cellId = cell.id;

    if (cell.isElement()) {
      const newElementViews = { ...this.reactElementCache.elementViews };
      Reflect.deleteProperty(newElementViews, cellId);
      this.reactElementCache.elementViews = newElementViews;
    } else if (cell.isLink()) {
      const newLinkViews = { ...this.reactLinkCache.linkViews };
      Reflect.deleteProperty(newLinkViews, cellId);
      this.reactLinkCache.linkViews = newLinkViews;
      this.pendingLinks.delete(cellId);
    }
  }

  /**
   * Called when a view is mounted into the DOM.
   * Adds view to appropriate cache and schedules React update.
   * For links, hides them until source/target elements have rendered.
   * @param view - The cell view being inserted
   * @param isInitialInsert - Whether this is the initial insert
   */
  insertView(view: dia.CellView, isInitialInsert: boolean): void {
    // Call parent implementation first
    super.insertView(view, isInitialInsert);

    const cellId = view.model.id;

    if (view.model.isElement()) {
      // Add to element views cache
      this.reactElementCache.elementViews = {
        ...this.reactElementCache.elementViews,
        [cellId]: view as dia.ElementView,
      };

      // Check if any pending links can now be shown
      this.checkPendingLinks();
    } else if (view.model.isLink()) {
      const linkView = view as dia.LinkView;
      const link = linkView.model;
      const sourceId = link.source().id as dia.Cell.ID;
      const targetId = link.target().id as dia.Cell.ID;

      // Check if source/target elements have rendered their React content
      const isSourceReady = this.isElementReady(sourceId);
      const isTargetReady = this.isElementReady(targetId);

      if (!isSourceReady || !isTargetReady) {
        // Hide link until source/target are ready
        view.el.style.visibility = 'hidden';
        this.pendingLinks.add(cellId);
      }

      // Add to link views cache
      this.reactLinkCache.linkViews = {
        ...this.reactLinkCache.linkViews,
        [cellId]: linkView,
      };
    }

    // Schedule React update
    this.graphStore.schedulePaperUpdate();
  }

  /**
   * Called when a cell is deleted from the graph.
   * Removes view from appropriate cache and schedules React update.
   * @param cell - The cell being removed
   * @returns The removed cell view
   */
  removeView(cell: dia.Cell): dia.CellView {
    this.removeFromCache(cell);
    this.graphStore.schedulePaperUpdate();
    return super.removeView(cell);
  }

  /**
   * Called when a view is hidden (viewport culling).
   * Removes view from appropriate cache and schedules React update.
   * @param cellView - The cell view being hidden
   * @internal
   */
  _hideCellView(cellView: dia.CellView): void {
    this.removeFromCache(cellView.model);
    this.graphStore.schedulePaperUpdate();
    super._hideCellView(cellView);
  }
}
