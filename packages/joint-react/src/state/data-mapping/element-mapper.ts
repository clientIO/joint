
import { type dia } from '@joint/core';
import type { ElementRecord, ElementPort } from '../../types/data-types';
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
 * - `portMap` → converted to native `ports`, stored as `portMap` on the model for reverse mapping.
 * - `ports` → passed through as-is (native JointJS format).
 * - Both present → throws an error.
 */
export function elementToAttributes<ElementData extends object = Record<string, unknown>>(options: {
  id: string;
  element: ElementRecord<ElementData>;
}): CellAttributes {
  const { element } = options;
  if (!isElementData(element)) {
    throw new Error('Invalid element format: expected an object.');
  }

  const {
    data = {} as ElementData,
    portMap,
    portStyle,
    type = PORTAL_ELEMENT_TYPE,
    ...cellAttributes
  } = element;

  if (portMap && element.ports) {
    throw new Error('Cannot use both "portMap" and "ports" on the same element.');
  }

  const presentation: Record<string, unknown> = {};
  if (portMap) presentation.portMap = portMap;
  if (portStyle) presentation.portStyle = portStyle;

  const attributes: CellAttributes = {
    ...cellAttributes,
    type,
    data,
    presentation,
  };

  if (portMap) {
    attributes.ports = convertPorts(portMap, portStyle);
    attributes.portDefaults = createPortGroupsDefault();
    attributes.portMap = portMap;
  }

  return attributes;
}

/**
 * Converts JointJS element attributes back to an ElementRecord.
 *
 * - `portMap` on model → return `portMap` (ignore native `ports`).
 * - No `portMap` → return `ports` as-is.
 */
export function attributesToElement<ElementData extends object = Record<string, unknown>>(
  attributes: dia.Element.Attributes
): ElementRecord<ElementData> {

  const {
    data,
    presentation,
    portMap,
    position,
    size,
    angle,
    z,
    layer,
    parent,
    type,
  } = attributes;

  const elementRecord: ElementRecord<ElementData> = {
    ...presentation,
    data,
    position,
    size,
    angle,
    z,
    layer,
    parent,
  };

  // If portMap exists on the model, return it (ignore native ports).
  if (portMap) {
    elementRecord.portMap = portMap;
  } else if (attributes.ports) {
    elementRecord.ports = attributes.ports;
  }

  // Only include type if it's not the default portal type.
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
