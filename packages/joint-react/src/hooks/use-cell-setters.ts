import { useCallback } from 'react';
import { useGraphStore } from './use-graph-store';
import type { CellId } from '../types/cell-id';
import type { ElementRecord, LinkRecord } from '../types/data-types';
import { mapElementToAttributes, mapLinkToAttributes } from '../state/data-mapping';
import type { dia } from '@joint/core';

/**
 * Type guard that checks whether the value is an updater function.
 * @param value - The value to check.
 * @returns True if the value is an updater function.
 */
function isUpdater<T extends object>(value: T | ((previous: T) => T)): value is (previous: T) => T {
  return typeof value === 'function';
}

/**
 * Returns an empty LinkRecord as a fallback for missing links.
 * @returns An empty LinkRecord.
 */
function getDefaultLink<LinkData extends object = Record<string, unknown>>(): LinkRecord<LinkData> {
  return {} as LinkRecord<LinkData>;
}

/** Returns an empty ElementRecord as a fallback for missing elements. */
function getDefaultElement<
  ElementData extends object = Record<string, unknown>,
>(): ElementRecord<ElementData> {
  return {} as ElementRecord<ElementData>;
}

/** Updater type matching React's SetStateAction pattern. */
export type Updater<T extends object> = ((previous: T) => T) | T;

/**
 * Returns a function to set or update a single element in the graph.
 * Merges the new attributes with existing element data before syncing.
 * @group Hooks
 */
export function useSetElement<NodeData extends object = Record<string, unknown>>() {
  const graphStore = useGraphStore();
  return useCallback(
    (id: CellId, attributesOrUpdater: Updater<ElementRecord<NodeData>>) => {
      const graphView = graphStore.getGraphView<NodeData>();
      const existing: ElementRecord<NodeData> =
        graphView.elements.get(String(id)) ?? getDefaultElement<NodeData>();

      const attributes = isUpdater(attributesOrUpdater)
        ? attributesOrUpdater(existing)
        : attributesOrUpdater;

      const mergedData = {
        ...existing,
        ...attributes,
      } as ElementRecord<NodeData>;

      const cellAttributes = mapElementToAttributes(mergedData);
      const cell = graphStore.graph.getCell(id);
      if (cell) {
        cell.set(cellAttributes);
      } else {
        graphStore.graph.addCell({ ...cellAttributes, id } as dia.Cell.JSON);
      }
    },
    [graphStore]
  );
}

/**
 * Returns a function to set or update a single link in the graph.
 * Merges the new attributes with existing link data before syncing.
 * @group Hooks
 */
export function useSetLink<LinkData extends object = Record<string, unknown>>() {
  const graphStore = useGraphStore();
  return useCallback(
    (id: CellId, attributesOrUpdater: Updater<LinkRecord<LinkData>>) => {
      const graphView = graphStore.getGraphView<never, LinkData>();
      const existing = graphView.links.get(String(id)) ?? getDefaultLink<LinkData>();

      const attributes = isUpdater(attributesOrUpdater)
        ? attributesOrUpdater(existing)
        : attributesOrUpdater;

      const mergedData: LinkRecord<LinkData> = {
        ...existing,
        ...attributes,
      } as LinkRecord<LinkData>;
      const cellAttributes = mapLinkToAttributes(mergedData);
      const cell = graphStore.graph.getCell(id);
      if (cell) {
        cell.set(cellAttributes);
      } else {
        graphStore.graph.addCell({ ...cellAttributes, id } as dia.Cell.JSON);
      }
    },
    [graphStore]
  );
}

/**
 * Returns a function to remove an element from the graph by its ID.
 * @group Hooks
 */
export function useRemoveElement() {
  const graphStore = useGraphStore();
  return useCallback(
    (id: CellId) => {
      const cell = graphStore.graph.getCell(id);
      if (cell?.isElement()) cell.remove();
    },
    [graphStore]
  );
}

