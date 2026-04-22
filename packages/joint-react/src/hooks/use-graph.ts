import { useMemo } from 'react';
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { ElementRecord, LinkRecord } from '../types/data-types';
import { useGraphStore } from './use-graph-store';
import {
  useRemoveElement,
  useRemoveLink,
  useResetElements,
  useResetLinks,
  useSetElement,
  useSetLink,
  useUpdateElements,
  useUpdateLinks,
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
   * For best performance, prefer this over `resetElements`/`updateElements`
   * when editing one cell at a time.
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
   * For best performance, prefer this over `resetLinks`/`updateLinks` when
   * editing one cell at a time.
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
   * **Replaces** all elements in the graph at once — mirrors `graph.resetCells`
   * semantics scoped to elements only.
   *
   * Elements in the new record are added or merged; elements absent from the
   * new record are removed; links are left untouched. Use this when the user
   * owns a canonical "elements" slice of state (e.g. React state, Redux) and
   * wants the graph to reflect that slice exactly.
   *
   * For single-element updates prefer `setElement`. For bulk merges that must
   * NOT remove missing entries, use `updateElements`.
   * @example
   * ```tsx
   * resetElements({ el1: { position: { x: 0, y: 0 } } });
   * resetElements((prev) => ({ ...prev, el2: { position: { x: 100, y: 100 } } }));
   * ```
   */
  readonly resetElements: (elements: Updater<Record<CellId, ElementRecord<NodeData>>>) => void;
  /**
   * **Replaces** all links in the graph at once — mirrors `graph.resetCells`
   * semantics scoped to links only.
   *
   * Links in the new record are added or merged; links absent from the new
   * record are removed; elements are left untouched.
   *
   * For single-link updates prefer `setLink`. For bulk merges that must NOT
   * remove missing entries, use `updateLinks`.
   * @example
   * ```tsx
   * resetLinks({ 'l-1': { source: { id: 'a' }, target: { id: 'b' } } });
   * resetLinks((prev) => ({ ...prev, 'l-2': { source: { id: 'c' }, target: { id: 'd' } } }));
   * ```
   */
  readonly resetLinks: (links: Updater<Record<CellId, LinkRecord<LinkData>>>) => void;
  /**
   * **Bulk-merges** elements into the graph without removing any.
   *
   * For each entry: if an element with that id exists, its attributes are
   * merged with existing data; if not, it is created. Elements absent from
   * the record are kept as-is. Links are never touched.
   *
   * Use this when patching many elements at once without the "remove missing"
   * semantics of `resetElements`.
   * @example
   * ```tsx
   * updateElements({ el1: { position: { x: 50, y: 50 } } });
   * updateElements((prev) => {
   *   const next: typeof prev = {};
   *   for (const [id, el] of Object.entries(prev)) {
   *     next[id] = { ...el, angle: 0 };
   *   }
   *   return next;
   * });
   * ```
   */
  readonly updateElements: (elements: Updater<Record<CellId, ElementRecord<NodeData>>>) => void;
  /**
   * **Bulk-merges** links into the graph without removing any.
   *
   * For each entry: if a link with that id exists, its attributes are merged
   * with existing data; if not, it is created. Links absent from the record
   * are kept as-is. Elements are never touched.
   *
   * Use this when patching many links at once without the "remove missing"
   * semantics of `resetLinks`.
   * @example
   * ```tsx
   * updateLinks({ 'l-1': { style: { color: 'red' } } });
   * ```
   */
  readonly updateLinks: (links: Updater<Record<CellId, LinkRecord<LinkData>>>) => void;
}

/**
 * Custom hook to retrieve the graph instance and actions for manipulating elements and links.
 *
 * Returns the JointJS graph instance along with methods for setting, resetting,
 * updating, and removing elements and links.
 *
 * Naming convention mirrors JointJS's `graph.resetCells` vs per-cell `set`:
 * - `setElement` / `setLink` — upsert one cell (merge).
 * - `resetElements` / `resetLinks` — replace the whole slice (removes missing).
 * - `updateElements` / `updateLinks` — bulk merge without removals.
 * - `removeElement` / `removeLink` — remove one cell.
 * @see https://docs.jointjs.com/api/dia/Graph/
 * @group Hooks
 * @returns An object containing the graph instance and cell manipulation methods.
 * @example
 * ```tsx
 * const {
 *   graph,
 *   setElement, setLink,
 *   resetElements, resetLinks,
 *   updateElements, updateLinks,
 *   removeElement, removeLink,
 * } = useGraph();
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
  const resetElements = useResetElements<NodeData>();
  const resetLinks = useResetLinks<LinkData>();
  const updateElements = useUpdateElements<NodeData>();
  const updateLinks = useUpdateLinks<LinkData>();

  return useMemo(
    () => ({
      graph: graphStore.graph,
      setElement,
      setLink,
      removeElement,
      removeLink,
      resetElements,
      resetLinks,
      updateElements,
      updateLinks,
    }),
    [
      graphStore.graph,
      setElement,
      setLink,
      removeElement,
      removeLink,
      resetElements,
      resetLinks,
      updateElements,
      updateLinks,
    ]
  );
}
