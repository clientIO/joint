import type { dia } from '@joint/core';
import type { MapAttributesToElement, MapElementToAttributes } from './element-mapper';
import type { MapAttributesToLink, MapLinkToAttributes } from './link-mapper';

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

export interface MapLinks<LinkData extends object = Record<string, unknown>> {
  mapLinkToAttributes?: MapLinkToAttributes<LinkData>;
  mapAttributesToLink?: MapAttributesToLink<LinkData>;
}

export interface MapElements<ElementData extends object = Record<string, unknown>> {
  mapElementToAttributes?: MapElementToAttributes<ElementData>;
  mapAttributesToElement?: MapAttributesToElement<ElementData>;
}
/**
 * Unified interface for data ↔ attribute mapping functions.
 * Reused across GraphProvider, GraphStore, and graphView.
 */
export type GraphMappings<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
> = MapElements<ElementData> & MapLinks<LinkData>;
