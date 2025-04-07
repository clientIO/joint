import { useCallback } from 'react';
import type { dia } from '@joint/core';
import { isAttribute, isDefined, isDiaId, isSetter, type Setter } from '../utils/is';
import { useGraphStore } from './use-graph-store';

export interface BaseAttributes extends dia.Cell.Attributes {
  readonly markup?: string | dia.MarkupJSON;
  readonly position?: dia.Point;
  readonly size?: dia.Size;
  readonly angle?: number;
  readonly data?: Record<string, unknown> | unknown;
}

/**
 * Helper function.
 * Parameters - [graph, id, attribute, value]
 * @param graph - The graph to set the element in.
 * @param id - The ID of the element to set.
 * @param attribute - The attribute to set.
 * @param value - The value to set.
 */
function setCellHelper<Attributes, Attribute extends keyof Attributes>(
  graph: dia.Graph,
  id: dia.Cell.ID,
  attribute: Attribute,
  value: unknown
) {
  const stringAttribute = attribute as string;
  const element = graph.getCell(id);

  if (!element) {
    return;
  }
  if (isSetter(value)) {
    const previousValue: Attributes[Attribute] = element.get(stringAttribute);
    const nextValue = value(previousValue);
    if (nextValue === previousValue) {
      // skip if the reference is same, same as react state does
      return;
    }

    element.set(stringAttribute, nextValue);
    return;
  }

  element.set(stringAttribute, value);
}

/**
 * Use this hook to set element attributes.
 * It returns a function to set the element attribute.
 *
 * It must be used inside the GraphProvider.
 * @group Hooks
 * @param id The ID of the element.
 * @param attribute The attribute to set.
 * @returns The function to set the element attribute. It can be reactive.
 * @experimental
 *
 * It can be used in three ways:
 * @example
 * 1. Use empty hook and define ID, attribute, and value inside the set function
 * ```tsx
 * const setElement = useSetElement();
 * setElement('element-id', 'position', { x: 100, y: 100 });
 * ```
 * @example
 * 2. Provide ID and attribute, and use the returned function to set value
 * ```tsx
 * const setElement = useSetElement('element-id', 'position');
 * setElement({ x: 100, y: 100 });
 * ```
 * @example
 * 3. Provide ID and use the returned function to set attribute and value
 * ```tsx
 * const setElement = useSetElement('element-id');
 * setElement('position', { x: 100, y: 100 });
 * ```
 */
export function useSetElement<
  Attributes = BaseAttributes,
  Attribute extends keyof Attributes = keyof Attributes,
>(
  id: dia.Cell.ID,
  attribute: Attribute
): (value: Attributes[Attribute] | Setter<Attributes[Attribute]>) => void;

export function useSetElement<Attributes = BaseAttributes>(
  id: dia.Cell.ID
): <X extends keyof Attributes>(attribute: X, value: Attributes[X] | Setter<Attributes[X]>) => void;

export function useSetElement<Attributes = BaseAttributes>(): <X extends keyof Attributes>(
  id: dia.Cell.ID,
  attribute: X,
  value: Attributes[X] | Setter<Attributes[X]>
) => void;

// eslint-disable-next-line jsdoc/require-jsdoc
export function useSetElement<
  Attributes = BaseAttributes,
  Attribute extends keyof Attributes = keyof Attributes,
>(id?: dia.Cell.ID, attributeParameter?: Attribute) {
  const { graph } = useGraphStore();
  const setElement = useCallback(
    (idOrAttributeOrValue: unknown, attributeOrValue?: unknown, value?: unknown) => {
      if (isDiaId(idOrAttributeOrValue) && isAttribute(attributeOrValue) && isDefined(value)) {
        // this mean, there is ID, attribute, and value via this fn
        setCellHelper(graph, idOrAttributeOrValue, attributeOrValue, value);
        return;
      }

      if (!isDiaId(id)) {
        return;
      }

      if (isAttribute(idOrAttributeOrValue) && isDefined(attributeOrValue)) {
        // this mean, there is attribute and value via this fn
        setCellHelper(graph, id, idOrAttributeOrValue, attributeOrValue);
        return;
      }

      if (!isAttribute(attributeParameter)) {
        return;
      }
      // mean only value is provided
      setCellHelper(graph, id, attributeParameter, idOrAttributeOrValue);
    },
    [attributeParameter, graph, id]
  );
  return setElement;
}

export type SetCell = ReturnType<typeof useSetElement>;
