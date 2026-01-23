/* eslint-disable sonarjs/cognitive-complexity */
import { dia, util } from '@joint/core';
import type { ReactPaper } from '../types/paper.types';

export type {
  ReactLinkViewCache,
  ReactLinkViewGraphStoreRef,
  ReactLinkViewPaperStoreRef,
} from '../types/paper.types';

/**
 * Custom JointJS LinkView class for React link rendering.
 *
 * This class extends dia.LinkView and:
 * - Tracks link views in the cache for React portal rendering
 * - Handles label rendering with support for React-rendered labels
 * - Manages label cleanup for dynamic React labels
 *
 * Dependencies are accessed through `this.paper` which must have
 * `reactLinkCache`, `reactLinkGraphStore`, and `reactLinkPaperStore` properties.
 * @example
 * ```typescript
 * // Use ReactLinkView with a paper that has React properties
 * const paper = new dia.Paper({ linkView: ReactLinkView });
 * paper.reactLinkCache = { linkViews: {}, linksData: {} };
 * paper.reactLinkGraphStore = graphStore;
 * paper.reactLinkPaperStore = paperStore;
 * ```
 */
export const ReactLinkView = dia.LinkView.extend({
  onRender() {
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
    const view: dia.LinkView = this;
    const paper = view.paper as ReactPaper;
    const { reactLinkCache, reactLinkGraphStore } = paper;

    const linkId = view.model.id as dia.Cell.ID;
    reactLinkCache.linkViews = {
      ...reactLinkCache.linkViews,
      [linkId]: view,
    };
    reactLinkGraphStore.flushPendingUpdates();
    reactLinkGraphStore.schedulePaperUpdate();
  },
  renderLabels() {
    // @ts-expect-error renderLabels exists on LinkView but not in types
    dia.LinkView.prototype.renderLabels.call(this);

    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
    const view: dia.LinkView = this;
    const paper = view.paper as ReactPaper;
    const { reactLinkCache, reactLinkGraphStore, reactLinkPaperStore } = paper;

    const linkId = view.model.id as dia.Cell.ID;
    const link = view.model;
    // @ts-expect-error we use private jointjs api
    const labelCache: Record<number, SVGElement> = view._labelCache;
    // @ts-expect-error we use private jointjs api
    const labelSelectors: Record<number, Record<string, SVGElement>> = view._labelSelectors;

    if (!labelCache || !labelSelectors) {
      return this;
    }

    const newLinksData = { ...reactLinkCache.linksData };
    let isChanged = false;

    const existingLabelIds = new Set<string>();
    for (const labelId in reactLinkCache.linksData) {
      if (labelId.startsWith(`${linkId}-label-`)) {
        existingLabelIds.add(labelId);
      }
    }

    const linkLabels = link.isLink() ? link.labels() : [];
    for (const labelIndex in labelCache) {
      const index = Number.parseInt(labelIndex, 10);
      const label = linkLabels[index];

      if (!label || !('labelId' in label)) {
        continue;
      }

      const portalElement = labelCache[index];
      if (!portalElement) {
        continue;
      }

      const linkLabelId = reactLinkPaperStore.getLinkLabelId(linkId, index);
      existingLabelIds.delete(linkLabelId);

      if (util.isEqual(newLinksData[linkLabelId], portalElement)) {
        continue;
      }
      if (!portalElement.isConnected) {
        continue;
      }
      isChanged = true;
      newLinksData[linkLabelId] = portalElement;
    }

    if (existingLabelIds.size > 0) {
      const hasRenderedLabels = Object.keys(labelCache).length > 0;
      const linkHasLabels = link.isLink() && link.labels().length > 0;
      if (hasRenderedLabels || !linkHasLabels) {
        for (const removedLabelId of existingLabelIds) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete newLinksData[removedLabelId];
        }
        isChanged = true;
      }
    }

    if (isChanged && !util.isEqual(reactLinkCache.linksData, newLinksData)) {
      reactLinkCache.linksData = newLinksData;
      reactLinkGraphStore.schedulePaperUpdate();
    }

    return this;
  },
});
