import type { dia } from '@joint/core';
import type { FlatElementData } from '../../types/element-types';
import type { FlatLinkData } from '../../types/link-types';
import type { ToElementAttributesOptions, ToElementDataOptions } from './element-mapper';
import type { ToLinkAttributesOptions, ToLinkDataOptions } from './link-mapper';

export * from './convert-labels';
export * from './convert-labels-reverse';
export * from './convert-ports';
export * from './element-mapper';
export * from './link-attributes';
export * from './link-mapper';

/**
 * Unified interface for data ↔ attribute mapping functions.
 * Reused across GraphProvider, GraphStore, and graphState.
 */
export interface GraphMappings<ElementData = FlatElementData, LinkData = FlatLinkData> {
  readonly mapDataToElementAttributes?: (
    options: ToElementAttributesOptions<ElementData>
  ) => dia.Cell.JSON;
  readonly mapDataToLinkAttributes?: (options: ToLinkAttributesOptions<LinkData>) => dia.Cell.JSON;
  readonly mapElementAttributesToData?: (
    options: ToElementDataOptions<ElementData>
  ) => ElementData;
  readonly mapLinkAttributesToData?: (options: ToLinkDataOptions<LinkData>) => LinkData;
}
