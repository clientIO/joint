import { type dia } from '@joint/core';
import type { ElementJSONInit, ElementRecord } from '../../types/cell.types';
import { elementAttributes } from '../../presets/element-attributes';

/**
 * Fill missing position/size/angle/data with framework defaults so the
 * record satisfies `Computed<ElementRecord>`'s required-field contract.
 * @param attributes
 */
function ensureDefaults(attributes: dia.Element.JSONInit): dia.Element.JSONInit {
  const { position, size } = attributes;
  attributes.position = { x: position?.x ?? 0, y: position?.y ?? 0 };
  attributes.size = { width: size?.width ?? 0, height: size?.height ?? 0 };
  attributes.angle ??= 0;
  attributes.data ??= {};
  return attributes;
}

/**
 * Convert a React element record to JointJS-ready cell attributes —
 * applies preset transforms (`portMap` → native `ports`) and fills
 * framework defaults for `position` / `size` / `angle` / `data`.
 * @param element
 */
export function mapElementToAttributes(element: ElementJSONInit): dia.Element.JSONInit {
  return ensureDefaults(elementAttributes(element) as dia.Element.JSONInit);
}

/**
 * Converts JointJS element attributes back to an element record.
 *
 * - `portMap` on model → return `portMap` (ignore native `ports`).
 * - No `portMap` → return `ports` as-is.
 *
 * 1:1 mapping — no `presentation` wrapper.
 * @param attributes
 */
export function mapAttributesToElement<ElementData = unknown>(
  attributes: dia.Element.Attributes
): ElementRecord<ElementData> {
  const {
    // Ports
    portMap,
    ports,
    // 1:1 mapping of all other fields directly on the model
    ...elementRecord
  } = attributes;

  // The element record can have either `portMap` or `ports`, but not both.
  // If `portMap` is present, it means the `ports` were generated from it.
  if (portMap) {
    elementRecord.portMap = portMap;
  } else if (ports) {
    elementRecord.ports = ports;
  }

  return elementRecord as ElementRecord<ElementData>;
}

/** Function signature that maps raw JointJS element attributes to an `ElementRecord`. */
export type MapAttributesToElement<ElementData = unknown> =
  typeof mapAttributesToElement<ElementData>;

/** Function signature that maps an `ElementRecord` back to JointJS element attributes. */
export type MapElementToAttributes = typeof mapElementToAttributes;
