import { type dia } from '@joint/core';

import type {
    ElkNode,
    ElkPort,
    ElkExtendedEdge,
    ElkLabel,
    ElkLayoutOptions,
    NodeElkLayoutOptions,
    PortElkLayoutOptions,
    EdgeElkLayoutOptions,
    LabelElkLayoutOptions
} from './types/index.mjs';

// ELK ignores labels with no text.
const ELK_LABEL_TEXT = '-';

/**
 * A node's label, as far as layout is concerned: a box and its options. ELK sizes
 * labels from the box and never reads their text, so there is none to set.
 */
export interface ElkNodeLabelDraft {
    x: number;
    y: number;
    width: number;
    height: number;
    layoutOptions?: LabelElkLayoutOptions;
}

/**
 * A port's label - no `x`/`y` (unlike `ElkNodeLabelDraft`): the node's own
 * `portLabels.placement: 'OUTSIDE'` is what places it, not the label itself.
 */
export interface ElkPortLabelDraft {
    width: number;
    height: number;
    layoutOptions?: LabelElkLayoutOptions;
}

/**
 * An edge's label - no `x`/`y` (unlike `ElkNodeLabelDraft`): ELK places it along
 * the routed edge itself, per `layoutOptions` (e.g. `elk.edgeLabels.inline`).
 */
export interface ElkEdgeLabelDraft {
    width: number;
    height: number;
    layoutOptions?: LabelElkLayoutOptions;
}

export interface ElkNodeDraft {
    readonly id: string;
    /** Relative to the parent node. */
    x?: number;
    y?: number;
    /** `0` for a container: ELK sizes it to fit its content. */
    width: number;
    height: number;
    layoutOptions: NodeElkLayoutOptions;
    /**
     * Empty. JointJS elements carry no labels, so add them only if ELK should
     * size around them, e.g. under `elk.nodeSize.constraints: 'NODE_LABELS'`.
     */
    labels?: ElkNodeLabelDraft[];
}

/**
 * Mutate `elkNode` to customize what this package computed for an element, or
 * return `false` to drop the element - and its whole subtree (embeds, ports,
 * any edge connected to any of it) - from the ELK graph entirely.
 */
export type ExportElementCallback = (params: ExportElementCallbackParameters) => void | false;
export type ExportElementCallbackParameters = {
    element: dia.Element;
    elkNode: ElkNodeDraft;
};

export interface ElkPortDraft {
    readonly id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    layoutOptions: PortElkLayoutOptions;
    labels?: ElkPortLabelDraft[];
}

/**
 * Mutate `elkPort` to customize what this package computed for a port, or return
 * `false` to drop the port from the ELK graph - any edge connected to it falls
 * back to anchoring on the element itself, the same as a naturally portless one.
 */
export type ExportPortCallback = (params: ExportPortCallbackParameters) => void | false;
export type ExportPortCallbackParameters = {
    port: dia.Element.Port;
    element: dia.Element;
    elkPort: ElkPortDraft;
};

export interface ElkEdgeDraft {
    readonly id: string;
    layoutOptions: EdgeElkLayoutOptions;
    labels?: ElkEdgeLabelDraft[];
}

/**
 * Mutate `elkEdge` to customize what this package computed for a link, or return
 * `false` to drop the edge from the ELK graph - it is simply not routed/laid out.
 */
export type ExportEdgeCallback = (params: ExportEdgeCallbackParameters) => void | false;
export type ExportEdgeCallbackParameters = {
    link: dia.Link;
    elkEdge: ElkEdgeDraft;
};

export interface ElkGraphPort {
    element: dia.Element;
    portId: string;
}

export interface ElkGraphData {
    elkGraph: ElkNode;
    elementsById: Map<string, dia.Element>;
    linksById: Map<string, dia.Link>;
    portsById: Map<string, ElkGraphPort>;
}

export interface ExportGraphOptions {
    exportElement?: ExportElementCallback;
    exportPort?: ExportPortCallback;
    exportEdge?: ExportEdgeCallback;
}

export const DEFAULT_LABEL_SIZE: dia.Size = {
    width: 50,
    height: 20
};

let exportGraphOptions: ExportGraphOptions;

let elementsById: Map<string, dia.Element>;
let linksById: Map<string, dia.Link>;
let portsById: Map<string, ElkGraphPort>;
// A port `exportPort` dropped, keyed by its element's id then its own port id - so
// `buildEdge` can fall an edge connected to it back to the element itself, instead
// of referencing a port id that was never actually added to the ELK graph.
let excludedPortIdsByElement: Map<string, Set<string>>;
// Every container node (plus the root), keyed by element id (`undefined` for the root) -
// used to file each edge under the lowest common ancestor of its source and target.
let edgeContainersById: Map<string | undefined, ElkExtendedEdge[]>;

