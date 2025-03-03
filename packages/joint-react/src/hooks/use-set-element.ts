import { useCallback } from 'react';
import type { dia } from '@joint/core';
import { isAttribute, isDefined, isDiaId, isSetter, type Setter } from '../utils/is';
import { useGraphStore } from './use-graph-store';

export interface BaseAttributes {
  markup?: string | dia.MarkupJSON;
  position?: dia.Point;
  size?: dia.Size;
  angle?: number;
  data?: Record<string, unknown> | unknown;
}

/**
 * Helper function.
 * Parameters - [graph, id, attribute, value]
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
 * It can be used in three ways:
 * 1. Provide ID, attribute, and value
 * 2. Provide ID and attribute, and use the returned function to set the value
 * 3. Provide ID, and use the returned function to set attribute and value
 *
 * @group Hooks
 * @param id element ID
 * @param attribute to be picked, it's optional
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
