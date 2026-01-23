/* eslint-disable sonarjs/cognitive-complexity */
import { useMemo } from 'react';
import { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { CellWithId } from '../types/cell.types';
import type { GraphLink } from '../types/link-types';
import type { GraphStoreSnapshot } from '../store';
import { useGraphStore } from './use-graph-store';

/**
 * Actions for manipulating cells (elements and links) in the graph.
 * @template Attributes - The type of cell attributes, which can be an element or a link
 */
interface CellActions<Attributes extends dia.Element | GraphElement> {
  /**
   * Sets or updates a cell in the graph.
   * Can be called in two ways:
   * 1. With full attributes: `set({ id: '1', ...attributes })`
   * 2. With ID and updater: `set('1', (prev) => ({ ...prev, label: 'New' }))`
   * If the cell doesn't exist, it will be added.
   */
  set: {
    (attributes: Attributes): void;
    (id: dia.Cell.ID, updater: (previous: Attributes) => Attributes): void;
  };
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
function isLink(cell: CellWithId): cell is GraphLink {
  return cell instanceof dia.Link || ('source' in cell && 'target' in cell);
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
 * // Add or update element with full attributes
 * set({ id: '1', position: { x: 100, y: 150 }, width: 100, height: 50 });
 *
 * // Update element with updater function (safer, preserves other properties)
 * set('1', (cell) => ({ ...cell, position: { x: 200, y: 250 } }));
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
        attributesOrId: Attributes | dia.Cell.ID,
        maybeUpdater?: (previousAttributes: Attributes) => Attributes
      ) {
        let attributes: Attributes;
        const { elements, links } = publicState.getSnapshot();
        if (
          typeof attributesOrId !== 'object' &&
          maybeUpdater &&
          typeof maybeUpdater === 'function'
        ) {
          const cell: GraphElement | GraphLink | undefined =
            elements.find((element: GraphElement) => element.id === attributesOrId) ||
            links.find((link: GraphLink) => link.id === attributesOrId);

          if (!cell) throw new Error(`Cell with id "${attributesOrId}" not found.`);
          attributes = maybeUpdater(cell as Attributes);
        } else if (typeof attributesOrId === 'object') {
          attributes = attributesOrId;
        } else {
          throw new TypeError('Invalid arguments for set().');
        }

        const areAttributesLink = isLink(attributes);
        const targetId = typeof attributesOrId === 'object' ? attributes.id : attributesOrId;

        let hasElement = false;
        let hasLink = false;
        const newLinks = [...links];
        const newElements = [...elements];

        for (let index = 0; index < newElements.length; index++) {
          if (newElements[index].id === targetId) {
            newElements[index] = attributes;
            hasElement = true;
            break;
          }
        }
        if (!hasElement) {
          for (let index = 0; index < newLinks.length; index++) {
            if (newLinks[index].id === targetId) {
              newLinks[index] = attributes as GraphLink;
              hasLink = true;
              break;
            }
          }
        }
        const isFound = hasElement || hasLink;
        if (!isFound) {
          if (areAttributesLink) {
            newLinks.push(attributes as GraphLink);
          } else {
            newElements.push(attributes);
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
