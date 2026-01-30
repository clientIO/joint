/* eslint-disable sonarjs/cognitive-complexity */
import type { dia } from '@joint/core';
import { startTransition } from 'react';
import type { GraphSchedulerData } from '../types/scheduler.types';
import type { ExternalStoreLike, State } from '../utils/create-state';
import type {
  GraphStoreSnapshot,
  GraphStoreLayoutSnapshot,
  NodeLayout,
  LinkLayout,
} from './graph-store';
import type { PaperStore } from './paper-store';

/**
 * GOLDEN RULE: All setState calls must happen through these flush functions.
 * This module isolates state mutations to ensure they only happen in scheduler's onFlush.
 *
 * DO NOT call setState directly in graph-store.ts - use these functions instead.
 */

/**
 * Flushes element updates to public state.
 * Called from scheduler's onFlush callback.
 * @param publicState - The public state store
 * @param data - The scheduler data containing updates
 */
export function flushElements(
  publicState: ExternalStoreLike<GraphStoreSnapshot>,
  data: GraphSchedulerData
): void {
  if (!data.elementsToUpdate && !data.elementsToDelete) return;

  publicState.setState((previous) => {
    const elements = { ...previous.elements };
    if (data.elementsToUpdate) {
      for (const [id, element] of data.elementsToUpdate) {
        elements[id] = element;
      }
    }
    if (data.elementsToDelete) {
      for (const id of data.elementsToDelete.keys()) {
        Reflect.deleteProperty(elements, id);
      }
    }
    return { ...previous, elements };
  });
}

/**
 * Flushes link updates to public state.
 * Called from scheduler's onFlush callback.
 * @param publicState - The public state store
 * @param data - The scheduler data containing updates
 */
export function flushLinks(
  publicState: ExternalStoreLike<GraphStoreSnapshot>,
  data: GraphSchedulerData
): void {
  if (!data.linksToUpdate && !data.linksToDelete) return;

  publicState.setState((previous) => {
    const links = { ...previous.links };
    if (data.linksToUpdate) {
      for (const [id, link] of data.linksToUpdate) {
        links[id] = link;
      }
    }
    if (data.linksToDelete) {
      for (const id of data.linksToDelete.keys()) {
        Reflect.deleteProperty(links, id);
      }
    }
    return { ...previous, links };
  });
}

/**
 * Options for flushing layout state.
 */
export interface FlushLayoutStateOptions {
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
 * Flushes layout state updates (element layouts and per-paper link layouts).
 * Called from scheduler's onFlush callback.
 * @param options - The flush options
 */
export function flushLayoutState(options: FlushLayoutStateOptions): void {
  const { graph, layoutState, papers } = options;
  const elementLayouts: Record<dia.Cell.ID, NodeLayout> = {};
  const linkLayoutsPerPaper: Record<string, Record<dia.Cell.ID, LinkLayout>> = {};
  const elements = graph.getElements();
  const previousSnapshot = layoutState.getSnapshot();
  const previousElementLayouts = previousSnapshot.elements;
  const previousLinkLayouts = previousSnapshot.links;

  for (const element of elements) {
    const size = element.get('size');
    const position = element.get('position') ?? { x: 0, y: 0 };
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

  // Flush link layouts from each paper
  if (papers) {
    const links = graph.getLinks();
    for (const paperStore of papers.values()) {
      const { paper, paperId } = paperStore;
      if (!paper) continue;

      const paperLinkLayouts: Record<dia.Cell.ID, LinkLayout> = {};
      const previousPaperLinkLayouts = previousLinkLayouts[paperId] ?? {};

      for (const link of links) {
        const linkView = paper.findViewByModel(link) as dia.LinkView | null;
        if (!linkView) continue;

        const sourcePoint = linkView.sourcePoint ?? { x: 0, y: 0 };
        const targetPoint = linkView.targetPoint ?? { x: 0, y: 0 };
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

  let areAllMeasured = Object.keys(elementLayouts).length > 0;
  for (const layout of Object.values(elementLayouts)) {
    if (layout.width <= 1 || layout.height <= 1) {
      areAllMeasured = false;
      break;
    }
  }

  startTransition(() => {
    layoutState.setState((previous) => ({
      elements: elementLayouts,
      links: linkLayoutsPerPaper,
      wasEverMeasured: previous.wasEverMeasured || areAllMeasured,
    }));
  });
}
