import type { dia } from '@joint/core';

/**
 * A registered feature instance with lifecycle cleanup.
 * @internal
 */
export interface Feature<T = unknown> {
  readonly id: string;
  readonly instance: T;
  readonly clean?: () => void;
  /**
   * Optional hook invoked when the `<Paper>` `cellVisibility` prop changes
   * while this feature owns the option (see `PaperStore.claimCellVisibility`).
   * Lets the owner re-apply the callback without depending on its own
   * component re-rendering.
   */
  readonly onCellVisibilityChange?: (cellVisibility: dia.Paper.Options['cellVisibility']) => void;
}
