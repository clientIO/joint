import { util } from '@joint/core';
import type { DiaElementAttributes } from '../types/cell.types';
import { elementPorts } from './element-ports';

/**
 * Converts an `ElementAttributes` record to JointJS cell attributes.
 *
 * - `portMap` → converted to native `ports` via `elementPorts()`.
 * - `ports` → passed through as-is (native JointJS format).
 * - Both present → throws.
 * @param element - The element record to convert.
 * @returns JointJS-compatible cell attributes.
 */
export function elementAttributes(element: DiaElementAttributes): DiaElementAttributes {
  if (!util.isObject(element)) {
    throw new TypeError('Invalid element format: expected an object.');
  }

  const { data = {}, portMap, ports, type, ...rest } = element;

  const attributes: DiaElementAttributes = {
    ...rest,
    type,
    data,
  };

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
