import type { dia } from '@joint/core';

/**
 * Event triggered when element sizes are measured or re-measured.
 * Fires on initial measurement and on subsequent size changes.
 * Use with `usePaperEvents` or `paper.on()` to listen for this event.
 */
export const PAPER_ELEMENTS_MEASURED = 'elements:measured' as const;

export interface ElementsMeasuredEvent {
  /** True when this is the first measurement (all elements sized for the first time). */
  readonly isInitial: boolean;
  /** The paper instance that triggered the event. */
  readonly paper: dia.Paper;
  /** The graph model associated with the paper. */
  readonly graph: dia.Graph;
}

export interface PaperEventMap extends dia.Paper.EventMap {
  // react paper events
  [PAPER_ELEMENTS_MEASURED]: (event: ElementsMeasuredEvent) => void;
}

