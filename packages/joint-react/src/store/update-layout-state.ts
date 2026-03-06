/* eslint-disable sonarjs/cognitive-complexity */
import type { dia } from '@joint/core';
import { startTransition } from 'react';
import type { CellId } from '../types/cell-id';
import type { State } from '../utils/create-state';
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
  readonly layoutState: State<GraphStoreLayoutSnapshot>;
  readonly papers?: Map<string, PaperStore>;
}

/**
 * Checks if two link layouts are equal.
 * @param a - First link layout
 * @param b - Second link layout
 * @returns True if layouts are equal
 */
function isLinkLayoutEqual(a: LinkLayout | undefined, b: LinkLayout): boolean {
  if (!a) return false;
  return (
    a.sourceX === b.sourceX &&
    a.sourceY === b.sourceY &&
    a.targetX === b.targetX &&
    a.targetY === b.targetY &&
    a.d === b.d
  );
}

/**
 * Updates layout state (element layouts and per-paper link layouts).
 * @param options - The update options
 */
export function updateLayoutState(options: UpdateLayoutStateOptions): void {
  const { graph, layoutState, papers } = options;
  const elementLayouts: Record<CellId, NodeLayout> = {};
  const linkLayoutsPerPaper: Record<string, Record<CellId, LinkLayout>> = {};
  const elements = graph.getElements();
  const previousSnapshot = layoutState.getSnapshot();
  const previousElementLayouts = previousSnapshot.elements;
  const previousLinkLayouts = previousSnapshot.links;

  for (const element of elements) {
    const size = element.get('size');
    const position = element.get('position') ?? DEFAULT_POINT;
    const angle = element.get('angle') ?? 0;
    if (!size) continue;

    const newLayout: NodeLayout = {
      x: position.x ?? 0,
      y: position.y ?? 0,
      width: size.width ?? 0,
      height: size.height ?? 0,
      angle,
    };

    const previousLayout = previousElementLayouts[element.id];
    elementLayouts[element.id] =
      previousLayout?.x === newLayout.x &&
      previousLayout.y === newLayout.y &&
      previousLayout.width === newLayout.width &&
      previousLayout.height === newLayout.height &&
      previousLayout.angle === newLayout.angle
        ? previousLayout
        : newLayout;
  }

  if (papers) {
    const links = graph.getLinks();
    for (const paperStore of papers.values()) {
      const { paper, paperId } = paperStore;
      if (!paper) continue;

      const paperLinkLayouts: Record<CellId, LinkLayout> = {};
      const previousPaperLinkLayouts = previousLinkLayouts[paperId] ?? {};

      for (const link of links) {
        const linkView = paper.findViewByModel(link) as dia.LinkView | null;
        if (!linkView) continue;

        const sourcePoint = linkView.sourcePoint ?? DEFAULT_POINT;
        const targetPoint = linkView.targetPoint ?? DEFAULT_POINT;
        const d = linkView.getSerializedConnection?.() ?? '';

        const newLinkLayout: LinkLayout = {
          sourceX: sourcePoint.x,
          sourceY: sourcePoint.y,
          targetX: targetPoint.x,
          targetY: targetPoint.y,
          d,
        };

        const previousLinkLayout = previousPaperLinkLayouts[link.id];
        paperLinkLayouts[link.id] = isLinkLayoutEqual(previousLinkLayout, newLinkLayout)
          ? previousLinkLayout
          : newLinkLayout;
      }

      linkLayoutsPerPaper[paperId] = paperLinkLayouts;
    }
  }

  startTransition(() => {
    layoutState.setState(() => ({
      elements: elementLayouts,
      links: linkLayoutsPerPaper,
    }));
  });
}
