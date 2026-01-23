import { dia } from '@joint/core';
import type { PortElementsCacheEntry } from '../store/paper-store';
import type { ReactPaper } from '../types/paper.types';

export type {
  ReactElementViewCache,
  ReactElementViewGraphStoreRef,
  ReactElementViewPaperStoreRef,
} from '../types/paper.types';

/**
 * Custom JointJS ElementView class for React element rendering.
 *
 * This class extends dia.ElementView and:
 * - Disables magnet behavior on elements
 * - Tracks element views in the cache for React portal rendering
 * - Handles port rendering with custom portal element caching
 *
 * Dependencies are accessed through `this.paper` which must have
 * `reactElementCache`, `reactElementGraphStore`, and `reactElementPaperStore` properties.
 * @example
 * ```typescript
 * // Use ReactElementView with a paper that has React properties
 * const paper = new dia.Paper({ elementView: ReactElementView });
 * paper.reactElementCache = { elementViews: {}, portsData: {} };
 * paper.reactElementGraphStore = graphStore;
 * paper.reactElementPaperStore = paperStore;
 * ```
 */
export const ReactElementView = dia.ElementView.extend({
  renderMarkup() {
    const ele: HTMLElement = this.vel;
    ele.setAttribute('magnet', 'false');
    const selectors = (this.selectors = {} as Record<string, SVGElement | SVGElement[]>);
    selectors[this.selector] = this.el;
  },
  onRender() {
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
    const view: dia.ElementView = this;
    const paper = view.paper as ReactPaper;
    const { reactElementCache, reactElementGraphStore } = paper;

    const cellId = view.model.id as dia.Cell.ID;
    reactElementCache.elementViews = {
      ...reactElementCache.elementViews,
      [cellId]: view,
    };
    reactElementGraphStore.schedulePaperUpdate();
  },
  _renderPorts() {
    // @ts-expect-error we use private jointjs api
    dia.ElementView.prototype._renderPorts.call(this);
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
    const view: dia.ElementView = this;
    const paper = view.paper as ReactPaper;
    const { reactElementCache, reactElementGraphStore, reactElementPaperStore } = paper;

    const portElementsCache: Record<string, PortElementsCacheEntry> = this._portElementsCache;
    const newPorts = reactElementPaperStore.getNewPorts({
      state: reactElementGraphStore.internalState,
      cellId: view.model.id as dia.Cell.ID,
      portElementsCache,
      portsData: reactElementCache.portsData,
    });
    reactElementCache.portsData = newPorts ?? {};
    reactElementGraphStore.schedulePaperUpdate();
  },
});
