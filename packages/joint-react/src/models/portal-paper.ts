import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { PortalSelector, PortalPaperOptions } from './portal-paper.types';
import { PORTAL_SELECTOR } from './element-model';
import type { IncrementalChange } from '../state/incremental.types';
import { simpleScheduler } from '../utils/scheduler';
import { Paper } from '../presets/paper';

const noopViewMountChange = (): void => {
  // No-op default for onViewMountChange callback
};

/**
 * Extended Paper class that manages React view lifecycle.
 *
 * PortalPaper centralizes view management by:
 * - Emitting view mount/unmount callbacks for graph-store snapshot sync
 * - Hiding links until their source/target elements have rendered
 */
export class PortalPaper extends Paper {
  public viewChanges: Map<string, IncrementalChange<dia.Cell>> = new Map();
  public onViewMountChange: (changes: Map<string, IncrementalChange<dia.Cell>>) => void;
  private readonly shouldPreserveHostElementOnRemove: boolean;
  private readonly portalSelector: PortalSelector | undefined;
  private pendingLinks: Set<CellId> = new Set();

  constructor(options: PortalPaperOptions) {
    const { onViewMountChange, portalSelector, id, ...paperOptions } = options;
    super(paperOptions);
    this.id = id;
    this.onViewMountChange = onViewMountChange ?? noopViewMountChange;
    this.shouldPreserveHostElementOnRemove = !!paperOptions.el;
    this.portalSelector = portalSelector;
  }

  /**
   * Preserves externally managed host elements (e.g. React refs) on cleanup.
   */
  protected _removeElement(): void {
    if (this.shouldPreserveHostElementOnRemove) {
      return;
    }
    super._removeElement();
  }

  public getElementView(id: CellId): dia.ElementView | undefined {
    const view = this.findViewByModel(id);
    if (!view?.model?.isElement()) {
      return undefined;
    }
    return view as dia.ElementView;
  }

  public getLinkView(id: CellId): dia.LinkView | undefined {
    const view = this.findViewByModel(id);
    if (!view?.model?.isLink()) {
      return undefined;
    }
    return view as dia.LinkView;
  }

  /**
   * Mounts the paper DOM element into the provided host element.
   * This is used by React wrappers (`Paper`, `PaperScroller`) to control where
   * JointJS paper DOM is attached.
   * @param element - The host element where paper should be rendered.
   * @returns The same PortalPaper instance for chaining.
   */
  public render(element?: HTMLElement | SVGElement): this {
    if (!element) {
      return super.render();
    }
    element.replaceChildren(this.el);
    this.unfreeze();
    return this;
  }

  /**
   * Resolves the portal target node from a cell view.
   *
   * When {@link PortalPaperOptions.portalSelector | portalSelector} is set,
   * it overrides the default `'__portal__'` selector lookup.
   * @param cellView - The cell view to resolve the portal node for.
   * @returns The portal DOM node, or null if not found.
   */
  getCellViewPortalNode(cellView: dia.CellView): SVGElement | HTMLElement | null {
    const { portalSelector } = this;
    if (portalSelector === undefined) return cellView.findNode(PORTAL_SELECTOR);
    if (portalSelector === null) return null;
    if (typeof portalSelector === 'string') return cellView.findNode(portalSelector);
    const result = portalSelector({
      model: cellView.model,
      defaultSelector: PORTAL_SELECTOR,
      paper: this,
      graph: this.model,
    });
    if (result === null) return null;
    if (result instanceof Element) return result as SVGElement | HTMLElement;
    return cellView.findNode(result);
  }

  /**
   * Check if an element view has rendered its React content.
   * @param elementId - The element identifier to check.
   * @returns True if the element view has rendered content.
   */
  private isElementReady(elementId: CellId | undefined): boolean {
    if (!elementId) return false;
    const elementView = this.getElementView(elementId);
    if (!elementView?.el) return false;
    const portalNode = this.getCellViewPortalNode(elementView);
    if (!portalNode) return true;
    return portalNode.children.length > 0;
  }

  /**
   * Check whether a link end can be rendered immediately.
   * @param end - The link end JSON descriptor.
   * @returns True if the link end's target element is ready.
   */
  private isLinkEndReady(end: dia.Link.EndJSON): boolean {
    if (!end.id) return true;
    return this.isElementReady(end.id as CellId);
  }

  /**
   * Check pending links and show them if their source/target are ready.
   */
  public checkPendingLinks(): void {
    if (this.pendingLinks.size === 0) return;

    const linksToShow: CellId[] = [];

    for (const linkId of this.pendingLinks) {
      const linkView = this.getLinkView(linkId);
      if (!linkView) {
        this.pendingLinks.delete(linkId);
        continue;
      }

      const link = linkView.model;
      if (this.isLinkEndReady(link.source()) && this.isLinkEndReady(link.target())) {
        linksToShow.push(linkId);
      }
    }

    for (const linkId of linksToShow) {
      this.pendingLinks.delete(linkId);
      const linkView = this.getLinkView(linkId);
      if (linkView?.el) {
        linkView.el.style.visibility = '';
      }
    }
  }

  public onViewMountChangeFlush() {
    simpleScheduler(() => {
      if (this.viewChanges.size === 0) {
        return;
      }
      this.onViewMountChange(this.viewChanges);
      this.viewChanges = new Map();
    });
  }

  /**
   * Notify graph-store that a mounted view has been unmounted.
   * @param cell - The cell whose view was unmounted.
   */
  private notifyViewUnmount(cell: dia.Cell): void {
    const cellId = cell.id as CellId;

    if (cell.isElement()) {
      this.viewChanges.set(cellId, { type: 'remove' });
      this.onViewMountChangeFlush();
      return;
    }

    if (cell.isLink()) {
      this.pendingLinks.delete(cellId);
      this.viewChanges.set(cellId, { type: 'remove' });
      this.onViewMountChangeFlush();
    }
  }

  /**
   * Called when a view is mounted into the DOM.
   * @param view - The cell view being inserted.
   * @param isInitialInsert - Whether this is the initial insert during rendering.
   */
  insertView(view: dia.CellView, isInitialInsert: boolean): void {
    super.insertView(view, isInitialInsert);

    const cellId = view.model.id as CellId;

    if (view.model.isElement()) {
      this.viewChanges.set(cellId, { type: 'add', data: view.model });
      this.onViewMountChangeFlush();
      this.checkPendingLinks();
      return;
    }

    if (view.model.isLink()) {
      const linkView = view as dia.LinkView;
      const link = linkView.model;
      const isSourceReady = this.isLinkEndReady(link.source());
      const isTargetReady = this.isLinkEndReady(link.target());

      if (!isSourceReady || !isTargetReady) {
        view.el.style.visibility = 'hidden';
        this.pendingLinks.add(cellId);
      }

      this.viewChanges.set(cellId, { type: 'add', data: view.model });
      this.onViewMountChangeFlush();
    }
  }

  /**
   * Called when a cell is deleted from the graph.
   * @param cell - The cell being removed.
   * @returns The removed cell view.
   */
  removeView(cell: dia.Cell): dia.CellView {
    this.notifyViewUnmount(cell);
    return super.removeView(cell);
  }

  /**
   * Called when a view is hidden (viewport culling).
   * @internal
   * @param cellView - The cell view being hidden.
   */
  _hideCellView(cellView: dia.CellView): void {
    this.notifyViewUnmount(cellView.model);
    super._hideCellView(cellView);
  }
}
