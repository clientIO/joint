

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

/**
 * Forward mapper: converts an Element record to JointJS cell attributes.
 * @param options
 * @param options.id
 * @param options.element
 * @returns Cell attributes for the given element, with user data wrapped in `data` field for PortalElement.
 */
export function elementToAttributes<ElementData extends object | undefined = undefined>(options: {
  id: string;
  element: Element<ElementData>;
}): CellAttributes {
  const { element } = options;
  if (!isElementData(element)) {
    throw new Error('Invalid element format: expected an object.');
  }

  const {
      type = PORTAL_ELEMENT_TYPE,
  } = element;

  if (type !== PORTAL_ELEMENT_TYPE) {
    // For non-portal elements, the element record is a cell JSON with optional `data`.
    // Note: `presentation` is not supported on non-portal elements.
    return element as CellAttributes;
  }

  // PortalElement mapping

  const {
    data = {} as ElementData,
    ports,
    portStyle,
    ...cellAttributes
  } = element;

  const presentation: Record<string, unknown> = {};
  if (ports) presentation.ports = ports;
  if (portStyle) presentation.portStyle = portStyle;

  const attributes: CellAttributes = {
    ...cellAttributes,
    type,
    data,
    presentation,
  };

  if (ports) {
    attributes.ports = convertPorts(ports, portStyle);
    attributes.portDefaults = createPortGroupsDefault();
  }

  return attributes;
}

/**
 * Converts JointJS element attributes back to Element record.
 * Public utility — purely mechanical, no defaultAttributes filtering.
 * @param attributes - The JointJS element attributes.
 * @returns The element item with user data in `data` field.
 */
export function attributesToElement<ElementData extends object | undefined = undefined>(
  attributes: dia.Element.Attributes
): Element<ElementData> {

  const { type } = attributes;
  if (type !== PORTAL_ELEMENT_TYPE) {
    // For non-portal elements, we treat the entire attributes as the element record with optional `data`.
    return attributes as Element<ElementData>;
  }

  // PortalElement mapping

  const {
    data,
    presentation,
    // Supported JointJS element attributes that we want to include
    // in the portal element record
    position,
    size,
    angle,
    z,
    layer,
    parent,
  } = attributes;

  const elementRecord: Element<ElementData> = {
    ...presentation,
    data,
    position,
    size,
    angle,
    z,
    layer,
    parent
  };

  // @todo what about attributes such a `stackIndex` or `direction` used in
  // automatic layouts. If we put them inside the `data` field, they trigger
  // unnecessary re-renders when they change. But if we put them at the top level,
  // they get lost when converting back and forth between attributes and element.

  // Filter out undefined values.
  return { ...elementRecord };
}

export type MapAttributesToElement<ElementData extends object | undefined = undefined> =
  typeof attributesToElement<ElementData>;

export type MapElementToAttributes<ElementData extends object | undefined = undefined> =
  typeof elementToAttributes<ElementData>;

export type MapElementToAttributesOptions<ElementData extends object | undefined = undefined> =
  Parameters<MapElementToAttributes<ElementData>>[0];
