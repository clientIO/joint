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
 * Loose preset input, no `type` required. `dia.Element.Attributes` plus the
 * React preset extras (`portMap`, `portStyle`).
 */
export interface ElementAttributes extends dia.Element.Attributes, ElementPresetAttributes {}

/**
 * Normalizes element configuration into JointJS-compatible cell attributes.
 * Expands the React-preset `portMap` shorthand into native `ports` via
 * {@link elementPorts}(); passes native `ports` through; throws when both are
 * supplied.
 * @param element - The element record to convert.
 * @returns JointJS-compatible cell attributes.
 * @example
 * Expand the declarative preset input into native attributes and hand them to
 * a cell model:
 * ```tsx
 * import { ElementModel, elementAttributes } from '@joint/react';
 *
 * const element = new ElementModel(
 *   elementAttributes({
 *     type: 'standard.Rectangle',
 *     position: { x: 10, y: 20 },
 *     size: { width: 120, height: 40 },
 *     portMap: { in: { color: '#fff', cx: 0, cy: 0.5 } }, // preset shorthand
 *   })
 * );
 * ```
 * @example
 * Or build the defaults of a custom cell model class:
 * ```tsx
 * import { ElementModel, elementAttributes } from '@joint/react';
 *
 * class RectShape extends ElementModel {
 *   defaults() {
 *     return {
 *       ...super.defaults(),
 *       ...elementAttributes({
 *         type: 'standard.Rectangle',
 *         size: { width: 120, height: 40 },
 *       }),
 *     };
 *   }
 * }
 * ```
 * @group Presets
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
