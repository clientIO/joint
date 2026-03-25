import type { dia } from '@joint/core';
import type { FlatElementData, FlatLinkData } from '../../types/data-types';
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
  [key: string]: any;
}

/**
 * Unified interface for data ↔ attribute mapping functions.
 * Reused across GraphProvider, GraphStore, and graphState.
 */
export interface GraphMappings<ElementData = FlatElementData, LinkData = FlatLinkData> {
  readonly mapDataToElementAttributes?: (
    options: ToElementAttributesOptions<ElementData>
  ) => CellAttributes;
  readonly mapDataToLinkAttributes?: (options: ToLinkAttributesOptions<LinkData>) => CellAttributes;
  readonly mapElementAttributesToData?: (
    options: ToElementDataOptions<ElementData>
  ) => ElementData;
  readonly mapLinkAttributesToData?: (options: ToLinkDataOptions<LinkData>) => LinkData;
}
