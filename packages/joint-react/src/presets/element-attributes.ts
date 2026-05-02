import { util } from '@joint/core';
import { elementPorts } from './element-ports';
import type { dia } from '@joint/core';
import type { ElementPort} from './element-ports';

export interface ElementJSONInit extends dia.Element.JSONInit {
  portMap?: Record<string, ElementPort>;
  portStyle?: Partial<ElementPort>;
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
export function elementAttributes(element: ElementJSONInit): ElementJSONInit {
  if (!util.isObject(element)) {
    throw new TypeError('Invalid element format: expected an object.');
  }

  const { portMap, ports, type, ...rest } = element;

  const attributes: ElementJSONInit = {
    ...rest,
    type,
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
