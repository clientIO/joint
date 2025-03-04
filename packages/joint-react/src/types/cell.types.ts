import type { dia } from '@joint/core';
import { REACT_TYPE } from '../models/react-element';
import { isGraphElement } from '../utils/is';
export interface CellWithId {
  readonly id: dia.Cell.ID;
}

export function isReactElement(element: unknown): boolean {
  if (!isGraphElement(element)) {
    return false;
  }
  return element.type === REACT_TYPE || element.type == undefined;
}
