import { type dia } from '@joint/core';
import type { ElementRecord } from '../../types/data-types';
import { PORTAL_ELEMENT_TYPE } from '../../models/portal-element';
import { convertPorts } from './convert-ports';
import { isRecord } from '../../utils/is';
import type { CellAttributes } from './index';

/**
 * Forward mapper: converts an ElementRecord to JointJS cell attributes.
 *
 * - `portMap` → converted to native `ports`, stored on the model for reverse mapping.
 * - `ports` → passed through as-is (native JointJS format).
 * - Both present → throws an error.
 *
 * All fields are stored directly on the model (1:1 mapping, no `presentation` wrapper).
 */
export function mapElementToAttributes<ElementData extends object = Record<string, unknown>>(
  element: ElementRecord<ElementData>
): CellAttributes {
  if (!isRecord(element)) {
    throw new Error('Invalid element format: expected an object.');
  }

  const {
    data = {} as ElementData,
    portMap,
    ports,
    type = PORTAL_ELEMENT_TYPE,
    ...cellAttributes
  } = element;

  const attributes: CellAttributes = {
    ...cellAttributes,
    type,
    data,
  };

  // portMap/ports dual-format: if `portMap` is present, `ports` will be generated from it.
  if (portMap) {
    if (ports) {
      throw new Error('Cannot use both "portMap" and "ports" on the same element.');
    }
    attributes.ports = convertPorts(portMap, element.portStyle);
    attributes.portMap = portMap;
  } else {
    attributes.ports = ports ?? null;
  }

  return attributes;
}

/**
 * Converts JointJS element attributes back to an ElementRecord.
 *
 * - `portMap` on model → return `portMap` (ignore native `ports`).
 * - No `portMap` → return `ports` as-is.
 *
 * 1:1 mapping — no `presentation` wrapper.
 */
export function mapAttributesToElement<ElementData extends object = Record<string, unknown>>(
  attributes: dia.Element.Attributes
): ElementRecord<ElementData> {
  const {
    type,
    // Ports
    portMap,
    ports,
    // Metadata (default-provided key tracking)
    metadata,
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
  if (type && type !== PORTAL_ELEMENT_TYPE) {
    elementRecord.type = type;
  }

  // Remove keys that came from defaults (not user-provided) to prevent round-trip pollution.
  const omit = metadata?.omit;
  if (omit) {
    for (const key of omit) {
      // @todo - it should be possible to omit size and position defaults as well
      if (key === 'size' || key === 'position') continue;
      Reflect.deleteProperty(elementRecord, key);
    }
  }

  return { ...elementRecord };
}

export type MapAttributesToElement<ElementData extends object = Record<string, unknown>> =
  typeof mapAttributesToElement<ElementData>;

export type MapElementToAttributes<ElementData extends object = Record<string, unknown>> =
  typeof mapElementToAttributes<ElementData>;
