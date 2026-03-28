import { type dia } from '@joint/core';
import type { Element, ElementStyle } from '../../types/data-types';
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
    type = PORTAL_ELEMENT_TYPE,
    data = {} as ElementData,
    style,
    ...cellJSON
  } = element;

  const attributes: CellAttributes = { id, type, data, style, ...cellJSON };

  if (style?.ports) {
    const { ports, portStyle } = style;
    attributes.ports = convertPorts(ports, portStyle);
    attributes.portDefaults = createPortGroupsDefault();
  }

  return attributes;
}

/**
 * Converts JointJS element attributes back to Element shape.
 * Public utility — purely mechanical, no defaultAttributes filtering.
 * @param attributes - The JointJS element attributes.
 * @returns The element item with user data in `data` field.
 */
export function attributesToElement<ElementData extends object | undefined = undefined>(
  attributes: dia.Element.Attributes
): Element<ElementData> {
  const { data = {}, style, position, size, angle, z, layer, parent, attrs, type } = attributes;

  const element: Element<ElementData> = {
    data,
  };

  if (position) element.position = { x: position.x ?? 0, y: position.y ?? 0 };
  if (size) element.size = { width: size.width ?? 0, height: size.height ?? 0 };
  if (angle !== undefined) element.angle = angle;
  if (style) element.style = style;
  if (z !== undefined) element.z = z;
  if (layer !== undefined) element.layer = layer;
  if (type !== undefined) element.type = type;
  if (parent) element.parent = parent;
  if (attrs !== undefined) element.attrs = attrs as Record<string, Record<string, unknown>>;
  return element;
}

export type MapAttributesToElement<ElementData extends object | undefined = undefined> =
  typeof attributesToElement<ElementData>;

export type MapElementToAttributes<ElementData extends object | undefined = undefined> =
  typeof elementToAttributes<ElementData>;

export type MapElementToAttributesOptions<ElementData extends object | undefined = undefined> =
  Parameters<MapElementToAttributes<ElementData>>[0];
