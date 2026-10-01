import type { dia, mvc } from '@joint/core';
import type { CellId } from '../types/cell.types';
import type { PortalHostCell, PortalSelector, PaperViewOptions } from './paper.types';
import type { IncrementalChange } from '../state/incremental.types';
import { simpleScheduler } from '../utils/scheduler';
import { Paper } from '../presets/paper';
import { MEASURING_CLASS_NAME } from '../utils/class-names';
export const CLEANUP_EVENT_NAME = 'cleanup';
const noopViewMountChange = (): void => {
  // No-op default for onViewMountChange callback
};

/** Well-known paper ID used when no explicit `id` is provided to `<Paper>`. */
export const DEFAULT_PAPER_ID = 'default-paper';

/**
 * Extended Paper class that manages React view lifecycle.
 *
 * PaperView centralizes view management by:
 * - Emitting view mount/unmount callbacks for graph-store snapshot sync
 * - Hiding links until their source/target elements have rendered
 */
export class PaperView extends Paper {
  public viewChanges: Map<CellId, IncrementalChange<dia.Cell>> = new Map();
  public onViewMountChange: (changes: Map<CellId, IncrementalChange<dia.Cell>>) => void;
  private readonly shouldPreserveHostElementOnRemove: boolean;
  private readonly portalSelector: PortalSelector | undefined;
  private pendingLinks: Set<CellId> = new Set();
  // Portal nodes of parked links' not-ready endpoints. React mounts portal
  // content outside joint's render cycle (child state, Suspense), so a DOM
  // mutation is the only reliable "content painted" signal.
  private portalObserver: MutationObserver | null = null;
  private observedPortalNodes: Set<Node> = new Set();
  // Element id → number of parked links waiting on it. Lets a park and an
  // element mount each do O(1) observation work instead of re-walking every
  // pending link (which made a mount of N parked links O(N²)).
  private pendingEndpointIds: Map<CellId, number> = new Map();

  constructor(options: PaperViewOptions) {
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
   * This is used by React wrappers ({@link Paper}, `PaperScroller`) to control where
   * JointJS paper DOM is attached.
   * @param element - The host element where paper should be rendered.
   * @returns The same PaperView instance for chaining.
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
   * Resolution order:
   * 1. Paper-level `portalSelector` option if set.
   * 2. The cell's own `portalSelector` field ({@link ElementModel} → `'__portal__'`,
   *    {@link LinkModel} → `'root'`). Cells without the field are skipped.
   * @param cellView - The cell view to resolve the portal node for.
   * @returns The portal DOM node, or null if not found / skipped.
   */
  getCellViewPortalNode(cellView: dia.CellView): SVGElement | HTMLElement | null {
    const { portalSelector } = this;
    const cell: dia.Cell & PortalHostCell = cellView.model;
    const defaultSelector = cell.portalSelector ?? null;

    if (portalSelector === undefined) {
      return defaultSelector ? cellView.findNode(defaultSelector) : null;
    }
    if (portalSelector === null) return null;
    if (typeof portalSelector === 'string') return cellView.findNode(portalSelector);
    const result = portalSelector({
      model: cell,
      paper: this,
      graph: this.model,
    });
    if (result === null) return null;
    if (result === undefined) {
      return defaultSelector ? cellView.findNode(defaultSelector) : null;
    }
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
   * @returns True if the link end's target cell is ready.
   */
  private isLinkEndReady(end: dia.Link.EndJSON): boolean {
    const endId = end.id;
    if (!endId) return true;

    // Only elements can render asynchronously (their React portal content
    // mounts after the view) — a link end never needs to be waited for.
    const cell = this.model.getCell(endId);
    if (cell?.isLink()) return true;

    return this.isElementReady(endId);
  }

  private bumpPendingEndpoint(endId: CellId | undefined, delta: 1 | -1): void {
    if (!endId) return;
    const count = (this.pendingEndpointIds.get(endId) ?? 0) + delta;
    if (count <= 0) this.pendingEndpointIds.delete(endId);
    else this.pendingEndpointIds.set(endId, count);
  }

  /**
   * Observe one parked endpoint's portal node, so content mounted by a
   * child-only React update still triggers a recheck. O(1) per call — a
   * park observes its own two endpoints, an element mount observes itself.
   */
  private observeEndpoint(endId: CellId | undefined): void {
    if (!endId) return;
    const elementView = this.getElementView(endId);
    if (!elementView?.el) return;
    const portalNode = this.getCellViewPortalNode(elementView);
    if (!portalNode || this.observedPortalNodes.has(portalNode)) return;
    this.portalObserver ??= new MutationObserver(() => this.checkPendingLinks());
    this.portalObserver.observe(portalNode, { childList: true });
    this.observedPortalNodes.add(portalNode);
  }

  private disconnectPortalObserver(): void {
    this.portalObserver?.disconnect();
    this.observedPortalNodes.clear();
    this.pendingEndpointIds.clear();
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
      const link = linkView?.model;
      this.bumpPendingEndpoint(link?.source().id, -1);
      this.bumpPendingEndpoint(link?.target().id, -1);
    }

    if (this.pendingLinks.size === 0) this.disconnectPortalObserver();
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
      if (this.pendingLinks.delete(cellId)) {
        const link = cell as dia.Link;
        this.bumpPendingEndpoint(link.source().id, -1);
        this.bumpPendingEndpoint(link.target().id, -1);
        if (this.pendingLinks.size === 0) this.disconnectPortalObserver();
      }
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
      // Only when parked links wait on THIS element (a link can park before
      // its endpoint's view exists) — keeps unrelated element mounts O(1).
      if (this.pendingEndpointIds.has(cellId)) {
        this.checkPendingLinks();
        if (this.pendingEndpointIds.has(cellId)) this.observeEndpoint(cellId);
      }
      return;
    }

