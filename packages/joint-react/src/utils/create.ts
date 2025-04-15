import type {
  GraphElementBase,
  GraphElementItem,
  StandardShapesType,
} from '../types/element-types';
import type { GraphLink, GraphLinkBase, StandardLinkShapesType } from '../types/link-types';

/**
 * Create elements helper function.
 * @group Utils
 * @param data - Array of elements to create.
 * @returns Array of elements. (Nodes)
 * @example
 * without custom data
 * ```ts
 * const elements = createElements([
 *  { id: '1', type: 'rect', x: 10, y: 10, width: 100, height: 100 },
 *  { id: '2', type: 'circle', x: 200, y: 200, width: 100, height: 100 },
 * ]);
 * ```
 * @example
 * with custom data
 * ```ts
 * const elements = createElements([
 * { id: '1', type: 'rect', x: 10, y: 10 ,data : { label: 'Node 1' }, width: 100, height: 100 },
 * { id: '2', type: 'circle', x: 200, y: 200, data : { label: 'Node 2' }, width: 100, height: 100 },
 * ]);
 * ```
 */
export function createElements<
  Data,
  Type extends StandardShapesType | string = string,
  Element extends GraphElementBase<Type> = GraphElementItem<Data, Type>,
>(
  data: Array<Element & GraphElementBase<Type>>
): Array<Element & { isElement: true; isLink: false; width: number; height: number }> {
  return data.map((element) => ({ ...element, isElement: true, isLink: false })) as Array<
    Element & { isElement: true; isLink: false; width: number; height: number }
  >;
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
export type InferElement<T extends Array<Record<string, unknown>>> = T[number];

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
export function createLinks<
  Link extends GraphLinkBase<Type>,
  Type extends StandardLinkShapesType | string = string,
>(data: Array<Link & GraphLinkBase<Type>>): Array<Link & GraphLink> {
  return data.map((link) => ({ ...link, isElement: false, isLink: true }));
}
