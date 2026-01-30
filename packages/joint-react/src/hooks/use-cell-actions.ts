import { useMemo } from 'react';
import type { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import type { GraphStoreSnapshot } from '../store';
import { useGraphStore } from './use-graph-store';

/**
 * Normalizes element attributes to the GraphElement format.
 * Converts nested JointJS format (position: {x, y}, size: {width, height})
 * to flat format (x, y, width, height).
 * @param attributes
 */
function normalizeElementAttributes<T extends GraphElement>(attributes: T): T {
  const {
    position,
    size,
    ...rest
  } = attributes as T & {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  };

  const normalized = { ...rest } as T;

  // Convert position to flat x, y (prefer position over existing x, y)
  if (position !== undefined) {
    (normalized as GraphElement).x = position.x;
    (normalized as GraphElement).y = position.y;
  }

  // Convert size to flat width, height (prefer size over existing width, height)
  if (size !== undefined) {
    (normalized as GraphElement).width = size.width;
    (normalized as GraphElement).height = size.height;
  }

  return normalized;
}

/**
 * Actions for manipulating cells (elements and links) in the graph.
 * @template Attributes - The type of cell attributes, which can be an element or a link
 */
interface CellActions<Attributes extends dia.Element | GraphElement> {
  /**
   * Sets or updates a cell in the graph.
   * Can be called in two ways:
   * 1. With ID and attributes: `set('1', { x: 100, y: 150 })`
   * 2. With ID and updater: `set('1', (prev) => ({ ...prev, label: 'New' }))`
   * If the cell doesn't exist, it will be added.
   */
  set: (id: dia.Cell.ID, attributesOrUpdater: Attributes | ((previous: Attributes) => Attributes)) => void;
  /**
   * Removes a cell from the graph by its ID.
   * @param id - The ID of the cell to remove
   */
  remove: (id: dia.Cell.ID) => void;
}

/**
 * Type guard to check if a cell represents a link.
 * @param cell - The cell to check.
 * @returns True if the cell is a link, false otherwise.
 */
function isLink(cell: GraphElement | GraphLink): cell is GraphLink {
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
 * const { set, remove } = useCellActions<GraphElement | GraphLink<"standard.Link">>();
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
  Attributes extends GraphElement | GraphLink,
>(): CellActions<Attributes> {
  const { graph, publicState } = useGraphStore();

  return useMemo(
    (): CellActions<Attributes> => ({
      set(
        id: dia.Cell.ID,
        attributesOrUpdater: Attributes | ((previousAttributes: Attributes) => Attributes)
      ) {
        let attributes: Attributes;
        const { elements, links } = publicState.getSnapshot();

        if (typeof attributesOrUpdater === 'function') {
          const cell: GraphElement | GraphLink | undefined = elements[id] || links[id];

          if (!cell) throw new Error(`Cell with id "${id}" not found.`);
          attributes = attributesOrUpdater(cell as Attributes);
        } else {
          attributes = attributesOrUpdater;
        }

        const areAttributesLink = isLink(attributes);
        const targetId = id;

        const hasElement = targetId in elements;
        const hasLink = targetId in links;
        const isFound = hasElement || hasLink;

        const newElements = { ...elements };
        const newLinks = { ...links };

        if (hasElement) {
          newElements[targetId] = normalizeElementAttributes(attributes);
        } else if (hasLink) {
          newLinks[targetId] = attributes as GraphLink;
        } else if (!isFound) {
          if (areAttributesLink) {
            newLinks[targetId] = attributes as GraphLink;
          } else {
            newElements[targetId] = normalizeElementAttributes(attributes);
          }
        }

        publicState.setState((previous: GraphStoreSnapshot) => ({
          ...previous,
          elements: newElements,
          links: newLinks,
        }));
      },

      remove(id) {
        graph.getCell(id)?.remove();
      },
    }),
    [graph, publicState]
  );
}