/**
 * Returns a function to remove a link from the graph by its ID.
 * @group Hooks
 */
export function useRemoveLink() {
  const graphStore = useGraphStore();
  return useCallback(
    (id: CellId) => {
      const cell = graphStore.graph.getCell(id);
      if (cell?.isLink()) cell.remove();
    },
    [graphStore]
  );
}

/**
 * Returns a function that **replaces** all elements in the graph at once.
 *
 * Semantics mirror `graph.resetCells` but scoped to elements only:
 * - elements present in the new record are added or merged,
 * - elements absent from the new record are removed,
 * - links are left completely untouched.
 *
 * Implementation uses `graph.syncCells` (the batch-optimized sync primitive)
 * plus a targeted removal pass, rather than `graph.resetCells`, so cell
 * instance identity is preserved for unchanged elements and only touched
 * cells trigger React re-renders.
 *
 * Accepts either a new record or an updater that receives the current elements.
 *
 * For single-element updates prefer `useSetElement`. For bulk merges that must
 * NOT remove missing entries, use `useUpdateElements`.
 * @group Hooks
 * @returns A stable callback that replaces all elements in the graph.
 */
export function useResetElements<NodeData extends object = Record<string, unknown>>() {
  const graphStore = useGraphStore();
  return useCallback(
    (elements: Updater<Record<CellId, ElementRecord<NodeData>>>) => {
      const graphView = graphStore.getGraphView<NodeData>();

      const currentElements: Record<CellId, ElementRecord<NodeData>> = {};
      for (const [id, item] of graphView.elements.getFull()) {
        currentElements[id] = item;
      }

      const nextElements = isUpdater(elements) ? elements(currentElements) : elements;

      const { graph } = graphStore;
      const cells: dia.Cell.JSON[] = [];
      for (const [id, element] of Object.entries(nextElements)) {
        const cellAttributes = mapElementToAttributes(element);
        cells.push({ ...cellAttributes, id } as dia.Cell.JSON);
      }

      graph.startBatch('reset-elements');
      graph.syncCells(cells, { remove: false });

      for (const id of Object.keys(currentElements)) {
        if (id in nextElements) continue;
        const cell = graph.getCell(id);
        if (cell?.isElement()) cell.remove();
      }

      graph.stopBatch('reset-elements');
    },
    [graphStore]
  );
}

/**
 * Returns a function that **replaces** all links in the graph at once.
 *
 * Semantics mirror `graph.resetCells` but scoped to links only:
 * - links present in the new record are added or merged,
 * - links absent from the new record are removed,
 * - elements are left completely untouched.
 *
 * Implementation uses `graph.syncCells` (the batch-optimized sync primitive)
 * plus a targeted removal pass, rather than `graph.resetCells`, so cell
 * instance identity is preserved for unchanged links and only touched cells
 * trigger React re-renders.
 *
 * Accepts either a new record or an updater that receives the current links.
 *
 * For single-link updates prefer `useSetLink`. For bulk merges that must NOT
 * remove missing entries, use `useUpdateLinks`.
 * @group Hooks
 * @returns A stable callback that replaces all links in the graph.
 */
export function useResetLinks<LinkData extends object = Record<string, unknown>>() {
  const graphStore = useGraphStore();
  return useCallback(
    (links: Updater<Record<CellId, LinkRecord<LinkData>>>) => {
      const graphView = graphStore.getGraphView<Record<string, unknown>, LinkData>();

      const currentLinks: Record<CellId, LinkRecord<LinkData>> = {};
      for (const [id, item] of graphView.links.getFull()) {
        currentLinks[id] = item;
      }

      const nextLinks = isUpdater(links) ? links(currentLinks) : links;

      const { graph } = graphStore;
      const cells: dia.Cell.JSON[] = [];
      for (const [id, link] of Object.entries(nextLinks)) {
        const cellAttributes = mapLinkToAttributes(link);
        cells.push({ ...cellAttributes, id } as dia.Cell.JSON);
      }

      graph.startBatch('reset-links');
      graph.syncCells(cells, { remove: false });

      for (const id of Object.keys(currentLinks)) {
        if (id in nextLinks) continue;
        const cell = graph.getCell(id);
        if (cell?.isLink()) cell.remove();
      }

      graph.stopBatch('reset-links');
    },
    [graphStore]
  );
}

