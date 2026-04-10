import type { dia } from '@joint/core';

export interface ElementsMeasuredEvent {
  /** True when this is the first measurement (all elements sized for the first time). */
  readonly isInitial: boolean;
  /** The paper instance that triggered the event. */
  readonly paper: dia.Paper;
  /** The graph model associated with the paper. */
  readonly graph: dia.Graph;
}

export type PaperEventMap = dia.Paper.EventMap;
