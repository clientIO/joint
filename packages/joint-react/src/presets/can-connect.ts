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
    if (allowRootConnection !== true) {
      const isRootBlocked = (cellView: dia.CellView, magnet: SVGElement | undefined): boolean => {
        if (magnet) return false;
        if (allowRootConnection === false) return true;
        // 'auto': block root only if element has ports
        return cellView.model.isElement() && (cellView.model as dia.Element).hasPorts();
      };
      if (isRootBlocked(sourceView, sourceNode) || isRootBlocked(targetView, targetNode)) return false;
    }
    if (!allowMultiLinks) {
      const sourceId = sourceView.model.id;
      const targetId = targetView.model.id;
      const sourcePort = sourceNode ? sourceView.findAttribute('port', sourceNode) : null;
      const targetPort = targetNode ? targetView.findAttribute('port', targetNode) : null;
      // If the magnet is the port node itself, ignore the `selector`
      const sourceMagnet = sourceNode?.hasAttribute('port') ? null : sourceNode?.getAttribute('joint-selector') ?? null;
      const targetMagnet = targetNode?.hasAttribute('port') ? null : targetNode?.getAttribute('joint-selector') ?? null;
      const graph = sourceView.paper!.model;
      const links = graph.getConnectedLinks(sourceView.model);
      for (const link of links) {
        if (link === linkView.model) continue;
        const ls = link.source();
        const lt = link.target();
        if (ls.id !== sourceId || lt.id !== targetId) continue;
        // For each end: if a port is involved on either side, compare ports only.
        // Otherwise fall back to the magnet selector.
        const lsPort = ls.port ?? null;
        const ltPort = lt.port ?? null;
        const sourceMatches = (sourcePort !== null || lsPort !== null)
          ? lsPort === sourcePort
          : (ls.magnet ?? ls.selector ?? null) === sourceMagnet;
        const targetMatches = (targetPort !== null || ltPort !== null)
          ? ltPort === targetPort
          : (lt.magnet ?? lt.selector ?? null) === targetMagnet;
        if (!sourceMatches || !targetMatches) continue;
        return false;
      }
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
