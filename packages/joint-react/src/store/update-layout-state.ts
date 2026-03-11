/* eslint-disable sonarjs/cognitive-complexity */
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { GraphStoreLayoutSnapshot, LinkLayout, NodeLayout } from './graph-store';
import type { PaperStore } from './paper-store';

/**
 * Default point used as fallback when position is not available.
 */
const DEFAULT_POINT = { x: 0, y: 0 } as const;

/**
 * Options for updating layout state.
 */
export interface UpdateLayoutStateOptions {
  readonly graph: dia.Graph;
  readonly papers?: Map<string, PaperStore>;
}

export function getElementLayout(element: dia.Element): NodeLayout | null {
  const size = element.get('size');
  const position = element.get('position') ?? DEFAULT_POINT;
  const angle = element.get('angle') ?? 0;
  if (size === undefined) {
    return null;
  }
  return {
    x: position.x ?? 0,
    y: position.y ?? 0,
    width: size?.width ?? 0,
    height: size?.height ?? 0,
    angle,
  };
}

export function getLinkLayout(linkView: dia.LinkView): LinkLayout {
  const sourcePoint = linkView.sourcePoint ?? DEFAULT_POINT;
  const targetPoint = linkView.targetPoint ?? DEFAULT_POINT;
  const d = linkView.getSerializedConnection?.() ?? '';

  return {
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
    d,
  };
}

/**
 * Updates layout state (element layouts and per-paper link layouts).
 * @param options - The update options
 */
export function getLayout(options: UpdateLayoutStateOptions): GraphStoreLayoutSnapshot {
  const { graph, papers } = options;
  const elementLayouts: Record<CellId, NodeLayout> = {};
  const linkLayoutsPerPaper: Record<string, Record<CellId, LinkLayout>> = {};
  const elements = graph.getElements();

  for (const element of elements) {
    const layout = getElementLayout(element);
    if (!layout) continue;
    elementLayouts[element.id] = layout;
  }

  if (papers) {
    const links = graph.getLinks();
    for (const [paperId, paperStore] of papers) {
      const { paper } = paperStore;
      if (!paper) continue;

      const paperLinkLayouts: Record<CellId, LinkLayout> = {};

      for (const link of links) {
        const linkView = paper.findViewByModel(link) as dia.LinkView | null;
        if (!linkView) continue;
        const newLinkLayout = getLinkLayout(linkView);
        paperLinkLayouts[link.id] = newLinkLayout;
      }

      linkLayoutsPerPaper[paperId] = paperLinkLayouts;
    }
  }
  return {
    elements: elementLayouts,
    links: linkLayoutsPerPaper,
  };
}
