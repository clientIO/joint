import { type dia } from '@joint/core';
import type { GraphElement } from '../../types/element-types';
import { REACT_TYPE } from '../../models/react-element';
import type {
  ElementToGraphOptions,
  GraphToElementOptions,
} from '../graph-state-selectors';
import { convertPorts, createPortDefaults } from './convert-ports';
import { resolveCellDefaults } from './resolve-cell-defaults';

// ────────────────────────────────────────────────────────────────────────────
// React → JointJS
// ────────────────────────────────────────────────────────────────────────────

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
export function defaultMapDataToElementAttributes<Element extends GraphElement>(
  options: Pick<ElementToGraphOptions<Element>, 'id' | 'data'>
): dia.Cell.JSON {
  const { id, data } = options;

  const {
    // ↔ Two-way: synced back from graph → React state
    x,
    y,
    width,
    height,
    angle,
    z,
    layer,
    parent,

    // → One-way: consumed here, not synced back
    ports,

    // Everything else is user data
    ...userData
  } = data;

  // ── Assemble cell JSON ──────────────────────────────────────────────────

  const attributes: dia.Cell.JSON = {
    id,
    type: REACT_TYPE,
  };

  // ↔ Two-way (flat → nested JointJS format)
  if (x !== undefined && y !== undefined) {
    attributes.position = { x, y };
  }
  if (width !== undefined && height !== undefined) {
    attributes.size = { width, height };
  }
  if (angle !== undefined) attributes.angle = angle;

  // ↔ Two-way (optional)
  if (z !== undefined) attributes.z = z;
  if (layer !== undefined) attributes.layer = layer;
  if (parent !== undefined) attributes.parent = parent;

  // → One-way
  if (ports !== undefined) {
    attributes.ports = convertPorts(ports);
    attributes.portDefaults = createPortDefaults();
  }

  // User data stored for round-trip (graph → React)
  attributes.data = userData;

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
export function defaultMapElementAttributesToData<Element extends GraphElement>(
  options: Pick<GraphToElementOptions<Element>, 'cell' | 'previousData'>
): Element {
  const { cell } = options;
  const {
    // User data (saved during forward mapping)
    data: userData,
    // ↔ Two-way: nested JointJS format → flat React format
    position,
    size,
    angle,
    z,
    layer,
    parent,
  } = cell.attributes;

  const defaults = resolveCellDefaults(cell);
  const elementData: Record<string, unknown> = {};

  // ↔ Two-way (nested → flat)
  if (position) {
    elementData.x = position.x;
    elementData.y = position.y;
  }
  if (size) {
    elementData.width = size.width;
    elementData.height = size.height;
  }
  if (angle !== undefined && angle !== defaults.angle) elementData.angle = angle;

  // ↔ Two-way (skip when matching model defaults)
  if (z !== undefined && z !== defaults.z) elementData.z = z;
  if (layer !== undefined && layer !== defaults.layer) elementData.layer = layer;
  if (parent) elementData.parent = parent;

  return {
    ...userData,
    ...elementData,
  } as Element;
}
