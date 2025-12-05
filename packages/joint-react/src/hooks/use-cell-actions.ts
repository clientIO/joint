/* eslint-disable sonarjs/cognitive-complexity */
import { useMemo } from 'react';
import { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { CellWithId } from '../types/cell.types';
import type { GraphLink } from '../types/link-types';
import { useGraphStore } from './use-graph-store';

interface CellActions<Attributes extends dia.Element | GraphElement> {
  set: {
    (attributes: Attributes): void;
    (id: dia.Cell.ID, updater: (previous: Attributes) => Attributes): void;
  };
  remove: (id: dia.Cell.ID) => void;
}

/**
 * Type guard to check if a cell represents a link.
 * @param cell - The cell to check.
 * @returns True if the cell is a link, false otherwise.
 */
function isLink(cell: CellWithId): cell is GraphLink<'standard.Link'> {
  return cell instanceof dia.Link || ('source' in cell && 'target' in cell);
}

/**
 * Hook to provide actions for manipulating cells in the graph.
 * @group Hooks
 * @template Attributes - The type of cell attributes, which can be an element or a link.
 * @returns - An object containing methods to set and remove cells.
 * @example
 * ```tsx
 * const { set, remove } = useCellActions<GraphElement | GraphLink<"standard.Link">>();
 *
 * // Update element
 * set({ id: '1', position: { x: 100, y: 150 } });
 * // Update with updater fn
 * set('1', (cell) => ({ ...cell.toJSON(), position: { x: 200, y: 250 } }));
 * // Remove element
 * remove('1');
 * ```
 */
export function useCellActions<
  Attributes extends GraphElement | GraphLink<'standard.Link'>,
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
            elements.find((element) => element.id === attributesOrId) ||
            links.find((link) => link.id === attributesOrId);

          if (!cell) throw new Error(`Cell with id "${attributesOrId}" not found.`);
          attributes = maybeUpdater(cell as Attributes);
        } else if (typeof attributesOrId === 'object') {
          attributes = attributesOrId;
        } else {
          throw new TypeError('Invalid arguments for set().');
        }

        const areAttributesLink = isLink(attributes);

        let hasElement = false;
        let hasLink = false;
        const newLinks = [...links];
        const newElements = [...elements];

        for (let index = 0; index < newElements.length; index++) {
          if (newElements[index].id === attributesOrId) {
            newElements[index] = attributes;
            hasElement = true;
            break;
          }
        }
        if (!hasElement) {
          for (let index = 0; index < newLinks.length; index++) {
            if (newLinks[index].id === attributesOrId) {
              newLinks[index] = attributes as GraphLink<'standard.Link'>;
              hasLink = true;
              break;
            }
          }
        }
        const isFound = hasElement || hasLink;
        if (!isFound) {
          if (areAttributesLink) {
            newLinks.push(attributes as GraphLink<'standard.Link'>);
          } else {
            newElements.push(attributes);
          }
        }
        publicState.setState((previous) => ({
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
