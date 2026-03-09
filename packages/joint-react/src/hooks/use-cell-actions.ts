import { useMemo } from 'react';
import type { CellId } from '../types/cell-id';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import type { GraphStoreSnapshot } from '../store';
import { useGraphStore } from './use-graph-store';

/**
 * Normalizes element attributes to the FlatElementData format.
 * Converts nested JointJS format (position: {x, y}, size: {width, height})
 * to flat format (x, y, width, height).
 * @param attributes - Element attributes in either flat or nested JointJS form.
 * @returns The same attributes normalized into the flat element data shape.
 */
function normalizeElementAttributes<T>(attributes: T): T {
  const { position, size, ...rest } = attributes as T & {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  };

  const normalized = { ...rest } as T;

  // Convert position to flat x, y (prefer position over existing x, y)
  if (position !== undefined) {
    (normalized as FlatElementData).x = position.x;
    (normalized as FlatElementData).y = position.y;
  }

  // Convert size to flat width, height (prefer size over existing width, height)
  if (size !== undefined) {
    (normalized as FlatElementData).width = size.width;
    (normalized as FlatElementData).height = size.height;
  }

  return normalized;
}

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
 * This hook allows you to programmatically add, update, and remove cells without directly
 * manipulating the graph instance. All changes go through the store, ensuring proper
 * synchronization with React state.
 *
 * **Features:**
 * - Type-safe cell manipulation
 * - Automatic synchronization with React state
 * - Support for both elements and links
 * - Updater function pattern for safe updates
 *
 * **Usage:**
 * - Use `set` to add or update cells
 * - Use `remove` to delete cells by ID
 * - Must be used within a GraphProvider context
 * @group Hooks
 * @template Attributes - The type of cell attributes, which can be an element or a link
 * @returns An object containing methods to set and remove cells
 * @example
 * ```tsx
 * const { set, remove } = useCellActions<FlatElementData | FlatLinkData<"standard.Link">>();
 *
 * // Add or update element with ID and attributes
 * set('1', { x: 100, y: 150, width: 100, height: 50 });
 *
 * // Update element with updater function (safer, preserves other properties)
 * set('1', (cell) => ({ ...cell, x: 200, y: 250 }));
 *
 * // Remove element
 * remove('1');
 * ```
 */
export function useCellActions<
  Attributes = FlatElementData | FlatLinkData,
>(): CellActions<Attributes> {
  const { publicState } = useGraphStore();

  return useMemo(
    (): CellActions<Attributes> => ({
      set(
        id: CellId,
        attributesOrUpdater: Attributes | ((previousAttributes: Attributes) => Attributes)
      ) {
        let attributes: Attributes;
        const { elements, links } = publicState.getSnapshot();

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
        const areAttributesLink = isLink(cellData);
        const targetId = id;

        const hasElement = targetId in elements;
        const hasLink = targetId in links;
        const isFound = hasElement || hasLink;

        const newElements = { ...elements };
        const newLinks = { ...links };

        if (hasElement) {
          newElements[targetId] = normalizeElementAttributes(cellData as FlatElementData);
        } else if (hasLink) {
          newLinks[targetId] = cellData as FlatLinkData;
        } else if (!isFound) {
          if (areAttributesLink) {
            newLinks[targetId] = cellData as FlatLinkData;
          } else {
            newElements[targetId] = normalizeElementAttributes(cellData as FlatElementData);
          }
        }

        publicState.setState((previous: GraphStoreSnapshot) => {
          console.log('set', newElements, newLinks);
          return {
            ...previous,
            elements: newElements,
            links: newLinks,
          };
        });
      },

      remove(id) {
        publicState.setState((previous: GraphStoreSnapshot) => {
          const hasElement = id in previous.elements;
          const hasLink = id in previous.links;

          if (!hasElement && !hasLink) {
            return previous;
          }

          if (hasElement) {
            const elements = { ...previous.elements };
            Reflect.deleteProperty(elements, id);
            return {
              ...previous,
              elements,
            };
          }

          const links = { ...previous.links };
          Reflect.deleteProperty(links, id);
          return {
            ...previous,
            links,
          };
        });
      },
    }),
    [publicState]
  );
}