/**
 * Returns a function that **bulk-merges** elements without removing any.
 *
 * Wraps `graph.syncCells(cells, { remove: false })`. For each entry in the
 * record: if an element with that id exists, its attributes are merged; if it
 * does not, it is created. Elements absent from the record are kept as-is.
 * Links are never touched.
 *
 * Use this when you want to patch many elements at once without the "remove
 * missing" semantics of `useResetElements`.
 *
 * Accepts either a new record or an updater that receives the current elements.
 * @group Hooks
 * @returns A stable callback that bulk-merges elements into the graph.
 */
export function useUpdateElements<NodeData extends object = Record<string, unknown>>() {
  const graphStore = useGraphStore();
  return useCallback(
    (elements: Updater<Record<CellId, ElementRecord<NodeData>>>) => {
      const graphView = graphStore.getGraphView<NodeData>();

      const currentElements: Record<CellId, ElementRecord<NodeData>> = {};
      for (const [id, item] of graphView.elements.getFull()) {
        currentElements[id] = item;
      }

      const nextElements = isUpdater(elements) ? elements(currentElements) : elements;

      const { graph } = graphStore;
      const cells: dia.Cell.JSON[] = [];
      for (const [id, element] of Object.entries(nextElements)) {
        const existing = currentElements[id];
        const mergedData = existing ? ({ ...existing, ...element } as ElementRecord<NodeData>) : element;
        const cellAttributes = mapElementToAttributes(mergedData);
        cells.push({ ...cellAttributes, id } as dia.Cell.JSON);
      }

      graph.startBatch('update-elements');
      graph.syncCells(cells, { remove: false });
      graph.stopBatch('update-elements');
    },
    [graphStore]
  );
}

/**
 * Returns a function that **bulk-merges** links without removing any.
 *
 * Wraps `graph.syncCells(cells, { remove: false })`. For each entry in the
 * record: if a link with that id exists, its attributes are merged; if it does
 * not, it is created. Links absent from the record are kept as-is. Elements
 * are never touched.
 *
 * Use this when you want to patch many links at once without the "remove
 * missing" semantics of `useResetLinks`.
 *
 * Accepts either a new record or an updater that receives the current links.
 * @group Hooks
 * @returns A stable callback that bulk-merges links into the graph.
 */
export function useUpdateLinks<LinkData extends object = Record<string, unknown>>() {
  const graphStore = useGraphStore();
  return useCallback(
    (links: Updater<Record<CellId, LinkRecord<LinkData>>>) => {
      const graphView = graphStore.getGraphView<Record<string, unknown>, LinkData>();

      const currentLinks: Record<CellId, LinkRecord<LinkData>> = {};
      for (const [id, item] of graphView.links.getFull()) {
        currentLinks[id] = item;
      }

      const nextLinks = isUpdater(links) ? links(currentLinks) : links;

      const { graph } = graphStore;
      const cells: dia.Cell.JSON[] = [];
      for (const [id, link] of Object.entries(nextLinks)) {
        const existing = currentLinks[id];
        const mergedData = existing ? ({ ...existing, ...link } as LinkRecord<LinkData>) : link;
        const cellAttributes = mapLinkToAttributes(mergedData);
        cells.push({ ...cellAttributes, id } as dia.Cell.JSON);
      }

      graph.startBatch('update-links');
      graph.syncCells(cells, { remove: false });
      graph.stopBatch('update-links');
    },
    [graphStore]
  );
}
