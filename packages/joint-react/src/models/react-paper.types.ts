import type { dia } from '@joint/core';
import type { CellId } from '../types/cell-id';

/**
 * Options for creating a ReactPaper instance with lifecycle callbacks.
 */
export interface ReactPaperOptions extends dia.Paper.Options {
  readonly onViewMountChange?: (
    kind: 'element' | 'link',
    cellId: CellId,
    isMounted: boolean
  ) => void;
}
