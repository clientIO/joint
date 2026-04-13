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
 * Returns a setter function for updating all elements in the graph at once.
 * Accepts either a new record or an updater function that receives the current elements.
 *
 * Only elements are touched — links are left alone, even when called back-to-back
 * with `setLinks` inside the same effect. Previously this preserved links by
 * re-including them in `syncCells`, which wiped out pending link updates that
 * had not yet been flushed to the graphView container.
 * @group Hooks
 */
export function useSetElements<NodeData extends object = Record<string, unknown>>() {
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

      graph.startBatch('set-elements');
      graph.syncCells(cells, { remove: false });

      for (const id of Object.keys(currentElements)) {
        if (id in nextElements) continue;
        const cell = graph.getCell(id);
        if (cell?.isElement()) cell.remove();
      }

      graph.stopBatch('set-elements');
    },
    [graphStore]
  );
}

/**
 * Returns a setter function for updating all links in the graph at once.
 * Accepts either a new record or an updater function that receives the current links.
 *
 * Only links are touched — elements are left alone, even when called back-to-back
 * with `setElements` inside the same effect. Previously this preserved elements by
 * re-including them in `syncCells`, which wiped out pending element updates that
 * had not yet been flushed to the graphView container.
 * @group Hooks
 */
export function useSetLinks<LinkData extends object = Record<string, unknown>>() {
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

      graph.startBatch('set-links');
      graph.syncCells(cells, { remove: false });

      for (const id of Object.keys(currentLinks)) {
        if (id in nextLinks) continue;
        const cell = graph.getCell(id);
        if (cell?.isLink()) cell.remove();
      }

      graph.stopBatch('set-links');
    },
    [graphStore]
  );
}
