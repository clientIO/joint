import type { dia } from '@joint/core';

/**
 * Name of an interaction being queried (e.g. `'elementMove'`, `'arrowheadMove'`).
 * @group Types
 */
export type CellInteraction = keyof dia.CellView.InteractivityOptions;

/**
 * Context passed to an `interactive` callback.
 * @group Types
 */
export interface CellInteractivityParams {
  /** The cell being interacted with. */
  readonly model: dia.Cell;
  /** The interaction being queried. */
  readonly interaction: CellInteraction;
  /** The paper hosting the cell. */
  readonly paper: dia.Paper;
  /** The graph the cell belongs to. */
  readonly graph: dia.Graph;
}

/**
 * Function form of the `interactive` Paper prop. Receives a structured
 * context (instead of the native positional `(cellView, event)` form) and
 * returns either a boolean or the native `InteractivityOptions` object.
 * @group Types
 */
export type CellInteractivityCallback = (
  context: CellInteractivityParams
) => boolean | dia.CellView.InteractivityOptions;

/**
 * Value accepted by the `interactive` Paper prop.
 * @group Types
 */
export type CellInteractivity =
  | boolean
  | dia.CellView.InteractivityOptions
  | CellInteractivityCallback;

/**
 * joint-react defaults applied when the user supplies no `interactive` prop,
 * passes `interactive={true}`, or as the base merged under user-supplied object
 * values. Preserves the JointJS native `labelMove: false` and adds
 * `linkMove: false` so link endpoints don't drag by default.
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
 * - function → wrapped so the user callback receives a `CellInteractivityParams`
 *   instead of the native positional `(cellView, interaction)` args. The
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
