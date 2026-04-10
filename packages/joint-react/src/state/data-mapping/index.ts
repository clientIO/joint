import type { dia } from '@joint/core';

export * from './convert-labels';
export * from './convert-labels-reverse';
export * from './convert-ports';
export * from './element-mapper';
export * from './link-attributes';
export * from './link-mapper';

/**
 * Like `dia.Cell.JSON` but with `id` optional.
 * Returned by the public flat mapping utilities where the caller provides `id` separately.
 */
export interface CellAttributes {
  id?: dia.Cell.ID;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- index signature needed for JointJS cell attribute compatibility
  [key: string]: any;
}
