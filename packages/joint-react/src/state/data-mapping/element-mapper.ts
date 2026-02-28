import { type dia } from '@joint/core';
import type { GraphElement } from '../../types/element-types';
import { REACT_TYPE } from '../../models/react-element';
import type {
  ElementToGraphOptions,
  GraphToElementOptions,
} from '../graph-state-selectors';
import { convertPorts, createPortDefaults } from './convert-ports';

/**
 * Maps flat element data to JointJS cell attributes.
 *
 * Extracts flat `{x, y, width, height}` to nested `{position, size}`.
 * Converts simplified `GraphElementPort[]` to full JointJS port format.
 * Remaining user props go to `cell.data`. Sets `type: REACT_TYPE`.
 * @param options - The element id and data to convert
 * @returns The JointJS cell JSON attributes
 */
export function defaultMapDataToElementAttributes<Element extends GraphElement>(
  options: Pick<ElementToGraphOptions<Element>, 'id' | 'data'>
): dia.Cell.JSON {
  const { id, data } = options;
  // Extract built-in JointJS element properties
  const {
    // Built-in properties
    // 2-way element properties
    x,
    y,
    width,
    height,
    angle,
    z,
    parent,
    layer,
    // 1-way element properties
    ports,

    // User data
    ...userData
  } = data;

  const attributes: dia.Cell.JSON = {
    id,
    type: REACT_TYPE,
  };

  // Flat x, y → nested JointJS position object
  if (x !== undefined && y !== undefined) {
    attributes.position = { x, y };
  }

  // Flat width, height → nested JointJS size object
  if (width !== undefined && height !== undefined) {
    attributes.size = { width, height };
  }

  if (angle !== undefined) attributes.angle = angle;

  if (z !== undefined) attributes.z = z;
  if (layer !== undefined) attributes.layer = layer;
  if (parent !== undefined) attributes.parent = parent;

  if (ports !== undefined) {
    attributes.ports = convertPorts(ports);
    attributes.portDefaults = createPortDefaults();
  }

  attributes.data = userData;

  return attributes;
}

/**
 * Maps JointJS element attributes back to flat element data.
 *
 * Extracts `position` to `{x, y}`, `size` to `{width, height}`.
 * Spreads `cell.data` to top level.
 * @param options - The JointJS cell and optional `previousData`
 * @returns The flat element data
 */
export function defaultMapElementAttributesToData<Element extends GraphElement>(
  options: Pick<GraphToElementOptions<Element>, 'cell' | 'previousData'>
): Element {
  const { cell } = options;

  const {
    data: userData,
    size, position, angle,
    z, parent, layer
  } = cell.attributes;

  const elementData: Record<string, unknown> = {};

  if (position) {
    elementData.x = position.x;
    elementData.y = position.y;
  }

  if (size) {
    elementData.width = size.width;
    elementData.height = size.height;
  }

  // Element attributes
  if (angle !== undefined) elementData.angle = angle;

  // Cell attributes
  if (z !== undefined) elementData.z = z;
  if (layer !== undefined) elementData.layer = layer;
  if (parent !== undefined) elementData.parent = parent;

  // @todo: what if user dat contains keys that conflict top-level keys
  // like x/y?
  return {
    ...userData,
    ...elementData,
  } as Element;

}
