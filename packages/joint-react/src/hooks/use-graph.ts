import { useMemo } from 'react';
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { FlatElementData, FlatLinkData } from '../types/data-types';
import type { CellData } from '../types/cell-data';
import { useGraphStore } from './use-graph-store';
import type { GraphStore } from '../store/graph-store';

/**
 * Type guard that checks whether the value is an updater function.
 * @param value
 */
function isUpdater<T extends object>(
  value: T | ((previous: T) => T)
): value is (previous: T) => T {
  return typeof value === 'function';
}

/**
 * Removes a cell from the graph by ID.
 * @param id
 * @param graphStore
 */
function removeCell(id: CellId, graphStore: GraphStore) {
  const cell = graphStore.graph.getCell(id);
  cell?.remove();
}

/**
 * Result of the useGraph hook.
 */
interface UseGraphResult {
  /** The JointJS graph instance. */
  readonly graph: dia.Graph;
  /**
   * Sets or updates an element in the graph.
   * Can be called in two ways:
   * 1. With ID and attributes: `setElement('1', { x: 100, y: 150 })`
   * 2. With ID and updater: `setElement('1', (previous) => ({ ...previous, label: 'New' }))`
   * If the element doesn't exist, it will be added.
   */
  readonly setElement: (
    id: CellId,
    attributesOrUpdater: FlatElementData | ((previous: FlatElementData) => FlatElementData)
  ) => void;
  /**
   * Removes an element from the graph by its ID.
   * @param id - The ID of the element to remove
   */
  readonly removeElement: (id: CellId) => void;
  /**
   * Sets or updates a link in the graph.
   * Can be called in two ways:
   * 1. With ID and attributes: `setLink('l-1', { source: '1', target: '2' })`
   * 2. With ID and updater: `setLink('l-1', (previous) => ({ ...previous, color: 'red' }))`
   * If the link doesn't exist, it will be added.
   */
  readonly setLink: (
    id: CellId,
    attributesOrUpdater: FlatLinkData | ((previous: FlatLinkData) => FlatLinkData)
  ) => void;
  /**
   * Removes a link from the graph by its ID.
   * @param id - The ID of the link to remove
   */
  readonly removeLink: (id: CellId) => void;
}

const ELEMENT_DEFAULTS: FlatElementData = { data: {}, x: 0, y: 0, width: 1, height: 1 };
const LINK_DEFAULTS: FlatLinkData = { data: {}, source: '', target: '' };

/**
 * Custom hook to retrieve the graph instance and actions for manipulating elements and links.
 *
 * Returns the JointJS graph instance along with methods for setting and removing elements and links.
 * @see https://docs.jointjs.com/api/dia/Graph/
 * @group Hooks
 * @returns An object containing the graph instance and cell manipulation methods.
 * @example
 * ```tsx
 * const { graph, setElement, removeElement, setLink, removeLink } = useGraph()
 * ```
 */
export function useGraph(): UseGraphResult {
  const graphStore = useGraphStore();

  return useMemo(
    (): UseGraphResult => ({
      graph: graphStore.graph,

      setElement(id, attributesOrUpdater) {
        const existing = graphStore.graphView.elements.get(String(id)) as unknown as FlatElementData | undefined;

        const attributes: FlatElementData = isUpdater(attributesOrUpdater)
          ? attributesOrUpdater(existing ?? ELEMENT_DEFAULTS)
          : attributesOrUpdater;

        const mergedData: FlatElementData = { ...ELEMENT_DEFAULTS, ...existing, ...attributes };

        graphStore.graphView.updateAutoSizedElement(String(id), mergedData as unknown as Record<string, unknown>);

        const cellAttributes = graphStore.graphView.elementToAttributes({ id: String(id), data: mergedData as unknown as CellData });
        const attributes_ = { ...cellAttributes, id } as dia.Cell.JSON;
        graphStore.graph.syncCells([attributes_], { remove: false });
      },

      removeElement(id) {
        removeCell(id, graphStore);
      },

      setLink(id, attributesOrUpdater) {
        const existing = graphStore.graphView.links.get(String(id)) as unknown as FlatLinkData | undefined;

        const attributes: FlatLinkData = isUpdater(attributesOrUpdater)
          ? attributesOrUpdater(existing ?? LINK_DEFAULTS)
          : attributesOrUpdater;

        const mergedData: FlatLinkData = { ...LINK_DEFAULTS, ...existing, ...attributes };

        const cellAttributes = graphStore.graphView.linkToAttributes({ id: String(id), data: mergedData as unknown as CellData });
        const attributes_ = { ...cellAttributes, id } as dia.Cell.JSON;
        graphStore.graph.syncCells([attributes_], { remove: false });
      },

      removeLink(id) {
        removeCell(id, graphStore);
      },
    }),
    [graphStore]
  );
}
