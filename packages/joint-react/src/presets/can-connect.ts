import type { dia } from '@joint/core';

/** Describes one end (source or target) of a connection. */
export interface ConnectionEnd {
  /** The cell ID. */
  readonly id: dia.Cell.ID;
  /** The cell model (element or link). */
  readonly model: dia.Cell;
  /** The port ID, or `null` if not connected to a port. */
  readonly port: string | null;
  /** The SVG magnet element. */
  readonly magnet: Element;
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

/** Builds a `ConnectionEnd` from a cell view and its magnet element. */
export function toConnectionEnd(cellView: dia.CellView, magnet: Element): ConnectionEnd {
  return {
    id: cellView.model.id,
    model: cellView.model,
    port: cellView.findAttribute('port', magnet),
    magnet,
    selector: magnet.getAttribute('joint-selector'),
  };
}

export interface CanConnectOptions {
  /** Allow connecting a cell to itself. @default false */
  readonly allowSelfLoops?: boolean;
  /** Allow connecting to or from links (not just elements). @default false */
  readonly allowLinkToLink?: boolean;
  /** Allow multiple links between the same source+port and target+port. @default false */
  readonly allowMultiLinks?: boolean;
  /** Custom validation on top of the built-in rules. Runs only if built-in checks pass. */
  readonly validate?: (context: ValidateConnectionContext) => boolean;
}

/**
 * Creates a JointJS-native `validateConnection` function with configurable rules.
 *
 * By default, rejects self-loops, link-to-link connections, and multi-links.
 * An optional `validate` callback receives a structured `{ source, target, paper, graph }`
 * context and runs only after the built-in checks pass.
 *
 * @param options - Rules and optional custom validator.
 * @returns A JointJS-compatible `validateConnection` function.
 *
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
    validate,
  } = options;

  return (
    cellViewS: dia.CellView, magnetS: SVGElement,
    cellViewT: dia.CellView, magnetT: SVGElement,
    end: dia.LinkEnd, _linkView: dia.LinkView,
  ): boolean => {
    if (!allowSelfLoops && cellViewS === cellViewT) return false;
    if (!allowLinkToLink && (!cellViewS.model.isElement() || !cellViewT.model.isElement())) return false;
    if (!allowMultiLinks) {
      const sourceId = cellViewS.model.id;
      const targetId = cellViewT.model.id;
      const sourcePort = cellViewS.findAttribute('port', magnetS);
      const targetPort = cellViewT.findAttribute('port', magnetT);
      const graph = cellViewS.paper!.model;
      const links = graph.getConnectedLinks(cellViewS.model);
      for (const link of links) {
        const linkSource = link.source();
        const linkTarget = link.target();
        if (
          linkSource.id === sourceId && linkTarget.id === targetId &&
          (linkSource.port ?? null) === sourcePort && (linkTarget.port ?? null) === targetPort
        ) {
          return false;
        }
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
