import { type dia } from '@joint/core';
import type { DiaElementRecord, ElementRecord } from '../../types/cell.types';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { elementAttributes } from '../../presets/element-attributes';

/**
 * Forward mapper using the React default element type.
 * @param element
 */
export function mapElementToAttributes(element: DiaElementRecord): dia.Cell.JSON {
  const attributes = elementAttributes(element) as dia.Cell.JSON;
  // Ensure `data` is always present to avoid JointJS warnings about missing connection data. See `ElementModel.defaults()`.
  if (!attributes.data) attributes.data = {};

  // @todo: no longer required or change elementAttributes
  if (!attributes.type) attributes.type = ELEMENT_MODEL_TYPE;
  return attributes;
}

/**
 * Converts JointJS element attributes back to an element record.
 *
 * - `portMap` on model → return `portMap` (ignore native `ports`).
 * - No `portMap` → return `ports` as-is.
 *
 * 1:1 mapping — no `presentation` wrapper.
 * @param attributes
 */
export function mapAttributesToElement<ElementData extends DiaElementRecord>(
  attributes: dia.Element.Attributes
): ElementRecord<ElementData> {
  const {
    type,
    // Ports
    portMap,
    ports,
    // 1:1 mapping of all other fields directly on the model
    ...elementRecord
  } = attributes;

  // The element record can have either `portMap` or `ports`, but not both.
  // If `portMap` is present, it means the `ports` were generated from it.
  if (portMap) {
    elementRecord.portMap = portMap;
  } else if (ports) {
    elementRecord.ports = ports;
  }

  // Only a custom type should be included in the element record.
  if (type && type !== ELEMENT_MODEL_TYPE) {
    elementRecord.type = type;
  }

  return { ...elementRecord } as ElementRecord<ElementData>;
}

/** Function signature that maps raw JointJS element attributes to an `ElementRecord`. */
export type MapAttributesToElement<ElementData extends DiaElementRecord> =
  typeof mapAttributesToElement<ElementData>;

/** Function signature that maps an `ElementRecord` back to JointJS element attributes. */
export type MapElementToAttributes = typeof mapElementToAttributes;
