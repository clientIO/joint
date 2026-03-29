import { useMemo } from 'react';
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { AnyElementRecord, AnyLinkRecord } from '../types/data-types';
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
  NodeData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> {
  /** The JointJS graph instance. */
  readonly graph: dia.Graph;
  /**
   * Sets or updates an element in the graph.
   *
   * `previous` is typed as `Element` — includes `data`, `x`, `y`, `width`, `height`, etc.
   * @example
   * ```tsx
   * setElement('1', { x: 100, y: 150 });
   * setElement('1', (previous) => ({ ...previous, data: { ...previous.data, label: 'New' } }));
   * ```
   */
  readonly setElement: (
    id: CellId,
    attributesOrUpdater: AnyElementRecord<NodeData> | ((previous: AnyElementRecord<NodeData>) => AnyElementRecord<NodeData>)
  ) => void;
  /**
   * Removes an element from the graph by its ID.
   * @param id - The ID of the element to remove
   */
  readonly removeElement: (id: CellId) => void;
  /**
   * Sets or updates a link in the graph.
   *
   * `previous` is typed as `Link` — includes `data`, `source`, `target`, `color`, etc.
   * @example
   * ```tsx
   * setLink('l-1', { source: '1', target: '2' });
   * setLink('l-1', (previous) => ({ ...previous, color: 'red' }));
   * ```
   */
  readonly setLink: (
    id: CellId,
    attributesOrUpdater: AnyLinkRecord<LinkData> | ((previous: AnyLinkRecord<LinkData>) => AnyLinkRecord<LinkData>)
  ) => void;
  /**
   * Removes a link from the graph by its ID.
   * @param id - The ID of the link to remove
   */
  readonly removeLink: (id: CellId) => void;
}

function getDefaultLink<LinkData extends object = Record<string, unknown>>(): AnyLinkRecord<LinkData> {
  return {} as AnyLinkRecord<LinkData>;
}
function getDefaultElement<
  ElementData extends object = Record<string, unknown>,
>(): AnyElementRecord<ElementData> {
  return {} as AnyElementRecord<ElementData>;
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
  NodeData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(): UseGraphResult<NodeData, LinkData> {
  const graphStore = useGraphStore();

  return useMemo(
    (): UseGraphResult<NodeData, LinkData> => ({
      graph: graphStore.graph,

      setElement(id, attributesOrUpdater) {
        const graphView = graphStore.getGraphView<NodeData, LinkData>();
        const existing: AnyElementRecord<NodeData> =
          graphView.elements.get(String(id)) ?? getDefaultElement<NodeData>();

        const attributes = isUpdater(attributesOrUpdater)
          ? attributesOrUpdater(existing)
          : attributesOrUpdater;

        const mergedData = {
          ...existing,
          ...attributes,
        } as AnyElementRecord<NodeData>;

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

        const mergedData: AnyLinkRecord<LinkData> = {
          ...existing,
          ...attributes,
        } as AnyLinkRecord<LinkData>;
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
