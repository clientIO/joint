import type { dia } from '@joint/core';
import { REACT_TYPE } from '../models/react-element';
import { isGraphElement } from '../utils/is';
export interface CellWithId {
  readonly id: dia.Cell.ID;
}

/**
 * Check if the element is a React element.
 * This function is used to check if the element is a React element.
 * @param element - The element to check.
 * @returns - True if the element is a React element, false otherwise.
 * @group utils
 * @description
 * @private
 */
export function isReactElement(element: unknown): boolean {
  if (!isGraphElement(element)) {
    return false;
  }
  return (element.type as string) === REACT_TYPE || element.type == undefined;
}
