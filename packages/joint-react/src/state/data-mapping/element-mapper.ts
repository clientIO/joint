import { type dia } from '@joint/core';
import type { ElementRecord } from '../../types/data-types';
import { PORTAL_ELEMENT_TYPE } from '../../models/portal-element';
import { convertPorts, createPortGroupsDefault } from './convert-ports';
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
export function elementToAttributes<ElementData extends object = Record<string, unknown>>(
  element: ElementRecord<ElementData>
): CellAttributes {
  if (!isRecord(element)) {
    throw new Error('Invalid element format: expected an object.');
  }

  const {
    data = {} as ElementData,
    portMap,
    ports,
    portDefaults,
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
    if (portDefaults) {
      throw new Error('Cannot use both "portMap" and "portDefaults" on the same element. Port defaults are generated automatically when using portMap.');
    }
    attributes.ports = convertPorts(portMap, element.portStyle);
    attributes.portDefaults = createPortGroupsDefault();
    attributes.portMap = portMap;
  } else {
    attributes.ports = ports ?? null;
    attributes.portDefaults = portDefaults ?? null;
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
export function attributesToElement<ElementData extends object = Record<string, unknown>>(
  attributes: dia.Element.Attributes
): ElementRecord<ElementData> {

  const {
    type,
    // Ports
    portMap,
    ports,
    portDefaults,
    // 1:1 mapping of all other fields directly on the model
    ...elementRecord
  } = attributes;

  // The element record can have either `portMap` or `ports`, but not both.
  // If `portMap` is present, it means the `ports` were generated from it.
  if (portMap) {
    elementRecord.portMap = portMap;
  } else if (ports) {
    elementRecord.ports = ports;
    elementRecord.portDefaults = portDefaults;
  }

  // Only a custom type should be included in the element record.
  if (type && type !== PORTAL_ELEMENT_TYPE) {
    elementRecord.type = type;
  }

  return { ...elementRecord };
}

export type MapAttributesToElement<ElementData extends object = Record<string, unknown>> =
  typeof attributesToElement<ElementData>;

export type MapElementToAttributes<ElementData extends object = Record<string, unknown>> =
  (options: { id: string; element: ElementRecord<ElementData> }) => CellAttributes;

export type MapElementToAttributesOptions<ElementData extends object = Record<string, unknown>> =
  Parameters<MapElementToAttributes<ElementData>>[0];
