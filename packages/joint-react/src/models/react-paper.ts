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

  constructor(options: ReactPaperOptions) {
    super(options);
    this.graphStore = options.graphStore;
  }

  /**
   * Called when a view is mounted into the DOM.
   * Adds view to appropriate cache and schedules React update.
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
    } else if (view.model.isLink()) {
      const linkView = view as dia.LinkView;

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
    const cellId = cell.id;

    if (cell.isElement()) {
      // Remove from element views cache
      const newElementViews = { ...this.reactElementCache.elementViews };
      Reflect.deleteProperty(newElementViews, cellId);
      this.reactElementCache.elementViews = newElementViews;
    } else if (cell.isLink()) {
      // Remove from link views cache
      const newLinkViews = { ...this.reactLinkCache.linkViews };
      Reflect.deleteProperty(newLinkViews, cellId);
      this.reactLinkCache.linkViews = newLinkViews;
    }

    // Schedule React update
    this.graphStore.schedulePaperUpdate();

    // Call parent implementation
    return super.removeView(cell);
  }

  /**
   * Called when a view is hidden (viewport culling).
   * Removes view from appropriate cache and schedules React update.
   * @param cellView - The cell view being hidden
   * @internal
   */
  _hideCellView(cellView: dia.CellView): void {
    const cellId = cellView.model.id;

    if (cellView.model.isElement()) {
      // Remove from element views cache
      const newElementViews = { ...this.reactElementCache.elementViews };
      Reflect.deleteProperty(newElementViews, cellId);
      this.reactElementCache.elementViews = newElementViews;
    } else if (cellView.model.isLink()) {
      // Remove from link views cache
      const newLinkViews = { ...this.reactLinkCache.linkViews };
      Reflect.deleteProperty(newLinkViews, cellId);
      this.reactLinkCache.linkViews = newLinkViews;
    }

    // Schedule React update
    this.graphStore.schedulePaperUpdate();

    // Call parent implementation
    super._hideCellView(cellView);
  }
}
