import { useMemo } from 'react';
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { CellData, FlatElementData, FlatLinkData } from '../types/data-types';
import { useGraphStore } from './use-graph-store';

/**
 * Type guard that checks whether the value is an updater function.
 * @param value
 */
function isUpdater<T extends object>(value: T | ((previous: T) => T)): value is (previous: T) => T {
  return typeof value === 'function';
}

const ELEMENT_DEFAULTS: FlatElementData = { data: {}, x: 0, y: 0 };
const LINK_DEFAULTS: FlatLinkData = { data: {}, source: '', target: '' };

/**
 * Result of the useGraph hook.
 */
interface UseGraphResult<NodeData extends object = CellData, LinkData extends object = CellData> {
  /** The JointJS graph instance. */
  readonly graph: dia.Graph;
  /**
   * Sets or updates an element in the graph.
   *
   * `previous` is typed as `FlatElementData` — includes `data`, `x`, `y`, `width`, `height`, etc.
   * @example
   * ```tsx
   * setElement('1', { x: 100, y: 150 });
   * setElement('1', (previous) => ({ ...previous, data: { ...previous.data, label: 'New' } }));
   * ```
   */
  readonly setElement: (
    id: CellId,
    attributesOrUpdater:
      | FlatElementData<NodeData>
      | ((previous: FlatElementData<NodeData>) => FlatElementData<NodeData>)
  ) => void;
  /**
   * Removes an element from the graph by its ID.
   * @param id - The ID of the element to remove
   */
  readonly removeElement: (id: CellId) => void;
  /**
   * Sets or updates a link in the graph.
   *
   * `previous` is typed as `FlatLinkData` — includes `data`, `source`, `target`, `color`, etc.
   * @example
   * ```tsx
   * setLink('l-1', { source: '1', target: '2' });
   * setLink('l-1', (previous) => ({ ...previous, color: 'red' }));
   * ```
   */
  readonly setLink: (
    id: CellId,
    attributesOrUpdater:
      | FlatLinkData<LinkData>
      | ((previous: FlatLinkData<LinkData>) => FlatLinkData<LinkData>)
  ) => void;
  /**
   * Removes a link from the graph by its ID.
   * @param id - The ID of the link to remove
   */
  readonly removeLink: (id: CellId) => void;
}

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
export function useGraph<
  NodeData extends object = CellData,
  LinkData extends object = CellData,
>(): UseGraphResult<NodeData, LinkData> {
  const graphStore = useGraphStore();

  return useMemo(
    (): UseGraphResult<NodeData, LinkData> => ({
      graph: graphStore.graph,

      setElement(id, attributesOrUpdater) {
        const graphView = graphStore.getGraphView<NodeData, LinkData>();
        const existing = (graphView.elements.get(String(id)) ??
          ELEMENT_DEFAULTS) as FlatElementData<NodeData>;

        const attributes = isUpdater(attributesOrUpdater)
          ? attributesOrUpdater(existing)
          : attributesOrUpdater;

        const mergedData = {
          ...ELEMENT_DEFAULTS,
          ...existing,
          ...attributes,
        } as FlatElementData<NodeData>;

        graphStore.graphView.updateAutoSizedElement(String(id), mergedData);
        const cellAttributes = graphView.elementToAttributes({
          id: String(id),
          data: mergedData,
        });
        graphStore.graph.syncCells([{ ...cellAttributes, id } as dia.Cell.JSON], { remove: false });
      },

      removeElement(id) {
        graphStore.graph.getCell(id)?.remove();
      },

      setLink(id, attributesOrUpdater) {
        const graphView = graphStore.getGraphView<NodeData, LinkData>();
        const existing = (graphView.links.get(String(id)) ??
          LINK_DEFAULTS) as FlatLinkData<LinkData>;

        const attributes = isUpdater(attributesOrUpdater)
          ? attributesOrUpdater(existing)
          : attributesOrUpdater;

        const mergedData: FlatLinkData<LinkData> = {
          ...LINK_DEFAULTS,
          ...existing,
          ...attributes,
        } as FlatLinkData<LinkData>;

        const cellAttributes = graphView.linkToAttributes({
          id: String(id),
          data: mergedData,
        });
        graphStore.graph.syncCells([{ ...cellAttributes, id } as dia.Cell.JSON], { remove: false });
      },

      removeLink(id) {
        graphStore.graph.getCell(id)?.remove();
      },
    }),
    [graphStore]
  );
}
