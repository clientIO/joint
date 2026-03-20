/* eslint-disable sonarjs/cognitive-complexity */
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type {
  ElementPosition,
  ElementSize,
  GraphLayoutState,
  LinkLayout,
  ElementLayout,
} from '../state/state.types';
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

/**
 * Extracts the layout (position, size, angle) from a JointJS element.
 * @param element - The JointJS element to extract layout from
 * @returns The node layout or null if the element has no size
 */
export function getElementLayout(element: dia.Element): ElementLayout | null {
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

/**
 * Extracts the layout (source/target points and path) from a JointJS link view.
 * @param linkView - The JointJS link view to extract layout from
 * @returns The link layout with source, target coordinates and path data
 */
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
 * @returns A snapshot of the current graph layout
 */
export function getLayout(options: UpdateLayoutStateOptions): GraphLayoutState {
  const { graph, papers } = options;
  const elementLayouts: Record<CellId, ElementLayout> = {};
  const linkLayoutsPerPaper: Record<string, Record<CellId, LinkLayout>> = {};
  const elements = graph.getElements();
  let count = 0;

  for (const element of elements) {
    const layout = getElementLayout(element);
    if (!layout) continue;
    elementLayouts[element.id] = layout;
    count += 1;
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
  const sizes: Record<CellId, ElementSize> = {};
  const positions: Record<CellId, ElementPosition> = {};
  const angles: Record<CellId, number> = {};
  for (const [id, layout] of Object.entries(elementLayouts)) {
    sizes[id] = { width: layout.width, height: layout.height };
    positions[id] = { x: layout.x, y: layout.y };
    angles[id] = layout.angle;
  }

  return {
    elements: {
      sizes,
      positions,
      angles,
      count,
      observedElements: 0,
      measuredObservedElements: 0,
      autoSizedElementIds: new Set(),
    },
    links: linkLayoutsPerPaper,
  };
}