/**
 * (Re)initializes all the module-level state above for a single `exportGraph` call, so
 * that no callback, option or lookup table can leak from one call into the next.
 */
function init(options: ExportGraphOptions): void {
    exportGraphOptions = options;

    elementsById = new Map();
    linksById = new Map();
    portsById = new Map();
    excludedPortIdsByElement = new Map();
    edgeContainersById = new Map();
}

function getExcludedPortIds(element: dia.Element): Set<string> {
    const id = `${element.id}`;
    let excluded = excludedPortIdsByElement.get(id);
    if (!excluded) {
        excluded = new Set();
        excludedPortIdsByElement.set(id, excluded);
    }
    return excluded;
}

function isPortExcluded(element: dia.Element, portId: string): boolean {
    return !!excludedPortIdsByElement.get(`${element.id}`)?.has(portId);
}

/**
 * Builds a node's ELK ports, starting from the position JointJS already computed for
 * them. `exportPort` (if given) may mutate a port's draft, or return `false` to drop
 * it from the ELK graph (see `ExportPortCallback`).
 */
function buildPorts(element: dia.Element): ElkPort[] | undefined {
    if (!element.hasPorts()) return undefined;

    const ports: ElkPort[] = [];

    element.getPorts().forEach((port) => {
        const portId = `${port.id}`;
        const elkPortId = `${element.id}:${portId}`;

        const labelSize = element.portProp(portId, 'label/size');
        const { width: labelWidth, height: labelHeight } = labelSize ?? DEFAULT_LABEL_SIZE;

        const { x, y } = element.getPortRelativePosition(portId);
        const { width, height } = element.getPortRelativeRect(portId);

        const elkPort: ElkPortDraft = {
            id: elkPortId,
            x,
            y,
            width,
            height,
            layoutOptions: {
                // Negative offset moves the port inward from the node border, centering it there.
                'elk.port.borderOffset': `${-width / 2}`
            },
            labels: [{
                width: labelWidth,
                height: labelHeight,
                layoutOptions: {}
            }]
        };

        if (exportGraphOptions.exportPort?.({ port, element, elkPort }) === false) {
            getExcludedPortIds(element).add(portId);
            return;
        }

        portsById.set(elkPort.id, { element, portId });
        ports.push({
            ...elkPort,
            labels: (elkPort.labels || []).map((label): ElkLabel => ({
                // Some text is required, otherwise ELK ignores the label.
                text: ELK_LABEL_TEXT,
                ...label
            }))
        });
    });

    return ports;
}

/**
 * ELK positions a node's children/edges relative to its own origin - `containerPosition`
 * converts an element's graph-absolute position into that frame as we recurse down.
 * Returns `null` if `exportElement` dropped the element - its whole subtree goes with it,
 * so nothing is registered and nothing downstream (a child, a port, a connected edge)
 * can end up referencing it.
 */
function buildElkNode(element: dia.Element, containerPosition: dia.Point = { x: 0, y: 0 }): ElkNode | null {
    const id = `${element.id}`;

    const {
        x: absoluteX,
        y: absoluteY
    } = element.position();
    const x = absoluteX - containerPosition.x;
    const y = absoluteY - containerPosition.y;

    // Only relevant for a node that has ports.
    const computedLayoutOptions: NodeElkLayoutOptions = element.hasPorts() ? {
        'portLabels.placement': 'OUTSIDE'
    } : {};

    const embeds = element.getEmbeddedCells()
        .filter((cell): cell is dia.Element => cell.isElement());

    // A container's real size is computed by ELK to fit its content - `0` is just a
    // placeholder (elkjs needs a numeric size upfront for a hierarchical node).
    let width = 0;
    let height = 0;
    if (embeds.length === 0) {
        ({ width, height } = element.size());
    }

    const elkNode: ElkNodeDraft = {
        id,
        width,
        height,
        layoutOptions: computedLayoutOptions
    };

    if (exportGraphOptions.exportElement?.({ element, elkNode }) === false) return null;

    elementsById.set(id, element);

    const ports = buildPorts(element);

    let children: ElkNode[] | undefined;
    let edges: ElkExtendedEdge[] | undefined;
    if (embeds.length > 0) {
        children = embeds
            .map((embed) => buildElkNode(embed, { x, y }))
            .filter((node): node is ElkNode => node !== null);
        // Shared with `edgeContainersById` (see there) - edges filed under this container
        // by `buildEdge` need to end up on the node itself.
        edges = [];
        edgeContainersById.set(id, edges);
    }

    return {
        ...elkNode,
        children,
        ports,
        edges
    };
}

