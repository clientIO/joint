import { util } from '@joint/core';
import { elementPorts } from './element-ports';
import type { dia } from '@joint/core';
import type { ElementPort } from './element-ports';

/**
 * Loose preset input — no `type` required. The preset transforms declarative
 * fields (`portMap`) into native JointJS shapes; it does not depend on the
 * cell discriminator.
 */
export interface ElementPresetAttributes extends dia.Element.Attributes {
  portMap?: Record<string, ElementPort>;
  portStyle?: Partial<ElementPort>;
}

/**
 * Type-required variant used at the record / mapper boundary.
 */
export interface ElementJSONInit extends ElementPresetAttributes {
  type: string;
}

/**
 * Converts an `ElementAttributes` record to JointJS cell attributes.
 *
 * - `portMap` → converted to native `ports` via `elementPorts()`.
 * - `ports` → passed through as-is (native JointJS format).
 * - Both present → throws.
 * @param element - The element record to convert.
 * @returns JointJS-compatible cell attributes.
 */
export function elementAttributes(element: ElementPresetAttributes): dia.Element.Attributes {
  if (!util.isObject(element)) {
    throw new TypeError('Invalid element format: expected an object.');
  }

  const { portMap, ports, ...attributes } = element;

  if (portMap) {
    if (ports) {
      throw new Error('Cannot use both "portMap" and "ports" on the same element.');
    }
    attributes.ports = elementPorts(portMap, element.portStyle);
    attributes.portMap = portMap;
  } else if (ports) {
    attributes.ports = ports;
  }

  return attributes;
}
