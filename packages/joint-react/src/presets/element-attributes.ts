import { util } from '@joint/core';
import { elementPorts } from './element-ports';
import type { dia } from '@joint/core';
import type { ElementPort } from './element-ports';

/**
 * React-side declarative fields the preset adds on top of `dia.Element.Attributes`.
 * Composed orthogonally into both `ElementAttributes` (preset input) and
 * `ElementJSONInit` (record/mapper boundary).
 */
export interface ElementPresetAttributes {
  portMap?: Record<string, ElementPort>;
  portStyle?: Partial<ElementPort>;
}

/**
 * Loose preset input — no `type` required. `dia.Element.Attributes` plus the
 * React preset extras (`portMap`, `portStyle`).
 */
export interface ElementAttributes extends dia.Element.Attributes, ElementPresetAttributes {}

/**
 * Converts an `ElementAttributes` record to JointJS cell attributes.
 *
 * - `portMap` → converted to native `ports` via `elementPorts()`.
 * - `ports` → passed through as-is (native JointJS format).
 * - Both present → throws.
 * @param element - The element record to convert.
 * @returns JointJS-compatible cell attributes.
 */
export function elementAttributes(element: ElementAttributes): dia.Element.Attributes {
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
