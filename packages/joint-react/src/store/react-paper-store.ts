import type { ControlledPaper } from '../models/controlled-paper';

/**
 * Options for creating a ReactPaperStore instance.
 */
export interface ReactPaperStoreOptions {
  /** The ControlledPaper instance. */
  readonly paper: ControlledPaper;
  /** Unique identifier for this paper instance. */
  readonly paperId: string;
}

/**
 * Minimal store for ReactPaper's ControlledPaper instance.
 *
 * This store follows the same interface as PaperStore (paper, paperId, destroy)
 * so it can be registered in GraphStore's papers Map and used by flushLayoutState.
 *
 * Unlike PaperStore which creates its own paper and handles many features,
 * ReactPaperStore is a thin wrapper - React owns the DOM and ControlledPaper
 * only provides JointJS interaction handling and view geometry computation.
 */
export class ReactPaperStore {
  /** The underlying ControlledPaper instance. */
  public readonly paper: ControlledPaper;
  /** Unique identifier for this paper instance. */
  public readonly paperId: string;

  constructor(options: ReactPaperStoreOptions) {
    const { paper, paperId } = options;
    this.paper = paper;
    this.paperId = paperId;
  }

  /**
   * Cleans up the store.
   * Note: We don't call paper.remove() here because React owns the DOM.
   * The ReactPaper component handles cleanup of the ControlledPaper.
   */
  public destroy = () => {
    // Nothing to clean up - React component handles ControlledPaper lifecycle
  };
}
