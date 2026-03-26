import { type dia } from '@joint/core';
import type { FlatElementData } from '../../types/data-types';
import type { CellData } from '../../types/cell-data';

import { PORTAL_ELEMENT_TYPE } from '../../models/portal-element';
import { convertPorts, createPortGroupsDefault } from './convert-ports';
import { isRecord } from '../../utils/is';
import type { CellAttributes } from './index';

export interface ToElementAttributesOptions<ElementData extends object = CellData> {
  readonly id: string;
  readonly data: ElementData;
  readonly graph: dia.Graph;
  readonly toAttributes?: (data: ElementData) => CellAttributes;
}

export interface ToElementDataOptions<ElementData extends object = CellData> {
  readonly id: string;
  readonly attributes: dia.Element.Attributes;
  readonly defaultAttributes: dia.Element.Attributes;
  readonly element: dia.Element;
  readonly previousData?: ElementData;
  readonly graph: dia.Graph;
  readonly toData?: (attributes: dia.Element.Attributes) => ElementData;
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
/**
 * Maps element input data to JointJS cell attributes.
 *
 * Reads user data from `input.data`, layout from named fields (x, y, width, height, angle),
 * and structural props (z, layer, parent, ports) from top-level fields.
 * @param options - The element id and data to convert
 * @returns The JointJS cell JSON attributes
 */
export function flatMapDataToElementAttributes<Element extends object = CellData>(
  options: Pick<ToElementAttributesOptions<Element>, 'id' | 'data'>
): CellAttributes {
  const { id, data } = options;
  if (!isElementData(data)) {
    throw new Error('Invalid element data: expected an object.');
  }

  const { data: userData, x, y, width, height, angle, z, layer, parent, ports, portStyle } = data;

  const attributes: CellAttributes = { id, type: PORTAL_ELEMENT_TYPE };

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

  // Store user data + ports/portStyle for round-trip
  attributes.data = { ...userData, ports, portStyle };

  return attributes;
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
/**
 * Maps JointJS element attributes back to element data.
 *
 * Returns an `FlatElementData`-compatible shape: user data in the `data` field,
 * structural props (z, layer, parent, ports, portStyle) at top level.
 * Layout properties (x, y, width, height, angle) are NOT included — they go to elementsLayout.
 *
 * Also supports legacy flat output when Element generic is FlatElementData.
 * @param options - The JointJS cell and optional previous data for shape preservation
 * @returns The element data
 */
export function flatMapElementAttributesToData<Element extends object = CellData>(
  options: Pick<ToElementDataOptions<Element>, 'attributes' | 'defaultAttributes'>
): Element {
  const { attributes, defaultAttributes } = options;
  const { data: cellData, position, size, angle, z, layer, parent } = attributes;

  // Extract user data and ports from cell.data (where forward mapper stored them)
  const { ports, portStyle, ...userData } = (cellData ?? {}) as Record<string, unknown>;

  // Build FlatElementData shape: data field + structural props
  const result: Record<string, unknown> = {
    data: userData,
  };

  // Structural props (on FlatElementData, not in data)
  if (ports !== undefined) result.ports = ports;
  if (portStyle !== undefined) result.portStyle = portStyle;
  if (z !== undefined && z !== defaultAttributes.z) result.z = z;
  if (layer !== undefined && layer !== defaultAttributes.layer) result.layer = layer;
  if (parent) result.parent = parent;

  // Layout props — included for backwards compat with legacy consumers
  // Layout props included for backwards compat — graphView stores them in elementsLayout container.
  if (position) {
    result.x = position.x;
    result.y = position.y;
  }
  if (size) {
    result.width = size.width;
    result.height = size.height;
  }
  if (angle !== undefined && angle !== defaultAttributes.angle) result.angle = angle;

  return result as Element;
}

// ────────────────────────────────────────────────────────────────────────────
// Public composable utilities
// ────────────────────────────────────────────────────────────────────────────

/**
 * Converts FlatElementData data to JointJS cell attributes.
 * Public utility — caller provides the `id` separately.
 * @param data - The element input data with explicit `data` field.
 * @returns The JointJS cell attributes.
 */
export function flatElementDataToAttributes<D extends object = CellData>(
  data: FlatElementData<D>
): CellAttributes {
  return flatMapDataToElementAttributes({ id: '', data });
}

/**
 * Converts JointJS element attributes back to FlatElementData shape.
 * Public utility — purely mechanical, no defaultAttributes filtering.
 * @param attributes - The JointJS element attributes.
 * @returns The element item with user data in `data` field.
 */
export function flatAttributesToElementData<D extends object = CellData>(
  attributes: dia.Element.Attributes
): FlatElementData<D> {
  const { data: cellData, z, layer, parent } = attributes;
  const { ports, portStyle, ...userData } = (cellData ?? {}) as Record<string, unknown>;

  const result: FlatElementData<D> = {
    data: userData as D,
    ...(ports !== undefined && { ports: ports as FlatElementData<D>['ports'] }),
    ...(portStyle !== undefined && { portStyle: portStyle as FlatElementData<D>['portStyle'] }),
    ...(z !== undefined && { z: z as number }),
    ...(layer !== undefined && { layer: layer as string }),
    ...(parent ? { parent: parent as string } : {}),
  };

  return result;
}
