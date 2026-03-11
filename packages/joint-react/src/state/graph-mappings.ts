import { type dia } from '@joint/core';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import type { LinkTheme } from '../theme/link-theme';

/**
 * Options for the `toAttributes` callback on link mappers.
 */
export interface ToLinkAttributesOptions {
  readonly theme?: LinkTheme;
}

export interface ElementToGraphOptions<ElementData = FlatElementData> {
  readonly id: string;
  readonly data: ElementData;
  readonly graph: dia.Graph;
  readonly toAttributes: (data: ElementData) => dia.Cell.JSON;
}

export interface GraphToElementOptions<ElementData = FlatElementData> {
  readonly id: string;
  readonly attributes: dia.Element.Attributes;
  readonly defaultAttributes: dia.Element.Attributes;
  readonly element: dia.Element;
  readonly previousData?: ElementData;
  readonly graph: dia.Graph;
  readonly toData: (attributes: dia.Element.Attributes) => ElementData;
}

export interface LinkToGraphOptions<LinkData = FlatLinkData> {
  readonly id: string;
  readonly data: LinkData;
  readonly graph: dia.Graph;
  readonly toAttributes: (data: LinkData, options?: ToLinkAttributesOptions) => dia.Cell.JSON;
}

export interface GraphToLinkOptions<LinkData = FlatLinkData> {
  readonly id: string;
  readonly attributes: dia.Link.Attributes;
  readonly defaultAttributes: dia.Link.Attributes;
  readonly link: dia.Link;
  readonly previousData?: LinkData;
  readonly graph: dia.Graph;
  readonly toData: (attributes: dia.Link.Attributes) => LinkData;
}

export type LinkFromGraphSelector<LinkData = FlatLinkData> = (
  options: GraphToLinkOptions<LinkData>
) => LinkData;

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
