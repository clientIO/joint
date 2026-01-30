import type { dia } from '@joint/core';

/**
 * Cache entry for batched clearView updates.
 */
export interface ClearViewCacheEntry {
  /** Callback to validate which links should be cleared */
  onValidateLink?: (link: dia.Link) => boolean;
}

/**
 * Merges two clearView validators.
 * - If no validator (clear all links), that takes precedence
 * - If both have validators, creates union validator
 * @param existing - Existing validator
 * @param incoming - New validator
 * @returns Merged validator or undefined
 */
export function mergeClearViewValidators(
  existing: ClearViewCacheEntry | undefined,
  incoming: ClearViewCacheEntry
): ClearViewCacheEntry {
  // No existing entry - use new
  if (!existing) {
    return incoming;
  }

  const { onValidateLink } = incoming;

  // No validator means clear all links - this takes precedence
  if (!onValidateLink) {
    return { onValidateLink: undefined };
  }

  // If existing has validator, create union
  if (existing.onValidateLink) {
    const existingValidator = existing.onValidateLink;
    const newValidator = onValidateLink;
    return {
      onValidateLink: (link: dia.Link) => existingValidator(link) || newValidator(link),
    };
  }

  // Existing has no validator (clear all) - keep that behavior
  return existing;
}

/**
 * Determines if a link should be cleared based on cell connection.
 * @param link - The link to check
 * @param cellId - The cell ID to check against
 * @param onValidateLink - Optional callback to determine if link should be cleared
 * @returns True if the link should be cleared
 */
export function shouldClearLink(
  link: dia.Link,
  cellId: dia.Cell.ID,
  onValidateLink?: (link: dia.Link) => boolean
): boolean {
  const target = link.target();
  const source = link.source();
  const isElementLink = target.id === cellId || source.id === cellId;
  return isElementLink && (!onValidateLink || onValidateLink(link));
}

/**
 * Clears connected link views for a cell in a paper.
 * @param paper - The JointJS Paper instance
 * @param graph - The JointJS Graph instance
 * @param cellId - The cell ID whose connected links to clear
 * @param onValidateLink - Optional callback to determine which links to keep
 */
export function clearConnectedLinkViews(
  paper: dia.Paper,
  graph: dia.Graph,
  cellId: dia.Cell.ID,
  onValidateLink?: (link: dia.Link) => boolean
): void {
  const cell = graph.getCell(cellId);
  if (!cell) {
    return;
  }

  for (const link of graph.getConnectedLinks(cell)) {
    if (!shouldClearLink(link, cellId, onValidateLink)) {
      continue;
    }

    const linkView = link.findView(paper);
    if (!linkView) {
      continue;
    }

    // @ts-expect-error we use private jointjs api method
    linkView._sourceMagnet = null;
    // @ts-expect-error we use private jointjs api method
    linkView._targetMagnet = null;
    // @ts-expect-error we use private jointjs api method
    linkView.requestConnectionUpdate({ async: false });
  }
}

/**
 * Executes clearView for a single cell across all papers.
 * @param papers - Iterable of paper stores with paper property
 * @param graph - The JointJS Graph instance
 * @param cellId - The cell ID to clear
 * @param onValidateLink - Optional callback to determine which links to keep
 */
export function executeClearViewForCell(
  papers: Iterable<{ readonly paper?: dia.Paper }>,
  graph: dia.Graph,
  cellId: dia.Cell.ID,
  onValidateLink?: (link: dia.Link) => boolean
): void {
  for (const paperStore of papers) {
    const { paper } = paperStore;
    if (!paper) {
      continue;
    }

    const elementView = paper.findViewByModel(cellId);
    if (!elementView) {
      continue;
    }

    elementView.cleanNodesCache();
    clearConnectedLinkViews(paper, graph, cellId, onValidateLink);
  }
}
