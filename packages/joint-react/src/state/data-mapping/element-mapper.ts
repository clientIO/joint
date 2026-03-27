import { type dia } from '@joint/core';
import type { Element } from '../../types/data-types';
import { PORTAL_ELEMENT_TYPE } from '../../models/portal-element';
import { convertPorts, createPortGroupsDefault } from './convert-ports';
import { isRecord } from '../../utils/is';
import type { CellAttributes } from './index';

/**
 * Checks if the given data is a valid element data object.
 * @param data - The data to validate
 * @returns True if the data is a valid element data record
 */
function isElementData(data: unknown): data is Element {
  return isRecord(data);
}

export function elementToAttributes<ElementData extends object | undefined = undefined>(options: {
  id: string;
  element: Element<ElementData>;
}): CellAttributes {
  const { id, element } = options;
  if (!isElementData(element)) {
    throw new Error('Invalid element data: expected an object.');
  }

  const {
    data: customData = {},
    position,
    size,
    angle,
    z,
    layer,
    parent,
    ports,
    portStyle,
  } = element;

  const attributes: CellAttributes = { id, type: PORTAL_ELEMENT_TYPE };

  if (position !== undefined) {
    attributes.position = position;
  }
  if (size !== undefined) {
    attributes.size = size;
  }
  if (angle !== undefined) attributes.angle = angle;
  if (z !== undefined) attributes.z = z;
  if (layer !== undefined) attributes.layer = layer;
  if (parent !== undefined) attributes.parent = parent;

  if (ports) {
    attributes.ports = convertPorts(ports, portStyle);
    attributes.portDefaults = createPortGroupsDefault();
  }

  attributes.data = { ...customData, ports, portStyle };

  return attributes;
}

/**
 * Converts JointJS element attributes back to FlatElementData shape.
 * Public utility — purely mechanical, no defaultAttributes filtering.
 * @param attributes - The JointJS element attributes.
 * @returns The element item with user data in `data` field.
 */
export function attributesToElement<ElementData extends object | undefined = undefined>(
  attributes: dia.Element.Attributes
): Element<ElementData> {
  const { data: cellData, position, size, angle, z, layer, parent } = attributes;
  const { ports, portStyle, ...data } = cellData ?? {};

  const result: Element<ElementData> = {
    data,
  };

  if (position) result.position = { x: position.x, y: position.y };
  if (size) result.size = { width: size.width, height: size.height };
  if (angle !== undefined) result.angle = angle;
  if (ports !== undefined) result.ports = ports;
  if (portStyle !== undefined) result.portStyle = portStyle;
  if (z !== undefined) result.z = z;
  if (layer !== undefined) result.layer = layer;
  if (parent) result.parent = parent;
  return result;
}

export type MapAttributesToElement<ElementData extends object | undefined = undefined> =
  typeof attributesToElement<ElementData>;

export type MapElementToAttributes<ElementData extends object | undefined = undefined> =
  typeof elementToAttributes<ElementData>;
