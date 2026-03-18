import type { dia } from '@joint/core';
import type { FlatElementData } from '../../types/element-types';
import type { FlatLinkData } from '../../types/link-types';
import type { ElementToGraphOptions, GraphToElementOptions } from './element-mapper';
import type { LinkToGraphOptions, GraphToLinkOptions } from './link-mapper';

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
    options: ElementToGraphOptions<ElementData>
  ) => dia.Cell.JSON;
  readonly mapDataToLinkAttributes?: (options: LinkToGraphOptions<LinkData>) => dia.Cell.JSON;
  readonly mapElementAttributesToData?: (
    options: GraphToElementOptions<ElementData>
  ) => ElementData;
  readonly mapLinkAttributesToData?: (options: GraphToLinkOptions<LinkData>) => LinkData;
}
