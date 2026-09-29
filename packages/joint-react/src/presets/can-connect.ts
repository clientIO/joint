import type { dia } from '@joint/core';

/**
 * One end (source or target) of a link: the cell it attaches to and the exact
 * port or magnet within that cell. Shared by {@link ValidateConnectionParams}
 * and emitted on `link:connect` / `link:disconnect` events, so validation and
 * event payloads describe a connection the same way.
 * @group Types
 * @expand
 */
export interface ConnectionEnd {
  /** ID of the cell this end attaches to. */
  readonly id: dia.Cell.ID;
  /** The cell model (element or link) this end attaches to. */
  readonly model: dia.Cell;
  /** ID of the port the end attaches to, or `null` when it attaches to the cell body. */
  readonly port: string | null;
  /** The SVG magnet node the end attaches to, or `null` when attaching to the cell's root. */
  readonly magnet: Element | null;
  /** Value of the magnet's `joint-selector` attribute, or `null` when it has none. */
  readonly selector: string | null;
}

/**
 * Context handed to a {@link ValidateConnection} callback (and to the `validate`
 * option of {@link CanConnectOptions}) while the user drags a link end. Describes
 * both ends of the pending connection along with the paper and graph it lives in.
 * @group Types
 * @expand
 */
export interface ValidateConnectionParams {
  /** The source end of the pending connection. */
  readonly source: ConnectionEnd;
  /** The target end of the pending connection. */
  readonly target: ConnectionEnd;
  /** Which end the user is dragging: `'source'` or `'target'`. */
  readonly endType: dia.LinkEnd;
  /** The paper the link is being drawn on. */
  readonly paper: dia.Paper;
  /** The graph the link belongs to. */
  readonly graph: dia.Graph;
}

/**
 * Decides whether a link may connect its source end to its target end. Return
 * `true` to allow the connection, `false` to reject it. Pass it (or a
 * {@link CanConnectOptions} object) to the `validateConnection` prop of `<Paper>`;
 * the callback receives a structured {@link ValidateConnectionParams} context.
 * @group Types
 * @example
 * ```tsx
 * import { GraphProvider, Paper } from '@joint/react';
 * import type { ValidateConnection } from '@joint/react';
 *
 * // Only accept links that end on a port named "in".
 * const validate: ValidateConnection = ({ target }) => target.port === 'in';
 *
 * <GraphProvider>
 *   <Paper validateConnection={validate} renderElement={() => <rect width={80} height={40} />} />
 * </GraphProvider>;
 * ```
 */
export type ValidateConnection = (context: ValidateConnectionParams) => boolean;

/**
 * Builds a {@link ConnectionEnd} from a cell view and its magnet element.
 * @param cellView
 * @param magnet
 */
export function toConnectionEnd(cellView: dia.CellView, magnet: Element | undefined): ConnectionEnd {
  return {
    id: cellView.model.id,
    model: cellView.model,
    port: magnet ? cellView.findAttribute('port', magnet) : null,
    magnet: magnet ?? null,
    selector: magnet?.getAttribute('joint-selector') ?? null,
  };
}

/**
 * Checks whether connecting to the root of a cell view (no magnet) is blocked.
 * @param cellView - The cell view being connected to.
 * @param magnet - The magnet element, or `undefined` for the root.
 * @param mode - Root connection policy: `true` allows, `false` blocks, `'auto'` blocks only if the element has ports.
 */
function isRootBlocked(
  cellView: dia.CellView,
  magnet: SVGElement | undefined,
  mode: boolean | 'auto',
): boolean {
  if (magnet) return false;
  if (mode === true) return false;
  if (mode === false) return true;
  return cellView.model.isElement() && (cellView.model as dia.Element).hasPorts();
}

/**
 * Resolves the port ID of a link end attached to a magnet, or `null` if not on a port.
 * @param cellView - The cell view of the end.
 * @param magnet - The magnet element, or `undefined` for the root.
 */
function getEndPort(cellView: dia.CellView, magnet: SVGElement | undefined): string | null {
  return magnet ? cellView.findAttribute('port', magnet) : null;
}

/**
 * Resolves the magnet selector of a link end, or `null` if the magnet is a port node itself.
 * @param magnet - The magnet element, or `undefined` for the root.
 */
function getEndMagnetSelector(magnet: SVGElement | undefined): string | null {
  if (!magnet || magnet.hasAttribute('port')) return null;
  return magnet.getAttribute('joint-selector') ?? null;
}

/**
 * Checks whether an existing link end matches the end being validated.
 * Port identity wins when either side is a port; otherwise compares magnet selectors.
 * @param existing - The existing link's end descriptor.
 * @param port - The port ID of the new end, or `null`.
 * @param magnet - The magnet selector of the new end, or `null`.
 */
function endMatches(
  existing: dia.Link.EndJSON,
  port: string | null,
  magnet: string | null,
): boolean {
  const existingPort = existing.port ?? null;
  if (port !== null || existingPort !== null) return existingPort === port;
  return (existing.magnet ?? existing.selector ?? null) === magnet;
}

/**
 * Returns `true` if a link already exists between the two ends (ignoring the
 * link currently being validated). Matches on element id + port/magnet at both
 * ends.
 *
 * When `singlePerPair` is `false`, only a same-direction link counts (source→
 * target). When `true`, the reverse-direction link (target→source) counts too,
 * so at most one link may exist between the pair regardless of orientation.
 * @param sourceView
 * @param sourceNode
 * @param targetView
 * @param targetNode
 * @param linkView
 * @param singlePerPair - also match the reverse-direction link
 */
