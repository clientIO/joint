export * from './port-group-context';
import { createContext } from 'react';
import type { GraphStore } from '../data/create-graph-store';
import type { dia } from '@joint/core';
import type { GraphElement } from '../types/element-types';
import type { PortsStore } from '../data/create-ports-store';
import type { RenderElement } from '../components/paper/paper.types';
export interface PaperContext {
  readonly id: string;
  readonly paper: dia.Paper;
  readonly portsStore: PortsStore;
  readonly elementViews: Record<dia.Cell.ID, dia.ElementView>;
  renderElement?: RenderElement<GraphElement>;
  readonly isReactId: boolean;
}

export type StoreContext<Graph extends dia.Graph = dia.Graph> = GraphStore<Graph>;
export const GraphStoreContext = createContext<GraphStore | null>(null);
export const GraphAreElementsMeasuredContext = createContext<boolean>(false);
export const PaperContext = createContext<PaperContext | null>(null);
export const CellIdContext = createContext<dia.Cell.ID | undefined>(undefined);

export interface OverWriteResult {
  readonly element: HTMLElement | SVGElement;
  readonly contextUpdate: Record<string, unknown>;
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
  overWrite?: (ctx: PaperContext) => OverWriteResult;
}

export const PaperConfigContext = createContext<PaperConfigContext | null>(null);
