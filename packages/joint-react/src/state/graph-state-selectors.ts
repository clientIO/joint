import { type dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';

export interface ElementToGraphOptions<Element extends GraphElement> {
  readonly id: string;
  readonly data: Element;
  readonly graph: dia.Graph;
  readonly toAttributes: (data?: GraphElement) => dia.Cell.JSON;
}

export interface GraphToElementOptions<Element extends GraphElement> {
  readonly id: string;
  readonly cell: dia.Element;
  readonly previousData?: Element;
  readonly graph: dia.Graph;
  readonly toData: () => GraphElement;
}

export interface LinkToGraphOptions<Link extends GraphLink> {
  readonly id: string;
  readonly data: Link;
  readonly graph: dia.Graph;
  readonly toAttributes: (data?: GraphLink) => dia.Cell.JSON;
}

export interface GraphToLinkOptions<Link extends GraphLink> {
  readonly id: string;
  readonly cell: dia.Link;
  readonly previousData?: Link;
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

