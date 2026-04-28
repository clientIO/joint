import { util } from '@joint/core';
import type { ElementAttributes, WithType } from '../types/cell.types';
import { elementPorts } from './element-ports';

/**
 * Converts an `ElementRecord` to JointJS cell attributes.
 *
 * - `portMap` → converted to native `ports` via `elementPorts()`.
 * - `ports` → passed through as-is (native JointJS format).
 * - Both present → throws.
 * @param element - The element record to convert.
 * @returns JointJS-compatible cell attributes.
 */
export function elementAttributes<ElementData = unknown>(
  element: ElementAttributes & WithType & { readonly data?: ElementData }
): Record<string, unknown> {
  if (!util.isObject(element)) {
    throw new TypeError('Invalid element format: expected an object.');
  }

  const { data = {} as ElementData, portMap, ports, type, ...rest } = element;

  const attributes: Record<string, unknown> = {
    ...rest,
    ...(type && { type }),
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
