import type { dia, connectionStrategies } from '@joint/core';
import { connectionStrategies as strategies } from '@joint/core';

/** Structured context passed to a connection-strategy callback. */
export interface ConnectionStrategyContext {
  /** The end JSON to return — starts as the dropped-end definition (already pinned if `pin` was set). */
  readonly end: dia.Link.EndJSON;
  /** The cell model the link end was dropped on. */
  readonly model: dia.Cell;
  /** The magnet element the end was dropped on. */
  readonly magnet: Element;
  /** Paper-space point where the end was dropped. */
  readonly dropPoint: dia.Point;
  /** Which end is being dropped. */
  readonly endType: dia.LinkEnd;
  /** The link being modified. */
  readonly link: dia.Link;
  /** The paper instance. */
  readonly paper: dia.Paper;
  /** The graph instance. */
  readonly graph: dia.Graph;
}

/** Built-in pin mode — how the dropped end is stored. */
export type ConnectionStrategyPin = 'none' | 'absolute' | 'relative';

export interface ConnectionStrategyOptions {
  /**
   * How to pin the dropped end.
   * - `'none'` — no pinning; delegates to `connectionStrategies.useDefaults` (default).
   * - `'absolute'` — pins with `pinAbsolute` (anchor in paper coords).
   * - `'relative'` — pins with `pinRelative` (anchor as % of target).
   * @default 'none'
   */
  readonly pin?: ConnectionStrategyPin;
  /** Runs after `pin`. Receives `end` already pinned (or original when `pin` is `'none'`). */
  readonly customize?: (context: ConnectionStrategyContext) => dia.Link.EndJSON;
}

const PIN_STRATEGIES: Record<ConnectionStrategyPin, connectionStrategies.ConnectionStrategy> = {
  none: strategies.useDefaults,
  absolute: strategies.pinAbsolute,
  relative: strategies.pinRelative,
};

/**
 * Creates a JointJS-native `connectionStrategy` function with a structured API.
 *
 * The returned callback runs the selected `pin` strategy first, then passes the
 * pinned `EndJSON` into the optional `customize` callback as a structured context.
 * @param options - Pin preset and/or a custom post-processor.
 * @returns A JointJS-compatible `connectionStrategy` callback.
 * @example
 * ```ts
 * paper.options.connectionStrategy = connectionStrategy({ pin: 'relative' });
 *
 * paper.options.connectionStrategy = connectionStrategy({
 *   customize: ({ end, dropPoint }) => ({ ...end, x: dropPoint.x, y: dropPoint.y }),
 * });
 * ```
 */
export function connectionStrategy(
  options: ConnectionStrategyOptions = {},
): connectionStrategies.ConnectionStrategy {
  const { pin = 'none', customize } = options;
  const pinStrategy = PIN_STRATEGIES[pin];
  if (!pinStrategy) {
    throw new Error(
      `connectionStrategy: unknown pin '${pin}'. Expected 'none', 'absolute', or 'relative'.`,
    );
  }

  return function(endDefinition, endView, magnet, coords, link, endType) {
    const paper = endView.paper!;
    // Base strategies may return undefined (e.g. useDefaults) — fall back to the incoming endDefinition.
    const defaultEnd = pinStrategy.call(paper, endDefinition, endView, magnet, coords, link, endType) ?? endDefinition;
    if (!customize) return defaultEnd;
    return customize({
      end: defaultEnd,
      model: endView.model,
      magnet,
      dropPoint: coords,
      endType,
      link,
      paper,
      graph: paper.model,
    });
  };
}
