import type { dia } from '@joint/core';
import type { IncrementalChange } from '../state/incremental.types';

/**
 * Optional shape that a `dia.Cell` subclass can implement to opt into
 * joint-react's portal rendering. Cells without a `portalSelector` are
 * skipped by default (unless a paper-level override is supplied).
 *
 * `ElementModel` and `LinkModel` satisfy this structurally; custom cell
 * classes can too:
 *
 * ```ts
 * import type { PortalHostCell } from '@joint/react';
 *
 * class MyShape extends dia.Element implements PortalHostCell {
 *   portalSelector = 'root';
 * }
 * ```
 */
export interface PortalHostCell {
  /** Selector of the node inside the cell view where React content mounts. */
  readonly portalSelector?: string;
}

/** Context passed to a `PortalSelector` callback. */
export interface PortalSelectorContext {
  /** The cell model. Has a `portalSelector` field when it opts into portal rendering. */
  readonly model: dia.Cell & PortalHostCell;
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
 * - A **function** receives a {@link PortalSelectorContext} and returns:
 *   - a **selector string** — look up that node,
 *   - an **`Element`** — use that DOM node directly,
 *   - **`null`** — skip rendering for this cell,
 *   - **`undefined`** (or no return) — fall back to joint-react's default selector.
 */
export type PortalSelector =
  | string
  | null
  | ((context: PortalSelectorContext) => string | Element | null | undefined);

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
