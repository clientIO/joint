import type { dia } from '@joint/core';

/** Name of a cell interactivity feature (e.g. `'elementMove'`, `'labelMove'`, `'linkMove'`). */
type CellInteraction = keyof dia.CellView.InteractivityOptions;

/**
 * Context handed to the function form of {@link CellInteractivity}. JointJS calls
 * the callback once per cell with that cell, then reads the specific interactivity
 * flag it needs from the value you return. In practice only `model` is reliably
 * populated — see the individual fields.
 * @group Types
 * @expand
 */
export interface CellInteractivityParams {
  /** The cell whose interactivity is being resolved. */
  readonly model: dia.Cell;
  /**
   * Always `undefined` at runtime: JointJS does not pass an interaction name to the
   * callback. It reads the relevant flag from the value you return instead.
   */
  readonly interaction: CellInteraction;
  /**
   * The cell's paper. JointJS binds the callback to the cell view's options rather
   * than to the `dia.Paper`, so this is not guaranteed to be the paper; capture the
   * `dia.Paper` from your own scope if you need it.
   */
  readonly paper: dia.Paper;
  /**
   * The graph the cell belongs to. Derived from `paper`, so it carries the same
   * caveat; capture the `dia.Graph` from your own scope if you need it.
   */
  readonly graph: dia.Graph;
}

/**
 * Function form of the `interactive` Paper prop. Receives a structured
 * context (instead of the native positional `(cellView)` form) and
 * returns either a boolean or the native `InteractivityOptions` object.
 * @group Types
 */
type CellInteractivityCallback = (
  context: CellInteractivityParams
) => boolean | dia.CellView.InteractivityOptions;

/**
 * Controls which pointer interactions (moving, linking, label dragging, …) are
 * enabled on cells. Accepts a boolean to switch everything on or off, an
 * `InteractivityOptions` object to toggle individual interactions, or a function
 * that returns either form per cell from a {@link CellInteractivityParams}
 * context. Pass it to the `interactive` prop of `<Paper>`. By default, label
 * dragging (`labelMove`) and moving links (`linkMove`) stay disabled; link
 * endpoints (`arrowheadMove`) remain draggable.
 * @group Types
 * @example
 * ```tsx
 * import { GraphProvider, Paper } from '@joint/react';
 * import type { CellInteractivity } from '@joint/react';
 *
 * // Lock cells flagged as readonly; leave the rest interactive.
 * const interactive: CellInteractivity = ({ model }) => !model.get('readonly');
 *
 * <GraphProvider>
 *   <Paper interactive={interactive} renderElement={() => <rect width={80} height={40} />} />
 * </GraphProvider>;
 * ```
 */
export type CellInteractivity =
  | boolean
  | dia.CellView.InteractivityOptions
  | CellInteractivityCallback;

/**
 * joint-react defaults applied when the user supplies no `interactive` prop,
 * passes `interactive={true}`, or as the base merged under user-supplied object
 * values. Preserves the JointJS native `labelMove: false` and adds
 * `linkMove: false` so moving the whole link is disabled by default (link
 * endpoints, governed by `arrowheadMove`, stay draggable).
 */
const DEFAULT_INTERACTIVE: dia.CellView.InteractivityOptions = {
  labelMove: false,
  linkMove: false,
};

type StaticInteractivity = boolean | dia.CellView.InteractivityOptions | undefined;

/**
 * Resolve a static `interactive` value to the native shape, applying
 * `DEFAULT_INTERACTIVE` as the baseline so every shape that means
 * "interactivity on" produces the same defaults.
 */
function normalizeStaticInteractivity(
  value: StaticInteractivity
): false | dia.CellView.InteractivityOptions {
  if (value === false) return false;
  if (value === true || value == null) return { ...DEFAULT_INTERACTIVE };
  if (typeof value === 'object') return { ...DEFAULT_INTERACTIVE, ...value };
  return { ...DEFAULT_INTERACTIVE };
}

/**
 * Adapt the `interactive` prop to the native form.
 *
 * - `undefined` → defaults (`labelMove`/`linkMove` disabled, rest implicit true).
 * - `true` → same defaults.
 * - `false` → pass through (every interaction disabled).
 * - object → defaults applied first, user keys win.
 * - function → wrapped so the user callback receives a {@link CellInteractivityParams}
 *   instead of the native positional `(cellView)` argument. The
 *   callback's return value is normalized identically to the static shapes,
 *   so `() => true` and `() => ({})` both resolve to `DEFAULT_INTERACTIVE`.
 * @param value - prop value
 * @returns native `dia.Paper.Options['interactive']`
 */
export function toNativeCellInteractivity(
  value: CellInteractivity | undefined
): dia.Paper.Options['interactive'] {
  if (typeof value !== 'function') return normalizeStaticInteractivity(value);
  return function (this: dia.Paper, cellView: dia.CellView, interaction: string) {
    const result = value({
      model: cellView.model,
      interaction: interaction as CellInteraction,
      paper: this,
      graph: this.model,
    });
    return normalizeStaticInteractivity(result as StaticInteractivity);
  };
}
