import { useMemo } from 'react';
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { ElementRecord, LinkRecord } from '../types/data-types';
import { useGraphStore } from './use-graph-store';
import {
  useRemoveElement,
  useRemoveLink,
  useSetElement,
  useSetElements,
  useSetLink,
  useSetLinks,
  type Updater,
} from './use-cell-setters';

/**
 * Result of the useGraph hook.
 */
interface UseGraphResult<
  NodeData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> {
  /** The JointJS graph instance. */
  readonly graph: dia.Graph;
  /**
   * Sets or updates a single element in the graph. Merges with existing data.
   *
   * For best performance, prefer this over `setElements` when updating individual cells.
   * @example
   * ```tsx
   * setElement('1', { position: { x: 100, y: 150 } });
   * setElement('1', (prev) => ({ ...prev, data: { ...prev.data, label: 'New' } }));
   * ```
   */
  readonly setElement: (id: CellId, attributesOrUpdater: Updater<ElementRecord<NodeData>>) => void;
  /**
   * Removes an element from the graph by its ID.
   * @param id - The ID of the element to remove
   */
  readonly removeElement: (id: CellId) => void;
  /**
   * Sets or updates a single link in the graph. Merges with existing data.
   *
   * For best performance, prefer this over `setLinks` when updating individual cells.
   * @example
   * ```tsx
   * setLink('l-1', { source: { id: '1' }, target: { id: '2' } });
   * setLink('l-1', (prev) => ({ ...prev, style: { color: 'red' } }));
   * ```
   */
  readonly setLink: (id: CellId, attributesOrUpdater: Updater<LinkRecord<LinkData>>) => void;
  /**
   * Removes a link from the graph by its ID.
   * @param id - The ID of the link to remove
   */
  readonly removeLink: (id: CellId) => void;
  /**
   * Replaces all elements in the graph at once.
   *
   * Uses `syncCells` with `remove: true`, so elements not in the new record are removed.
   * Existing links are preserved. For single-element updates prefer `setElement` — it is
   * more efficient because it only syncs one cell.
   * @example
   * ```tsx
   * setElements({ el1: { position: { x: 0, y: 0 } } });
   * setElements((prev) => ({ ...prev, el2: { position: { x: 100, y: 100 } } }));
   * ```
   */
  readonly setElements: (elements: Updater<Record<CellId, ElementRecord<NodeData>>>) => void;
  /**
   * Replaces all links in the graph at once.
   *
   * Uses `syncCells` with `remove: true`, so links not in the new record are removed.
   * Existing elements are preserved. For single-link updates prefer `setLink` — it is
   * more efficient because it only syncs one cell.
   * @example
   * ```tsx
   * setLinks({ 'l-1': { source: { id: 'a' }, target: { id: 'b' } } });
   * setLinks((prev) => ({ ...prev, 'l-2': { source: { id: 'c' }, target: { id: 'd' } } }));
   * ```
   */
  readonly setLinks: (links: Updater<Record<CellId, LinkRecord<LinkData>>>) => void;
}

/**
 * Custom hook to retrieve the graph instance and actions for manipulating elements and links.
 *
 * Returns the JointJS graph instance along with methods for setting and removing elements and links.
 * For best performance, prefer single-cell operations (`setElement`, `setLink`) over batch
 * operations (`setElements`, `setLinks`) when updating individual cells.
 * @see https://docs.jointjs.com/api/dia/Graph/
 * @group Hooks
 * @returns An object containing the graph instance and cell manipulation methods.
 * @example
 * ```tsx
 * const { graph, setElement, removeElement, setLink, removeLink, setElements, setLinks } = useGraph()
 * ```
 */
export function useGraph<
  NodeData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(): UseGraphResult<NodeData, LinkData> {
  const graphStore = useGraphStore();

  const setElement = useSetElement<NodeData>();
  const setLink = useSetLink<LinkData>();
  const removeElement = useRemoveElement();
  const removeLink = useRemoveLink();
  const setElements = useSetElements<NodeData>();
  const setLinks = useSetLinks<LinkData>();

  return useMemo(
    () => ({
      graph: graphStore.graph,
      setElement,
      setLink,
      removeElement,
      removeLink,
      setElements,
      setLinks,
    }),
    [graphStore.graph, setElement, setLink, removeElement, removeLink, setElements, setLinks]
  );
}
