import { type dia } from '@joint/core';
import type { BaseElementRecord, WithType } from '../../types/cell.types';
import { ELEMENT_MODEL_TYPE } from '../../models/element-model';
import { elementAttributes } from '../../presets/element-attributes';
import type { CellAttributes } from './index';

/**
 * Forward mapper using the React default element type.
 * @param element
 */
export function mapElementToAttributes<ElementData = unknown>(
  element: BaseElementRecord & WithType & { readonly data?: ElementData }
): CellAttributes {
  const attributes = elementAttributes(element) as CellAttributes;
  if (!attributes.type) attributes.type = ELEMENT_MODEL_TYPE;
  return attributes;
}

/**
 * Element record produced by {@link mapAttributesToElement}.
 *
 * Wider than {@link import('../../types/cell.types').ElementRecord} — `type` is
 * optional (only present when the cell is a custom subclass) and the user `data`
 * field is opaque until the consumer narrows it. This shape is what the
 * controlled-mode pipeline actually emits when reading from a `dia.Cell`.
 */
export type MappedElementRecord<ElementData = unknown> = BaseElementRecord &
  Partial<WithType> & { readonly data?: ElementData };

/**
 * Converts JointJS element attributes back to an ElementRecord.
 *
 * - `portMap` on model → return `portMap` (ignore native `ports`).
 * - No `portMap` → return `ports` as-is.
 *
 * 1:1 mapping — no `presentation` wrapper.
 * @param attributes
 */
export function mapAttributesToElement<ElementData = unknown>(
  attributes: dia.Element.Attributes
): MappedElementRecord<ElementData> {
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

  return { ...elementRecord } as MappedElementRecord<ElementData>;
}

export type MapAttributesToElement<ElementData = unknown> =
  typeof mapAttributesToElement<ElementData>;

export type MapElementToAttributes<ElementData = unknown> =
  typeof mapElementToAttributes<ElementData>;
