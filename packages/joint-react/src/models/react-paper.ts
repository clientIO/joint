import { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { PortalSelector, ReactPaperOptions } from './react-paper.types';
import { REACT_PORTAL_SELECTOR } from './react-element';

const noopViewMountChange = (_kind: 'element' | 'link', _cellId: CellId, _isMounted: boolean) => {};

/**
 * Extended Paper class that manages React view lifecycle.
 *
 * ReactPaper centralizes view management by:
 * - Emitting view mount/unmount callbacks for graph-store snapshot sync
 * - Hiding links until their source/target elements have rendered
 */
export class ReactPaper extends dia.Paper {
  private readonly onViewMountChange: (
    kind: 'element' | 'link',
    cellId: CellId,
    isMounted: boolean
  ) => void;
  private readonly shouldPreserveHostElementOnRemove: boolean;
  private readonly portalSelector: PortalSelector | undefined;
  private pendingLinks: Set<CellId> = new Set();

  constructor(options: ReactPaperOptions) {
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
   * @returns The same ReactPaper instance for chaining.
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
   * When {@link ReactPaperOptions.portalSelector | portalSelector} is set,
   * it overrides the default `'__portal__'` selector lookup.
   */
  getCellViewPortalNode(cellView: dia.CellView): SVGElement | HTMLElement | null {
    const { portalSelector } = this;
    if (portalSelector !== undefined) {
      if (typeof portalSelector === 'function') {
        const result = portalSelector(cellView, REACT_PORTAL_SELECTOR);
        if (result === null) return null;
        if (result instanceof Element) return result as SVGElement | HTMLElement;
        return cellView.findNode(result);
      }
      if (portalSelector === null) return null;
      return cellView.findNode(portalSelector);
    }
    return cellView.findNode(REACT_PORTAL_SELECTOR);
  }

  /**
   * Check if an element view has rendered its React content.
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

  /**
   * Notify graph-store that a mounted view has been unmounted.
   */
  private notifyViewUnmount(cell: dia.Cell): void {
    const cellId = cell.id as CellId;

    if (cell.isElement()) {
      this.onViewMountChange('element', cellId, false);
      return;
    }

    if (cell.isLink()) {
      this.pendingLinks.delete(cellId);
      this.onViewMountChange('link', cellId, false);
    }
  }

  /**
   * Called when a view is mounted into the DOM.
   */
  insertView(view: dia.CellView, isInitialInsert: boolean): void {
    super.insertView(view, isInitialInsert);

    const cellId = view.model.id as CellId;

    if (view.model.isElement()) {
      this.onViewMountChange('element', cellId, true);
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

      this.onViewMountChange('link', cellId, true);
    }
  }

  /**
   * Called when a cell is deleted from the graph.
   */
  removeView(cell: dia.Cell): dia.CellView {
    this.notifyViewUnmount(cell);
    return super.removeView(cell);
  }

  /**
   * Called when a view is hidden (viewport culling).
   * @internal
   */
  _hideCellView(cellView: dia.CellView): void {
    this.notifyViewUnmount(cellView.model);
    super._hideCellView(cellView);
  }
}