function hasDuplicateLink(
  sourceView: dia.CellView, sourceNode: SVGElement | undefined,
  targetView: dia.CellView, targetNode: SVGElement | undefined,
  linkView: dia.LinkView,
  singlePerPair: boolean,
): boolean {
  const sourceId = sourceView.model.id;
  const targetId = targetView.model.id;
  const sourcePort = getEndPort(sourceView, sourceNode);
  const targetPort = getEndPort(targetView, targetNode);
  const sourceMagnet = getEndMagnetSelector(sourceNode);
  const targetMagnet = getEndMagnetSelector(targetNode);
  // `getConnectedLinks` returns links where our source node is either endpoint,
  // so a reverse-direction link (target→source) is already in this set.
  const links = sourceView.paper!.model.getConnectedLinks(sourceView.model);
  for (const link of links) {
    if (link === linkView.model) continue;
    const ls = link.source();
    const lt = link.target();
    const forward =
      ls.id === sourceId && lt.id === targetId &&
      endMatches(ls, sourcePort, sourceMagnet) &&
      endMatches(lt, targetPort, targetMagnet);
    if (forward) return true;
    if (singlePerPair) {
      const reverse =
        ls.id === targetId && lt.id === sourceId &&
        endMatches(ls, targetPort, targetMagnet) &&
        endMatches(lt, sourcePort, sourceMagnet);
      if (reverse) return true;
    }
  }
  return false;
}

/**
 * Options for the `validateConnection` prop of `<Paper>` — declarative rules
 * that toggle the common connection constraints (self-loops, link-to-link,
 * duplicate links, root connections) and optionally layer your own check on top.
 * Reach for this object instead of a {@link ValidateConnection} callback when the
 * built-in rules already cover what you need.
 * @group Types
 * @expand
 * @example
 * ```tsx
 * import { GraphProvider, Paper } from '@joint/react';
 *
 * <GraphProvider>
 *   <Paper
 *     validateConnection={{
 *       allowSelfLoops: true,
 *       validate: ({ target }) => target.port === 'in',
 *     }}
 *     renderElement={() => <rect width={80} height={40} />}
 *   />
 * </GraphProvider>;
 * ```
 */
export interface CanConnectOptions {
  /** Allow a cell to connect to itself. @default false */
  readonly allowSelfLoops?: boolean;
  /** Allow links to start or end on another link, not just on elements. @default false */
  readonly allowLinkToLink?: boolean;
  /**
   * How many links may connect the same source+port and target+port. Matching
   * is port/magnet aware, so links on different ports never collide.
   * - `'none'` — no limit; any number of links, in either direction.
   * - `'one-per-direction'` — one link each way: a second `A→B` is blocked, but
   *   the reverse `B→A` is allowed.
   * - `'one-per-pair'` — one link per element pair: `A→B` blocks both another
   *   `A→B` and the reverse `B→A`.
   * @default 'one-per-direction'
   */
  readonly linkLimit?: 'none' | 'one-per-direction' | 'one-per-pair';
  /**
   * Whether a link may attach to an element's root (its body) instead of a port or magnet.
   * - `true` — always allow root connections.
   * - `false` — never allow them; require a port or magnet.
   * - `'auto'` — allow a root connection only when the element has no ports. @default 'auto'
   */
  readonly allowRootConnection?: boolean | 'auto';
  /** Extra check run only after every built-in rule passes; receives the same {@link ValidateConnectionParams} context as {@link ValidateConnection}. */
  readonly validate?: (context: ValidateConnectionParams) => boolean;
}

/**
 * Creates a JointJS-native `validateConnection` function with configurable rules.
 *
 * By default, rejects self-loops, link-to-link connections, and same-direction
 * duplicate links (`linkLimit: 'one-per-direction'`). An optional `validate`
 * callback receives a structured `{ source, target, paper, graph }` context and
 * runs only after the built-in checks pass.
 * @param options - Rules and optional custom validator.
 * @returns A JointJS-compatible `validateConnection` function.
 */
export function canConnect(options: CanConnectOptions = {}) {
  const {
    allowSelfLoops = false,
    allowLinkToLink = false,
    linkLimit = 'one-per-direction',
    allowRootConnection = 'auto',
    validate,
  } = options;

  return (
    // Note: JointJS passes `undefined` for magnet when the target is the root element
    sourceView: dia.CellView, sourceNode: SVGElement | undefined,
    targetView: dia.CellView, targetNode: SVGElement | undefined,
    end: dia.LinkEnd, linkView: dia.LinkView,
  ): boolean => {
    if (!allowSelfLoops && sourceView === targetView) return false;
    if (!allowLinkToLink && (!sourceView.model.isElement() || !targetView.model.isElement())) return false;
    if (isRootBlocked(sourceView, sourceNode, allowRootConnection)) return false;
    if (isRootBlocked(targetView, targetNode, allowRootConnection)) return false;
    if (
      linkLimit !== 'none' &&
      hasDuplicateLink(sourceView, sourceNode, targetView, targetNode, linkView, linkLimit === 'one-per-pair')
    ) {
      return false;
    }
    if (validate) {
      const paper = sourceView.paper!;
      return validate({
        source: toConnectionEnd(sourceView, sourceNode),
        target: toConnectionEnd(targetView, targetNode),
        endType: end,
        paper,
        graph: paper.model,
      });
    }
    return true;
  };
}