    if (view.model.isLink()) {
      const linkView = view as dia.LinkView;
      const link = linkView.model;
      const isSourceReady = this.isLinkEndReady(link.source());
      const isTargetReady = this.isLinkEndReady(link.target());

      if (!isSourceReady || !isTargetReady) {
        view.el.style.visibility = 'hidden';
        if (!this.pendingLinks.has(cellId)) {
          this.pendingLinks.add(cellId);
          const sourceId = link.source().id;
          const targetId = link.target().id;
          this.bumpPendingEndpoint(sourceId, 1);
          this.bumpPendingEndpoint(targetId, 1);
          this.observeEndpoint(sourceId);
          this.observeEndpoint(targetId);
        }
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

  public remove() {
    this.disconnectPortalObserver();
    // call CLEANUP_EVENT_NAME for any listeners that need to clean up before the paper is removed
    this.trigger(CLEANUP_EVENT_NAME);
    super.remove();
    return this;
  }

  /**
   * Bit flag for marking views that have been measured by {@link useMeasureElement}
   * and are awaiting size/position updates.
   *
   * Bit 27 is chosen to sit immediately below joint-core's reserved view
   * flags without colliding with them:
   *   - `FLAG_INSERT = 1 << 30`
   *   - `FLAG_REMOVE = 1 << 29`
   *   - `FLAG_INIT   = 1 << 28`
   * (see `mvc/View.mjs` in @joint/core). Cell-view subclasses use the
   * low bits (0..N) for their own dirty flags, so 1 << 27 keeps us clear
   * of both ends of the bitfield.
   */
  FLAG_MEASURE = 1 << 27;

  /**
   * Removes the `MEASURING_CLASS_NAME` class from element views once
   * `updateView` has applied the latest size and position written to the
   * model. Removing the class here (rather than when the ResizeObserver
   * fires) avoids the flash at the pre-update position that happens when
   * size lands on the model before position.
   * @param view - The view being updated.
   * @param flagIn - Bitmask of pending update flags.
   * @param opt - Update options forwarded to `view.confirmUpdate`.
   * @returns Leftover flag count, as returned by the base `updateView`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateView(view: mvc.View<any, any>, flagIn: number, opt?: dia.Paper.UpdateViewOptions): number {
    const flagOut = super.updateView(view, flagIn, opt);
    if (flagIn & this.FLAG_MEASURE) {
      view.el.classList.remove(MEASURING_CLASS_NAME);
      return flagOut ^ (flagOut & this.FLAG_MEASURE);
    }
    return flagOut;
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
