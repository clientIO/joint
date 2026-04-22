import type { dia } from '@joint/core';
import type { IncrementalChange } from '../state/incremental.types';

/** Context passed to a `PortalSelector` callback. */
export interface PortalSelectorContext {
  /** The cell model. */
  readonly model: dia.Cell;
  /**
   * The joint-react default selector (`'__portal__'`). Return this string
   * from the callback to fall back to default portal rendering for a cell.
   */
  readonly defaultSelector: string;
  /** The paper instance. */
  readonly paper: dia.Paper;
  /** The graph instance. */
  readonly graph: dia.Graph;
}

/**
 * Resolves the JointJS selector used to find the React portal target node
 * inside a cell view.
 *
 * - A **string** is used directly as the selector for `cellView.findNode()`.
 * - **`null`** disables all portal rendering.
 * - A **function** receives a {@link PortalSelectorContext} and returns either
 *   a selector string, an `Element` node directly, or `null` to skip rendering
 *   for that cell.
 */
export type PortalSelector =
  | string
  | null
  | ((context: PortalSelectorContext) => string | Element | null);

/**
 * Options for creating a PortalPaper instance with lifecycle callbacks.
 */
export interface PortalPaperOptions extends dia.Paper.Options {
  readonly onViewMountChange?: (changes: Map<string, IncrementalChange<dia.Cell>>) => void;
  /**
   * Selector used to locate the React portal target node inside a cell view.
   *
   * By default, only cells whose markup contains the `'__portal__'` selector
   * (i.e. {@link ElementModel}) are rendered via `renderElement`.
   * Set this to a different selector (e.g. `'root'`) to render into
   * built-in or custom JointJS shapes.
   *
   * A function receives the cell view and the default selector, and returns
   * a selector string or `null` to skip rendering for that cell.
   */
  readonly portalSelector?: PortalSelector;
}