// The lowest common ancestor of an element and itself/an ancestor is the element's parent chain -
// this returns that chain, ordered from the outermost ancestor to the immediate parent.
function getAncestorPath(element: dia.Element): string[] {
    return element.getAncestors().reverse().map((cell) => `${cell.id}`);
}

function getLowestCommonAncestorId(sourcePath: string[], targetPath: string[]): string | undefined {
    let commonId: string | undefined;
    const length = Math.min(sourcePath.length, targetPath.length);
    for (let i = 0; i < length; i++) {
        if (sourcePath[i] !== targetPath[i]) break;
        commonId = sourcePath[i];
    }
    return commonId;
}

/**
 * Builds a link's ELK edge. `exportEdge` (if given) may mutate the edge's draft, or
 * return `false` to drop it from the ELK graph (see `ExportEdgeCallback`).
 */
function buildEdge(link: dia.Link): void {
    const sourceElement = link.getSourceElement();
    const targetElement = link.getTargetElement();
    // Links not connected to two elements (e.g. connected to a point or
    // to another link) are not part of the layout.
    if (!sourceElement || !targetElement) return;
    // Covers both a link connected to an element `exportElement` dropped, and one
    // connected to an element that was never part of the layout to begin with.
    if (!elementsById.has(`${sourceElement.id}`) || !elementsById.has(`${targetElement.id}`)) return;

    const id = `${link.id}`;

    const sourcePort = link.source().port;
    const targetPort = link.target().port;

    // A port `exportPort` dropped falls back to anchoring the edge on the element
    // itself, same as a naturally portless connection.
    const sources = (sourcePort && !isPortExcluded(sourceElement, sourcePort))
        ? [`${sourceElement.id}:${sourcePort}`]
        : [`${sourceElement.id}`];
    const targets = (targetPort && !isPortExcluded(targetElement, targetPort))
        ? [`${targetElement.id}:${targetPort}`]
        : [`${targetElement.id}`];

    // Resolved (`link.labels()`) - `size` falls back through `defaultLabel`/the built-in
    // default the same way `@joint/core` itself resolves it for rendering, and a custom
    // `elkLayoutOptionsProperty` property passes through too (whether set on the label
    // itself or on `defaultLabel` - see `Link#_getResolvedLabel`), so it can be read
    // directly here instead of from the label's raw JSON.
    const resolvedLabels = link.labels();
    let labels: ElkEdgeLabelDraft[] | undefined;
    if (resolvedLabels.length > 0) {
        labels = resolvedLabels.map((label): ElkEdgeLabelDraft => {
            const { width, height } = label.size || DEFAULT_LABEL_SIZE;
            return { width, height, layoutOptions: {}};
        });
    }

    const elkEdge: ElkEdgeDraft = {
        id,
        layoutOptions: {},
        labels
    };

    if (exportGraphOptions.exportEdge?.({ link, elkEdge }) === false) return;

    linksById.set(id, link);

    const edge: ElkExtendedEdge = {
        ...elkEdge,
        sources,
        targets,
        labels: elkEdge.labels && elkEdge.labels.map((label): ElkLabel => ({
            // Some text is required, otherwise ELK ignores the label.
            text: ELK_LABEL_TEXT,
            ...label
        }))
    };

    const lcaId = getLowestCommonAncestorId(getAncestorPath(sourceElement), getAncestorPath(targetElement));
    const edges = edgeContainersById.get(lcaId);
    // `edges` is always defined - `lcaId` is either `undefined` (the root) or the id of
    // one of `sourceElement`/`targetElement`'s ancestors, and every ancestor still part
    // of the ELK graph has already been registered in `edgeContainersById` by the time
    // links are processed (an excluded ancestor would have failed the guard clause above).
    (edges as ElkExtendedEdge[]).push(edge);
}

/**
 * Converts a JointJS graph (elements, their embedded elements, ports and the
 * links between them) to an ELK graph structure.
 */
export function exportGraph(
    graph: dia.Graph,
    options: ExportGraphOptions,
    elkLayoutOptions: ElkLayoutOptions
): ElkGraphData {

    init(options);

    const children: ElkNode[] = graph.getElements()
        .filter((element) => !element.parent())
        .map((element) => buildElkNode(element))
        .filter((node): node is ElkNode => node !== null);

    const elkGraph: ElkNode = {
        id: 'root',
        layoutOptions: elkLayoutOptions,
        children,
        edges: []
    };
    // Shared with `edgeContainersById` (see there) - edges filed under the root by
    // `buildEdge` need to end up on `elkGraph` itself.
    edgeContainersById.set(undefined, elkGraph.edges as ElkExtendedEdge[]);

    graph.getLinks().forEach(buildEdge);

    return { elkGraph, elementsById, linksById, portsById };
}
