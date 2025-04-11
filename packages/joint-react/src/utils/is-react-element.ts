/* eslint-disable jsdoc/require-jsdoc */
import type { dia } from '@joint/core';
import { ReactElement } from '../models/react-element';

export function isReactElement(value: unknown): value is dia.Cell {
  return value instanceof ReactElement;
}
