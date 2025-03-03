import type { GraphElementBase } from '../data/graph-elements';
import type { GraphLink, GraphLinkBase } from '../data/graph-links';

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
export function createElements<E extends GraphElementBase>(
  data: E[]
): Array<E & { isElement: true; isLink: false }> {
  return data.map((element) => ({ ...element, isElement: true, isLink: false }));
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
export type InferElement<T> = T extends Array<infer U> ? Readonly<U> : never;

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
export function createLinks<Item extends GraphLinkBase = GraphLinkBase>(
  data: Item[]
): Array<Item & GraphLink> {
  return data.map((link) => ({ ...link, isElement: false, isLink: true }));
}
