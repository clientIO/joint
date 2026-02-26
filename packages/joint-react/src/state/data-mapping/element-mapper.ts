import { type dia } from '@joint/core';
import type { GraphElement } from '../../types/element-types';
import { REACT_TYPE } from '../../models/react-element';
import type {
  ElementToGraphOptions,
  GraphToElementOptions,
} from '../graph-state-selectors';
import { convertPorts } from './convert-ports';
import { pickPreviousKeys } from './pick-previous-keys';

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
  // Support both flat format (x, y, width, height) and nested format (position, size)
  const { x, y, width, height, angle, z, ports, position, size, parent, layer, ...userData } =
    data as GraphElement & {
      position?: { x: number; y: number };
      size?: { width: number; height: number };
    };
  const { attrs: elementAttributes, markup, ...restUserData } = userData as GraphElement;

  const attributes: dia.Cell.JSON = {
    id,
    type: REACT_TYPE,
  };

  // Position: prefer nested position object, fallback to flat x, y
  const positionX = position?.x ?? x;
  const positionY = position?.y ?? y;
  if (positionX !== undefined && positionY !== undefined) {
    attributes.position = { x: positionX, y: positionY };
  }

  // Size: prefer nested size object, fallback to flat width, height
  const sizeWidth = size?.width ?? width;
  const sizeHeight = size?.height ?? height;
  if (sizeWidth !== undefined && sizeHeight !== undefined) {
    attributes.size = { width: sizeWidth, height: sizeHeight };
  }
  if (parent !== undefined) attributes.parent = parent;
  if (layer !== undefined) attributes.layer = layer;
  if (angle !== undefined) attributes.angle = angle;
  if (z !== undefined) attributes.z = z;
  if (ports !== undefined) {
    attributes.ports = convertPorts(ports);
  }
  if (elementAttributes !== undefined) attributes.attrs = elementAttributes;
  if (markup !== undefined) attributes.markup = markup;

  if (Object.keys(restUserData).length > 0) {
    attributes.data = restUserData;
  }

  return attributes;
}

/**
 * Extracts element data from a JointJS Element in flat format.
 * @param cell - The JointJS Element cell
 * @returns The extracted element data as a record
 */
function extractElementData(cell: dia.Element): Record<string, unknown> {
  const { size, position, data, angle, z, ports, parent, layer } = cell.attributes;

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
  if (ports !== undefined) elementData.ports = ports;
  if (parent !== undefined) elementData.parent = parent;
  if (layer !== undefined) elementData.layer = layer;

  return {
    ...elementData,
    ...(data as Record<string, unknown>),
  };
}

/**
 * Maps JointJS element attributes back to flat element data.
 *
 * Extracts `position` to `{x, y}`, `size` to `{width, height}`.
 * Spreads `cell.data` to top level. Shape preservation via `previousData`.
 * @param options - The JointJS cell and optional previous data for shape preservation
 * @returns The flat element data
 */
export function defaultMapElementAttributesToData<Element extends GraphElement>(
  options: Pick<GraphToElementOptions<Element>, 'cell' | 'previousData'>
): Element {
  const { cell, previousData } = options;
  const elementData = extractElementData(cell);

  if (previousData !== undefined) {
    return pickPreviousKeys(elementData, previousData);
  }

  return elementData as Element;
}
