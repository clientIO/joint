import type { dia, connectionStrategies } from '@joint/core';
import { connectionStrategies as strategies } from '@joint/core';

/**
 * Context handed to a {@link ConnectionStrategy} `customize` callback after a
 * link end is dropped. Describes where the end landed (cell, magnet, drop point)
 * so the callback can return the final end definition.
 * @group Types
 * @expand
 */
export interface ConnectionStrategyParams {
  /** The end definition to return, pre-filled by the selected pin mode (or the dropped end when pinning is off). */
  readonly end: dia.Link.EndJSON;
  /** The cell the end was dropped on. */
  readonly model: dia.Cell;
  /** The magnet element the end was dropped on. */
  readonly magnet: Element;
  /** Paper-space point where the end was dropped. */
  readonly dropPoint: dia.Point;
  /** Which end was dropped: `'source'` or `'target'`. */
  readonly endType: dia.LinkEnd;
  /** The link being reconnected. */
  readonly link: dia.Link;
  /** The paper the link is drawn on. */
  readonly paper: dia.Paper;
  /** The graph the link belongs to. */
  readonly graph: dia.Graph;
}

/**
 * How a dropped link end is anchored to its target:
 * - `'none'` — keep the JointJS defaults (attach to the cell/port, no fixed anchor).
 * - `'absolute'` — pin the end at a fixed pixel offset within the target.
 * - `'relative'` — pin the end at an offset given as a percentage of the target's size, so it tracks resizing.
 * @group Types
 */
export type ConnectionStrategyPin = 'none' | 'absolute' | 'relative';

/**
 * Options for the `connectionStrategy` prop of `<Paper>`: pick how a dropped link
 * end is pinned and, optionally, post-process the resulting end definition.
 * @group Types
 * @expand
 * @example
 * ```tsx
 * import { GraphProvider, Paper } from '@joint/react';
 *
 * // Pin dropped ends at a relative (%) offset of their target.
 * <GraphProvider>
 *   <Paper connectionStrategy={{ pin: 'relative' }} renderElement={() => <rect width={80} height={40} />} />
 * </GraphProvider>;
 * ```
 */
export interface ConnectionStrategyOptions {
  /** How to anchor the dropped end, see {@link ConnectionStrategyPin}. @default 'none' */
  readonly pin?: ConnectionStrategyPin;
  /** Runs after pinning; receives the already-pinned end (or the original when `pin` is `'none'`) and returns the final end definition. */
  readonly customize?: ConnectionStrategy;
}

/**
 * Computes the final end definition stored on a link after one of its ends is
 * dropped. Pass it (or a {@link ConnectionStrategyOptions} object) to the
 * `connectionStrategy` prop of `<Paper>`; the callback receives a structured
 * {@link ConnectionStrategyParams} context and returns the end JSON to save.
 * @group Types
 * @example
 * ```tsx
 * import { GraphProvider, Paper } from '@joint/react';
 * import type { ConnectionStrategy } from '@joint/react';
 *
 * // Snap the dropped end exactly to the pointer position.
 * const strategy: ConnectionStrategy = ({ end, dropPoint }) => ({ ...end, x: dropPoint.x, y: dropPoint.y });
 *
 * <GraphProvider>
 *   <Paper connectionStrategy={strategy} renderElement={() => <rect width={80} height={40} />} />
 * </GraphProvider>;
 * ```
 */
export type ConnectionStrategy = (context: ConnectionStrategyParams) => dia.Link.EndJSON;

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
