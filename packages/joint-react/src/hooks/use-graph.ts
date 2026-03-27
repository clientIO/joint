import { useMemo } from 'react';
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { Element, Link } from '../types/data-types';
import { useGraphStore } from './use-graph-store';

/**
 * Type guard that checks whether the value is an updater function.
 * @param value
 */
function isUpdater<T extends object>(value: T | ((previous: T) => T)): value is (previous: T) => T {
  return typeof value === 'function';
}

/**
 * Result of the useGraph hook.
 */
interface UseGraphResult<
  NodeData extends object | undefined = undefined,
  LinkData extends object | undefined = undefined,
> {
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
    attributesOrUpdater: Element<NodeData> | ((previous: Element<NodeData>) => Element<NodeData>)
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
    attributesOrUpdater: Link<LinkData> | ((previous: Link<LinkData>) => Link<LinkData>)
  ) => void;
  /**
   * Removes a link from the graph by its ID.
   * @param id - The ID of the link to remove
   */
  readonly removeLink: (id: CellId) => void;
}

function getDefaultLink<LinkData extends object | undefined = undefined>(): Link<LinkData> {
  return {
    source: '',
    target: '',
  } as Link<LinkData>;
}
function getDefaultElement<
  ElementData extends object | undefined = undefined,
>(): Element<ElementData> {
  return {} as Element<ElementData>;
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
  NodeData extends object | undefined = undefined,
  LinkData extends object | undefined = undefined,
>(): UseGraphResult<NodeData, LinkData> {
  const graphStore = useGraphStore();

  return useMemo(
    (): UseGraphResult<NodeData, LinkData> => ({
      graph: graphStore.graph,

      setElement(id, attributesOrUpdater) {
        const graphView = graphStore.getGraphView<NodeData, LinkData>();
        const existing: Element<NodeData> =
          graphView.elements.get(String(id)) ?? getDefaultElement<NodeData>();

        const attributes = isUpdater(attributesOrUpdater)
          ? attributesOrUpdater(existing)
          : attributesOrUpdater;

        const mergedData = {
          ...existing,
          ...attributes,
        } as Element<NodeData>;

        const cellAttributes = graphView.mapElementToAttributes({
          id: String(id),
          element: mergedData,
        });
        graphStore.graph.syncCells([{ ...cellAttributes, id } as dia.Cell.JSON], { remove: false });
      },

      removeElement(id) {
        graphStore.graph.getCell(id)?.remove();
      },

      setLink(id, attributesOrUpdater) {
        const graphView = graphStore.getGraphView<NodeData, LinkData>();
        const existing = graphView.links.get(String(id)) ?? getDefaultLink<LinkData>();

        const attributes = isUpdater(attributesOrUpdater)
          ? attributesOrUpdater(existing)
          : attributesOrUpdater;

        const mergedData: Link<LinkData> = {
          ...existing,
          ...attributes,
        } as Link<LinkData>;

        const cellAttributes = graphView.mapLinkToAttributes({
          id: String(id),
          link: mergedData,
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
