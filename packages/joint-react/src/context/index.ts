export * from './port-group-context';
import { createContext } from 'react';
import type { dia } from '@joint/core';
import type { GraphStore, PaperStore } from '../store';
import type { GraphElement } from '../types/element-types';
import type { GraphLink } from '../types/link-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, sonarjs/redundant-type-aliases
type AnyGenericForContext = any;
export type StoreContext<
  Graph extends dia.Graph = dia.Graph,
  Element extends dia.Element | GraphElement = GraphElement,
  Link extends dia.Link | GraphLink = GraphLink,
> = GraphStore<Graph, Element, Link>;
export const GraphStoreContext = createContext<GraphStore<
  AnyGenericForContext,
  AnyGenericForContext,
  AnyGenericForContext
> | null>(null);
export const GraphAreElementsMeasuredContext = createContext<boolean>(false);
export const PaperStoreContext = createContext<PaperStore | null>(null);
export const CellIdContext = createContext<dia.Cell.ID | undefined>(undefined);
export const CellIndexContext = createContext<number | undefined>(undefined);

export interface OverWriteResult {
  readonly element: HTMLElement | SVGElement;
  readonly contextUpdate: unknown;
  readonly shouldIgnoreWidthAndHeightUpdates: boolean;
  readonly cleanup: () => void;
}
export interface PaperConfigContext {
  /**
   * On load custom element.
   * If provided, it must return valid HTML or SVG element and it will be replaced with the default paper element.
   * So it overwrite default paper rendering.
   * It is used internally for example to render `PaperScroller` from [joint plus](https://www.jointjs.com/jointjs-plus) package.
   * @param ctx - The paper context
   * @returns
   */
  overWrite?: (ctx: PaperStore) => OverWriteResult;
}

export const PaperConfigContext = createContext<PaperConfigContext | null>(null);
