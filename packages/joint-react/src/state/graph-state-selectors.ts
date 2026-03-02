import { type dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';
import type { LinkTheme } from '../theme/link-theme';

/**
 * Options for the `toAttributes` callback on link mappers.
 */
export interface ToLinkAttributesOptions {
  readonly theme?: LinkTheme;
}

export interface ElementToGraphOptions<ElementData = GraphElement> {
  readonly id: string;
  readonly data: ElementData;
  readonly graph: dia.Graph;
  readonly toAttributes: (data: ElementData) => dia.Cell.JSON;
}

export interface GraphToElementOptions<ElementData = GraphElement> {
  readonly id: string;
  readonly cell: dia.Element;
  readonly previousData?: ElementData;
  readonly graph: dia.Graph;
  readonly toData: () => GraphElement;
}

export interface LinkToGraphOptions<LinkData = GraphLink> {
  readonly id: string;
  readonly data: LinkData;
  readonly graph: dia.Graph;
  readonly toAttributes: (data: LinkData, options?: ToLinkAttributesOptions) => dia.Cell.JSON;
}

export interface GraphToLinkOptions<LinkData = GraphLink> {
  readonly id: string;
  readonly cell: dia.Link;
  readonly previousData?: LinkData;
  readonly graph: dia.Graph;
  readonly toData: () => GraphLink;
}

export type LinkFromGraphSelector<Link extends GraphLink> = (
  options: GraphToLinkOptions<Link>
) => Link;

export interface GraphStateSelectors<Element extends GraphElement, Link extends GraphLink> {
  readonly mapDataToElementAttributes?: (options: ElementToGraphOptions<Element>) => dia.Cell.JSON;
  readonly mapDataToLinkAttributes?: (options: LinkToGraphOptions<Link>) => dia.Cell.JSON;
  readonly mapElementAttributesToData?: (options: GraphToElementOptions<Element>) => Element;
  readonly mapLinkAttributesToData?: (options: GraphToLinkOptions<Link>) => Link;
}
