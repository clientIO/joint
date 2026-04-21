import type { dia } from '@joint/core';

/** Describes one end (source or target) of a connection. */
export interface ConnectionEnd {
  /** The cell ID. */
  readonly id: dia.Cell.ID;
  /** The cell model (element or link). */
  readonly model: dia.Cell;
  /** The port ID, or `null` if not connected to a port. */
  readonly port: string | null;
  /** The SVG magnet element, or `null` when connecting to the root element. */
  readonly magnet: Element | null;
  /** The `joint-selector` attribute of the magnet, or `null`. */
  readonly selector: string | null;
}

/** Structured context for connection validation. */
export interface ValidateConnectionContext {
  /** The source end of the connection. */
  readonly source: ConnectionEnd;
  /** The target end of the connection. */
  readonly target: ConnectionEnd;
  /** Which end of the link is being dragged (`'source'` or `'target'`). */
  readonly endType: dia.LinkEnd;
  /** The paper instance. */
  readonly paper: dia.Paper;
  /** The graph instance. */
  readonly graph: dia.Graph;
}

/**
 * Builds a `ConnectionEnd` from a cell view and its magnet element.
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
 * Returns `true` if a duplicate link already exists between the two ends
 * (ignoring the link currently being validated).
 */
function hasDuplicateLink(
  sourceView: dia.CellView, sourceNode: SVGElement | undefined,
  targetView: dia.CellView, targetNode: SVGElement | undefined,
  linkView: dia.LinkView,
): boolean {
  const sourceId = sourceView.model.id;
  const targetId = targetView.model.id;
  const sourcePort = getEndPort(sourceView, sourceNode);
  const targetPort = getEndPort(targetView, targetNode);
  const sourceMagnet = getEndMagnetSelector(sourceNode);
  const targetMagnet = getEndMagnetSelector(targetNode);
  const links = sourceView.paper!.model.getConnectedLinks(sourceView.model);
  for (const link of links) {
    if (link === linkView.model) continue;
    const ls = link.source();
    const lt = link.target();
    if (ls.id !== sourceId || lt.id !== targetId) continue;
    if (!endMatches(ls, sourcePort, sourceMagnet)) continue;
    if (!endMatches(lt, targetPort, targetMagnet)) continue;
    return true;
  }
  return false;
}

export interface CanConnectOptions {
  /** Allow connecting a cell to itself. @default false */
  readonly allowSelfLoops?: boolean;
  /** Allow connecting to or from links (not just elements). @default false */
  readonly allowLinkToLink?: boolean;
  /** Allow multiple links between the same source+port and target+port. @default false */
  readonly allowMultiLinks?: boolean;
  /**
   * Whether connecting to the root element (not a port/magnet) is allowed.
   * - `true` — always allow root connections
   * - `false` — never allow root (only ports/magnets)
   * - `'auto'` — allow root only if the element has no ports
   * @default 'auto'
   */
  readonly allowRootConnection?: boolean | 'auto';
  /** Custom validation on top of the built-in rules. Runs only if built-in checks pass. */
  readonly validate?: (context: ValidateConnectionContext) => boolean;
}

/**
 * Creates a JointJS-native `validateConnection` function with configurable rules.
 *
 * By default, rejects self-loops, link-to-link connections, and multi-links.
 * An optional `validate` callback receives a structured `{ source, target, paper, graph }`
 * context and runs only after the built-in checks pass.
 * @param options - Rules and optional custom validator.
 * @returns A JointJS-compatible `validateConnection` function.
 * @example
 * ```ts
 * // Default rules
 * paper.options.validateConnection = canConnect();
 *
 * // Allow self-loops + custom logic
 * paper.options.validateConnection = canConnect({
 *   allowSelfLoops: true,
 *   validate: ({ source, target }) => target.port === 'in',
 * });
 * ```
 */
export function canConnect(options: CanConnectOptions = {}) {
  const {
    allowSelfLoops = false,
    allowLinkToLink = false,
    allowMultiLinks = false,
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
    if (!allowMultiLinks && hasDuplicateLink(sourceView, sourceNode, targetView, targetNode, linkView)) {
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
