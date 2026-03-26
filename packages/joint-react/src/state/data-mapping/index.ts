import type { dia } from '@joint/core';
import type { CellData } from '../../types/cell-data';
import type { ToElementAttributesOptions, ToElementDataOptions } from './element-mapper';
import type { ToLinkAttributesOptions, ToLinkDataOptions } from './link-mapper';

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

/**
 * Unified interface for data ↔ attribute mapping functions.
 * Reused across GraphProvider, GraphStore, and graphView.
 */
export interface GraphMappings<ElementData extends object = CellData, LinkData extends object = CellData> {
  readonly mapDataToElementAttributes?: (
    options: ToElementAttributesOptions<ElementData>
  ) => CellAttributes;
  readonly mapDataToLinkAttributes?: (options: ToLinkAttributesOptions<LinkData>) => CellAttributes;
  readonly mapElementAttributesToData?: (
    options: ToElementDataOptions<ElementData>
  ) => ElementData;
  readonly mapLinkAttributesToData?: (options: ToLinkDataOptions<LinkData>) => LinkData;
}
