import type { dia } from '@joint/core';

/** Name of an interaction being queried (e.g. `'elementMove'`, `'arrowheadMove'`). */
export type Interaction = keyof dia.CellView.InteractivityOptions;

/** Context passed to an `interactive` callback. */
export interface InteractiveContext {
  /** The cell being interacted with. */
  readonly model: dia.Cell;
  /** The interaction being queried. */
  readonly interaction: Interaction;
  /** The paper hosting the cell. */
  readonly paper: dia.Paper;
  /** The graph the cell belongs to. */
  readonly graph: dia.Graph;
}

/**
 * Function form of the `interactive` Paper prop. Receives a structured
 * context (instead of the native positional `(cellView, event)` form) and
 * returns either a boolean or the native `InteractivityOptions` object.
 */
export type InteractiveCallback = (
  context: InteractiveContext
) => boolean | dia.CellView.InteractivityOptions;

/** Value accepted by the `interactive` Paper prop. */
export type Interactive =
  | boolean
  | dia.CellView.InteractivityOptions
  | InteractiveCallback;

/**
 * joint-react defaults applied when the user supplies no `interactive` prop,
 * or merged under user-supplied object values. Preserves the JointJS native
 * `labelMove: false` and adds `linkMove: false` so link endpoints don't drag
 * by default.
 */
const DEFAULT_INTERACTIVE: dia.CellView.InteractivityOptions = {
  labelMove: false,
  linkMove: false,
};

/**
 * Adapt the `interactive` prop to the native form.
 *
 * - `undefined` → defaults (`labelMove`/`linkMove` disabled).
 * - boolean → pass through.
 * - object → defaults applied first, user keys win.
 * - function → wrapped so the user callback receives an `InteractiveContext`
 *   instead of the native positional `(cellView, interaction)` args.
 *   Defaults are NOT merged into the function return — function form is an
 *   explicit takeover.
 * @param value - prop value
 * @returns native `dia.Paper.Options['interactive']`
 */
export function toNativeInteractive(
  value: Interactive | undefined
): dia.Paper.Options['interactive'] {
  if (value === undefined) return { ...DEFAULT_INTERACTIVE };
  if (typeof value === 'boolean') return value;
  if (typeof value === 'object') return { ...DEFAULT_INTERACTIVE, ...value };
  return function (this: dia.Paper, cellView: dia.CellView, interaction: string) {
    return value({
      model: cellView.model,
      interaction: interaction as Interaction,
      paper: this,
      graph: this.model,
    });
  };
}
