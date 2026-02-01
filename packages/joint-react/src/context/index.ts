export * from './port-group-context';
import { createContext } from 'react';
import type { dia } from '@joint/core';
import type { GraphStore, PaperStore } from '../store';

export type StoreContext = GraphStore;
export const GraphStoreContext = createContext<GraphStore | null>(null);
export const PaperStoreContext = createContext<PaperStore | null>(null);
export const CellIdContext = createContext<dia.Cell.ID | undefined>(undefined);
export const CellIndexContext = createContext<number | undefined>(undefined);

/**
 * Context for ReactPaper's paper ID.
 * Used as fallback when PaperStoreContext is not available (e.g., in ReactPaper).
 */
export const ReactPaperIdContext = createContext<string | null>(null);

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
