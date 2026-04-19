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
    cellViewS: dia.CellView, magnetS: SVGElement | undefined,
    cellViewT: dia.CellView, magnetT: SVGElement | undefined,
    end: dia.LinkEnd, linkView: dia.LinkView,
  ): boolean => {
    if (!allowSelfLoops && cellViewS === cellViewT) return false;
    if (!allowLinkToLink && (!cellViewS.model.isElement() || !cellViewT.model.isElement())) return false;
    if (allowRootConnection !== true) {
      const isRootBlocked = (cellView: dia.CellView, magnet: SVGElement | undefined): boolean => {
        if (magnet) return false;
        if (allowRootConnection === false) return true;
        // 'auto': block root only if element has ports
        return cellView.model.isElement() && (cellView.model as dia.Element).hasPorts();
      };
      if (isRootBlocked(cellViewS, magnetS) || isRootBlocked(cellViewT, magnetT)) return false;
    }
    if (!allowMultiLinks) {
      const sourceId = cellViewS.model.id;
      const targetId = cellViewT.model.id;
      const sourcePort = magnetS ? cellViewS.findAttribute('port', magnetS) : null;
      const targetPort = magnetT ? cellViewT.findAttribute('port', magnetT) : null;
      const sourceMagnet = magnetS?.getAttribute('joint-selector') ?? null;
      const targetMagnet = magnetT?.getAttribute('joint-selector') ?? null;
      const graph = cellViewS.paper!.model;
      const links = graph.getConnectedLinks(cellViewS.model);
      for (const link of links) {
        if (link === linkView.model) continue;
        const ls = link.source();
        const lt = link.target();
        if (ls.id !== sourceId || lt.id !== targetId) continue;
        // Compare ports (when connecting to a port)
        if ((ls.port ?? null) !== sourcePort || (lt.port ?? null) !== targetPort) continue;
        // Compare magnet selectors (when connecting to a non-port magnet)
        if ((ls.magnet ?? ls.selector ?? null) !== sourceMagnet) continue;
        if ((lt.magnet ?? lt.selector ?? null) !== targetMagnet) continue;
        return false;
      }
    }
    if (validate) {
      const paper = cellViewS.paper!;
      return validate({
        source: toConnectionEnd(cellViewS, magnetS),
        target: toConnectionEnd(cellViewT, magnetT),
        endType: end,
        paper,
        graph: paper.model,
      });
    }
    return true;
  };
}
