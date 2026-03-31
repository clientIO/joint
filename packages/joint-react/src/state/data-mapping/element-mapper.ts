import { type dia } from '@joint/core';
import type { ElementRecord } from '../../types/data-types';
import { PORTAL_ELEMENT_TYPE } from '../../models/portal-element';
import { convertPorts, createPortGroupsDefault } from './convert-ports';
import { isRecord } from '../../utils/is';
import type { CellAttributes } from './index';

/**
 * Checks if the given data is a valid element data object.
 * @param data - The data to validate
 * @returns True if the data is a valid element data record
 */
function isElementData(data: unknown): data is ElementRecord {
  return isRecord(data);
}

/**
 * Forward mapper: converts an ElementRecord to JointJS cell attributes.
 *
 * - `portMap` → converted to native `ports`, stored on the model for reverse mapping.
 * - `ports` → passed through as-is (native JointJS format).
 * - Both present → throws an error.
 *
 * All fields are stored directly on the model (1:1 mapping, no `presentation` wrapper).
 */
export function elementToAttributes<ElementData extends object = Record<string, unknown>>(options: {
  id: string;
  element: ElementRecord<ElementData>;
}): CellAttributes {
  const { id, element } = options;
  if (!isElementData(element)) {
    throw new Error('Invalid element format: expected an object.');
  }

  const {
    data = {} as ElementData,
    portMap,
    portStyle,
    ports,
    type = PORTAL_ELEMENT_TYPE,
    ...cellAttributes
  } = element;

  const attributes: CellAttributes = {
    ...cellAttributes,
    id,
    type,
    data,
  };

  if (portMap) {
    if (ports) {
      throw new Error('Cannot use both "portMap" and "ports" on the same element.');
    }
    attributes.ports = convertPorts(portMap, portStyle);
    attributes.portDefaults = createPortGroupsDefault();
    attributes.portMap = portMap;
  } else {
    attributes.ports = ports ?? {};
  }
  if (portStyle) attributes.portStyle = portStyle;

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
    data,
    portMap,
    portStyle,
    position,
    size,
    angle,
    z,
    layer,
    parent,
    type,
    attrs,
  } = attributes;

  const elementRecord: ElementRecord<ElementData> = {
    data,
    position,
    size,
    angle,
    z,
    layer,
    parent,
  };

  if (attrs) elementRecord.attrs = attrs;

  if (portMap) {
    elementRecord.portMap = portMap;
  } else if (attributes.ports) {
    elementRecord.ports = attributes.ports;
  }
  if (portStyle) elementRecord.portStyle = portStyle;

  if (type && type !== PORTAL_ELEMENT_TYPE) {
    elementRecord.type = type;
  }

  return { ...elementRecord };
}

export type MapAttributesToElement<ElementData extends object = Record<string, unknown>> =
  typeof attributesToElement<ElementData>;

export type MapElementToAttributes<ElementData extends object = Record<string, unknown>> =
  typeof elementToAttributes<ElementData>;

export type MapElementToAttributesOptions<ElementData extends object = Record<string, unknown>> =
  Parameters<MapElementToAttributes<ElementData>>[0];
