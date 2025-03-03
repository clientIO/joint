import type { dia } from '@joint/core';
import type { BaseElement, BaseLink } from '../types/cell.types';

/**
 * Validates that all elements have unique 'id's.
 * @param elements - Array of BaseElement objects to validate.
 * @throws Will throw an error if duplicate 'id's are found.
 */
function validateUniqueIds<Data>(elements: BaseElement<Data>[]): void {
  const seenIds = new Set<dia.Cell.ID>();
  for (const element of elements) {
    if (seenIds.has(element.id)) {
      throw new Error(`Duplicate id found: ${element.id}`);
    }
    seenIds.add(element.id);
  }
}

/**
 * Create elements helper function.
 * @group Utils
 * @param data - Array of elements to create.
 * @returns Array of elements. (Nodes)
 * @example
 * ```ts
 * const elements = createElements([
 *  { id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 100 },
 *  { id: '2', type: 'circle', x: 200, y: 200, width: 100, height: 100 },
 * ]);
 */
export function createElements<Data, E extends BaseElement<Data>>(data: E[]): E[] {
  validateUniqueIds(data);
  return data;
}

/**
 * Infer element based on typeof createElements
 * @group Utils
 * @example
 * ```ts
 * const elements = createElements([
 * { id: '1', type: 'rect', x: 10, y: 10 ,data : { label: 'Node 1' }, width: 100, height: 100 },
 * { id: '2', type: 'circle', x: 200, y: 200, data : { label: 'Node 2' }, width: 100, height: 100 },
 * ]);
 *
 * type BaseElementWithData = InferElement<typeof elements>;
 * ```
 */
export type InferElement<T extends BaseElement[]> = Readonly<T[0]>;

/**
 * Create links helper function.
 * @group Utils
 * @param data - Array of links to create.
 * @returns Array of links. (Edges)
 * @example
 * ```ts
 * const links = createLinks([
 *  { id: '1', source: '1', target: '2' },
 *  { id: '2', source: '2', target: '3' },
 * ]);
 * ```
 */
export function createLinks<T extends BaseLink = BaseLink>(data: T[]) {
  return data;
}
