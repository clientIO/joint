import { util } from '@joint/core';
import { elementPorts } from './element-ports';
import type { dia } from '@joint/core';
import type { ElementPort } from './element-ports';

/**
 * React-side declarative fields the preset adds on top of `dia.Element.Attributes`.
 * Composed orthogonally into both `ElementAttributes` (preset input) and
 * `ElementJSONInit` (record/mapper boundary).
 * @group Types
 */
export interface ElementPresetAttributes {
  /** Ports keyed by id; each value is an {@link ElementPort} expanded into native `ports` by {@link elementPorts}, and its key becomes the port id. */
  portMap?: Record<string, ElementPort>;
  /** Shared {@link ElementPort} styling merged into every `portMap` entry before that entry's own values. */
  portStyle?: Partial<ElementPort>;
}

/**
 * Loose preset input, no `type` required. `dia.Element.Attributes` plus the
 * React preset extras (`portMap`, `portStyle`).
 * @expand
 * @group Types
 */
export interface ElementAttributes extends dia.Element.Attributes, ElementPresetAttributes {}

/**
 * Normalizes a declarative element description into JointJS cell attributes.
 * The `portMap` shorthand is expanded into native `ports` via {@link elementPorts}
 * (and kept on the result as `portMap`); a native `ports` value is passed through
 * untouched. Use it when feeding a {@link ElementModel} or building a model's
 * `defaults()`.
 * @param element - The declarative element description to convert.
 * @returns Attributes ready to pass to an element model.
 * @throws TypeError when `element` is not a plain object.
 * @throws Error when both `portMap` and `ports` are supplied.
 * @example
 * Feed an element model:
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
 * Build a custom model's defaults:
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
