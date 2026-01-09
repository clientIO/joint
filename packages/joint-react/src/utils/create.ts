import type { GraphElement, StandardShapesTypeMapper } from '../types/element-types';
import type { GraphLink, StandardLinkShapesType } from '../types/link-types';

type RequiredElementProps = {
  width?: number;
  height?: number;
};

type ElementWithAttributes<T extends string | undefined = undefined> =
  T extends keyof StandardShapesTypeMapper
    ? { type?: T; attrs?: StandardShapesTypeMapper[T] }
    : // eslint-disable-next-line sonarjs/no-redundant-optional
      { type?: undefined; attrs?: StandardShapesTypeMapper['ReactElement'] };

/**
 * Create a single element helper function.
 * @group Utils
 * @param item - Element to create.
 * @returns The created element. (Node)
 * @example
 * without custom data
 * ```ts
 * const element = createElementItem({
 *   id: '1',
 *   type: 'rect',
 *   x: 10,
 *   y: 10,
 *   width: 100,
 *   height: 100,
 * });
 * ```
 * @example
 * with custom data
 * ```ts
 * const element = createElementItem({
 *   id: '1',
 *   type: 'rect',
 *   x: 10,
 *   y: 10,
 *   data: { label: 'Node 1' },
 *   width: 100,
 *   height: 100,
 * });
 * ```
 */
export function createElementItem<
  Element extends GraphElement,
  Type extends string | undefined = 'ReactElement',
>(item: Element & ElementWithAttributes<Type>): Element & RequiredElementProps {
  return { ...item } as Element & RequiredElementProps;
}

/**
 * Create elements helper function.
 * @group Utils
 * @param items - Array of elements to create.
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
  Element extends GraphElement,
  Type extends string | undefined = 'ReactElement',
>(items: Array<Element & ElementWithAttributes<Type>>): Array<Element & RequiredElementProps> {
  return items.map((item) => ({ ...item })) as Array<Element & RequiredElementProps>;
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
  Link extends GraphLink<Type>,
  Type extends StandardLinkShapesType | string = 'standard.Link',
>(data: Array<Link & GraphLink<Type>>): Array<Link & GraphLink> {
  return data.map((link) => link);
}

/**
 * Create a single link helper function.
 * @group Utils
 * @param link - Link to create.
 * @returns The created link. (Edge)
 * @example
 * ```ts
 * const link = createLinkItem({ id: '1', source: '1', target: '2' });
 * ```
 */
export function createLinkItem<
  Link extends GraphLink<Type>,
  Type extends StandardLinkShapesType | string = 'standard.Link',
>(link: Link & GraphLink<Type>): Link & GraphLink {
  return link;
}
