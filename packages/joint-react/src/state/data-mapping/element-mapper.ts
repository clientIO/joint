import { type dia } from '@joint/core';
import type { FlatElementData } from '../../types/data-types';
import { PORTAL_ELEMENT_TYPE } from '../../models/portal-element';
import { convertPorts, createPortGroupsDefault } from './convert-ports';
import { isRecord } from '../../utils/is';
import type { CellAttributes } from './index';

export interface ToElementAttributesOptions<ElementData = FlatElementData> {
  readonly id: string;
  readonly data: ElementData;
  readonly graph: dia.Graph;
}

export interface ToElementDataOptions<ElementData = FlatElementData> {
  readonly id: string;
  readonly attributes: dia.Element.Attributes;
  readonly defaultAttributes: dia.Element.Attributes;
  readonly element: dia.Element;
  readonly previousData?: ElementData;
  readonly graph: dia.Graph;
}

// ────────────────────────────────────────────────────────────────────────────
// React → JointJS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Checks if the given data is a valid element data object.
 * @param data - The data to validate
 * @returns True if the data is a valid element data record
 */
function isElementData(data: unknown): data is FlatElementData {
  return isRecord(data);
}
/**
 * Maps flat element data to JointJS cell attributes.
 *
 * Properties are grouped by sync direction:
 * - **↔ Two-way** — synced back to React state when the graph changes
 *   (`x`, `y`, `width`, `height`, `angle`, `z`, `layer`, `parent`)
 * - **→ One-way** — consumed during forward mapping only
 *   (`ports`)
 *
 * Flat `{x, y}` is converted to nested `{position}` and
 * flat `{width, height}` to nested `{size}` for JointJS.
 *
 * Any remaining properties are treated as user data and stored in `cell.data`.
 * @param options - The element id and data to convert
 * @returns The JointJS cell JSON attributes
 */
export function flatMapDataToElementAttributes<Element = FlatElementData>(
  options: Pick<ToElementAttributesOptions<Element>, 'id' | 'data'>
): CellAttributes {
  const { id, data } = options;
  if (!isElementData(data)) {
    throw new Error(
      'Invalid element data: expected an object with at least "x" and "y" properties.'
    );
  }
  return { ...flatElementDataToAttributes(data), id };
}

// ────────────────────────────────────────────────────────────────────────────
// JointJS → React
// ────────────────────────────────────────────────────────────────────────────

/**
 * Maps JointJS element attributes back to flat element data.
 *
 * Picks the two-way properties from `cell.attributes` and flattens
 * nested JointJS structures back to flat format:
 * - `position` → `{x, y}`
 * - `size` → `{width, height}`
 * - `angle`, `z`, `layer`, `parent` pass through directly
 *
 * Merges with `cell.data` (which holds user data saved during forward mapping).
 * Two-way properties take precedence over `cell.data` to reflect graph changes.
 * @param options - The JointJS cell and optional previous data for shape preservation
 * @returns The flat element data
 */
export function flatMapElementAttributesToData<Element = FlatElementData>(
  options: Pick<ToElementDataOptions<Element>, 'attributes' | 'defaultAttributes'>
): Element {
  const { attributes, defaultAttributes } = options;
  const data = flatAttributesToElementData<Element>(attributes);

  // Filter out values that match model defaults (not needed in React state)
  const result = data as Record<string, unknown>;
  if (attributes.angle !== undefined && attributes.angle === defaultAttributes.angle) delete result.angle;
  if (attributes.z !== undefined && attributes.z === defaultAttributes.z) delete result.z;
  if (attributes.layer !== undefined && attributes.layer === defaultAttributes.layer) delete result.layer;

  return result as Element;
}

// ────────────────────────────────────────────────────────────────────────────
// Public composable utilities
// ────────────────────────────────────────────────────────────────────────────

/**
 * Converts flat element data to JointJS cell attributes.
 * Public utility — caller provides the `id` separately.
 * @param data
 */
export function flatElementDataToAttributes(data: FlatElementData): CellAttributes {
  if (!isElementData(data)) {
    throw new Error(
      'Invalid element data: expected an object with element properties.'
    );
  }
  const {
    x,
    y,
    width,
    height,
    angle,
    z,
    layer,
    parent,
    ports,
    portStyle,
    ...userData
  } = data;
  const attributes: Record<string, unknown> = {
    type: PORTAL_ELEMENT_TYPE,
    attrs: {
      root: {
        // Disable magnet behavior on the element when ports are defined
        magnet: ports ? false : null,
      }
    }
  };

  if (x !== undefined && y !== undefined) {
    attributes.position = { x, y };
  }
  if (width !== undefined && height !== undefined) {
    attributes.size = { width, height };
  }
  if (angle !== undefined) attributes.angle = angle;
  if (z !== undefined) attributes.z = z;
  if (layer !== undefined) attributes.layer = layer;
  if (parent !== undefined) attributes.parent = parent;

  if (ports) {
    attributes.ports = convertPorts(ports, portStyle);
    attributes.portDefaults = createPortGroupsDefault();
  }
  attributes.data = { ...userData, ports, portStyle };

  return attributes as CellAttributes;
}

/**
 * Converts JointJS element attributes back to flat element data.
 * Public utility — purely mechanical (nested → flat), no defaultAttributes filtering.
 * @param attributes
 */
export function flatAttributesToElementData<Element = FlatElementData>(
  attributes: dia.Element.Attributes
): Element {
  const {
    data: userData,
    position,
    size,
    angle,
    z,
    layer,
    parent,
  } = attributes;

  const elementData: Record<string, unknown> = {};

  if (position) {
    elementData.x = position.x;
    elementData.y = position.y;
  }
  if (size) {
    elementData.width = size.width;
    elementData.height = size.height;
  }
  if (angle !== undefined) elementData.angle = angle;
  if (z !== undefined) elementData.z = z;
  if (layer !== undefined) elementData.layer = layer;
  if (parent) elementData.parent = parent;

  return {
    ...userData,
    ...elementData,
  } as Element;
}
