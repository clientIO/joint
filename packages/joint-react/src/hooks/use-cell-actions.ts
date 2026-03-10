import { useMemo } from 'react';
import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import { useGraphStore } from './use-graph-store';

/**
 * Actions for manipulating cells (elements and links) in the graph.
 * @template Attributes - The type of cell attributes, which can be an element or a link
 */
interface CellActions<Attributes = FlatElementData> {
  /**
   * Sets or updates a cell in the graph.
   * Can be called in two ways:
   * 1. With ID and attributes: `set('1', { x: 100, y: 150 })`
   * 2. With ID and updater: `set('1', (prev) => ({ ...prev, label: 'New' }))`
   * If the cell doesn't exist, it will be added.
   */
  set: (
    id: CellId,
    attributesOrUpdater: Attributes | ((previous: Attributes) => Attributes)
  ) => void;
  /**
   * Removes a cell from the graph by its ID.
   * @param id - The ID of the cell to remove
   */
  remove: (id: CellId) => void;
}

/**
 * Type guard to check if a cell represents a link.
 * @param cell - The cell to check.
 * @returns True if the cell is a link, false otherwise.
 */
function isLink(cell: FlatElementData | FlatLinkData): cell is FlatLinkData {
  return 'source' in cell && 'target' in cell;
}

/**
 * Hook that provides imperative actions for manipulating cells (elements and links) in the graph.
 *
 * All changes go through the JointJS graph API. graphState automatically picks up
 * the changes and updates publicState.
 * @group Hooks
 * @template Attributes - The type of cell attributes
 * @returns An object containing methods to set and remove cells
 * @example
 * ```tsx
 * const { set, remove } = useCellActions<FlatElementData | FlatLinkData<"standard.Link">>();
 *
 * set('1', { x: 100, y: 150, width: 100, height: 50 });
 * set('1', (cell) => ({ ...cell, x: 200, y: 250 }));
 * remove('1');
 * ```
 */
export function useCellActions<
  Attributes = FlatElementData | FlatLinkData,
>(): CellActions<Attributes> {
  const graphStore = useGraphStore();

  return useMemo(
    (): CellActions<Attributes> => ({
      set(
        id: CellId,
        attributesOrUpdater: Attributes | ((previousAttributes: Attributes) => Attributes)
      ) {
        const { graph, graphState, mapDataToElementAttributes, mapDataToLinkAttributes } =
          graphStore;
        const snapshot = graphState.publicState.getSnapshot();
        const { elements, links } = snapshot;

        let attributes: Attributes;
        if (typeof attributesOrUpdater === 'function') {
          const cell: FlatElementData | FlatLinkData | undefined = elements[id] || links[id];
          if (!cell) throw new Error(`Cell with id "${id}" not found.`);
          attributes = (attributesOrUpdater as (previous: Attributes) => Attributes)(
            cell as Attributes
          );
        } else {
          attributes = attributesOrUpdater;
        }

        const cellData = attributes as FlatElementData | FlatLinkData;
        const existingCell: dia.Cell | undefined = graph.getCell(id);

        // Merge new data with existing data from publicState to preserve unspecified fields
        const existingData = existingCell?.isElement() ? elements[id] : links[id];
        const mergedData = existingData
          ? { ...existingData, ...cellData }
          : { x: 0, y: 0, width: 1, height: 1, ...cellData };
        const areAttributesLink = isLink(cellData);
        const cellAttributes =
          (existingCell?.isElement() ?? !areAttributesLink)
            ? mapDataToElementAttributes({
                id: String(id),
                data: mergedData as FlatElementData,
                graph,
              })
            : mapDataToLinkAttributes({
                id: String(id),
                data: mergedData as FlatLinkData,
                graph,
              });
        cellAttributes.id = id;
        graph.syncCells([cellAttributes], { remove: false });
        // Collect all current cells, replacing the one being updated
      },

      remove(id) {
        const { graph } = graphStore;
        const cell = graph.getCell(id);
        cell?.remove();
      },
    }),
    [graphStore]
  );
}
