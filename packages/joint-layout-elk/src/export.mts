import type { dia } from '@joint/core';
import type { PortsPositionMode } from './import.mjs';

import type {
    ElkNode,
    ElkPort,
    ElkExtendedEdge,
    ElkLabel,
    ElkLayoutOptions,
    NodeElkLayoutOptions,
    PortElkLayoutOptions,
    LabelElkLayoutOptions
} from './types/index.mjs';

// ELK ignores labels with no text.
const ELK_LABEL_TEXT = '-';

const ELK_INLINE_LABEL_OPTIONS: LabelElkLayoutOptions = { 'edgeLabels.inline': 'true' };

// Maps a `PortsPositionMode` onto the corresponding `elk.portConstraints` value -
// see `PortsPositionMode` for what each mode means.
const ELK_PORT_CONSTRAINTS_BY_MODE: Record<PortsPositionMode, NodeElkLayoutOptions> = {
    'fixed': { 'elk.portConstraints': 'FIXED_POS' },
    'fixed-side': { 'elk.portConstraints': 'FIXED_SIDE' },
    'free': { 'elk.portConstraints': 'FREE' },
};

/**
 * The ELK node properties `nodeOptions` can inspect and adjust - everything about a node
 * this package itself computes, except `id` (structural) and `ports`/`children` (built
 * separately, from the element's JointJS ports/embeds).
 */
export type NodeProperties = Omit<ElkNode, 'id' | 'ports' | 'children'>;
/**
 * The ELK port properties `portOptions` can inspect and adjust - everything about a port
 * this package itself computes, except `id` (structural).
 */
export type PortProperties = Omit<ElkPort, 'id'>;
/**
 * The ELK edge properties `edgeOptions` can inspect and adjust - everything about an edge
 * this package itself computes, except `id`/`sources`/`targets` (structural).
 */
export type EdgeProperties = Omit<ElkExtendedEdge, 'id' | 'sources' | 'targets' | 'container'>;

export type NodePropertiesCallback = (params: NodePropertiesCallbackParameters) => NodeProperties;
export type NodePropertiesCallbackParameters = {
    element: dia.Element;
    computedProperties: NodeProperties;
}

export type PortPropertiesCallback = (params: PortPropertiesCallbackParameters) => PortProperties;
export type PortPropertiesCallbackParameters = {
    port: dia.Element.Port;
    element: dia.Element;
    computedProperties: PortProperties;
};

export type EdgePropertiesCallback = (params: EdgePropertiesCallbackParameters) => EdgeProperties;
export type EdgePropertiesCallbackParameters = {
    link: dia.Link;
    computedProperties: EdgeProperties;
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
    nodeProperties?: NodePropertiesCallback;
    portProperties?: PortPropertiesCallback;
    edgeProperties?: EdgePropertiesCallback;
    /**
     * Whether to account for link labels during layout and position them
     * along the routed link afterwards.
     * @defaultValue true
     */
    edgeLabels?: boolean;
    /**
     * How freely ELK may reposition (and reorder) ports along their element,
     * instead of keeping them at the position JointJS itself already computed
     * for them - see `PortsPositionMode`. Any new positions are written back
     * onto the graph - see the `portsPosition` option in `ImportLayoutOptions`.
     * @defaultValue 'fixed'
     */
    portsPosition?: PortsPositionMode;
    /**
     * Whether to let ELK reposition port labels along their port, instead of keeping
     * them at the position JointJS itself already computed for them. The new
     * positions are written back onto the graph - see the `positionPortLabels`
     * option in `ImportLayoutOptions`.
     * @defaultValue false
     */
    positionPortLabels?: boolean;
}

export const DEFAULT_LABEL_SIZE: dia.Size = {
    width: 50,
    height: 20
};

let exportGraphOptions: ExportGraphOptions;

let elementsById: Map<string, dia.Element>;
let linksById: Map<string, dia.Link>;
let portsById: Map<string, ElkGraphPort>;
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
    edgeContainersById = new Map();
}

/**
 * Builds the ELK ports for an element's JointJS ports, starting out at the
 * position JointJS itself has already computed for them (via the element's
 * port groups). Whether ELK is free to move them from there, or has to treat
 * that position as final, is controlled by the node's own `elk.portConstraints`
 * (see `ELK_PORT_CONSTRAINTS_BY_MODE` in `buildElkNode`).
 */
function buildPorts(element: dia.Element): ElkPort[] | undefined {
    if (!element.hasPorts()) return undefined;

    return element.getPorts().map((port): ElkPort => {
        const portId = `${port.id}`;
        const elkPortId = `${element.id}:${portId}`;
        portsById.set(elkPortId, { element, portId });

        const layoutOptions: PortElkLayoutOptions = {};

        // `port` (from `element.getPorts()`) already carries the fully resolved label -
        // a port's own `label` (if it has one) merged over its group's, same as JointJS
        // itself resolves it. `element.portProp`/`getPort`, by contrast, only ever see the
        // port's own raw, unmerged JSON, so they can't be used here.
        let labels: ElkLabel[] | undefined;
        if (exportGraphOptions.positionPortLabels) {
            // @ts-expect-error `getPortMetrics` isn't officially typed
            const portMetrics = element.getPortMetrics(portId);

            const { width: labelWidth, height: labelHeight } = portMetrics.labelSize ?? DEFAULT_LABEL_SIZE;
            labels = [{
                // Some text is required, otherwise ELK ignores the label.
                text: ELK_LABEL_TEXT,
                width: labelWidth,
                height: labelHeight,
                layoutOptions: {}
            }];
        }

        const { x, y, width, height } = element.getPortRelativeRect(portId);
        layoutOptions['port.borderOffset'] = (-width / 2).toString();

        let portProperties: PortProperties = {
            x,
            y,
            width,
            height,
            labels,
            ...layoutOptions
        };
        if (exportGraphOptions.portProperties) {
            portProperties = exportGraphOptions.portProperties({
                port,
                element,
                computedProperties: portProperties
            });
        }

        return {
            id: elkPortId,
            ...portProperties
        };
    });
}

/**
 * ELK positions a node's children (and routes a node's own edges) relative to that
 * node's own origin (see `toAbsolute` in `importLayout`) - `containerX`/`containerY`
 * convert an element's own graph-absolute `position()` into that frame, so that the
 * `x`/`y` handed to `nodeOptions` is always a usable hint of where the element
 * currently is.
 */
function buildElkNode(element: dia.Element, containerPosition: dia.Point = { x: 0, y: 0 }): ElkNode {
    const id = `${element.id}`;
    elementsById.set(id, element);

    const ports = buildPorts(element);
    const {
        x: absoluteX,
        y: absoluteY
    } = element.position();
    const x = absoluteX - containerPosition.x;
    const y = absoluteY - containerPosition.y;


    const layoutOptions: NodeElkLayoutOptions = (ports) ? {
        ...ELK_PORT_CONSTRAINTS_BY_MODE[exportGraphOptions.portsPosition ?? 'fixed'],
        'portLabels.placement': 'OUTSIDE'
    } : {};
    // A hint of the element's current position - read directly (as the plain `x`/`y`
    // below) by ELK's `interactive` strategies (see `layout.mts`), and via this distinct
    // option by `elk.layered.crossingMinimization.semiInteractive`. A brand new element
    // has no meaningful position yet - strip this (and `x`/`y`) via `nodeOptions` (e.g.
    // based on your own "is this new" convention) to let ELK place it freely instead of
    // anchoring it here.
    layoutOptions['elk.position'] = `(${x},${y})`;

    const embeds = element.getEmbeddedCells()
        .filter((cell): cell is dia.Element => cell.isElement());


    let children: ElkNode[] | undefined;
    let edges: ElkExtendedEdge[] | undefined;
    // A container's real size is computed by ELK to fit its (recursively laid out)
    // content - `0` is only a placeholder starting point here (elkjs errors out on a
    // hierarchical node with no numeric width/height at all), not the final size
    // `nodeProperties` sees.
    let width = 0;
    let height = 0;
    if (embeds.length > 0) {
        children = embeds.map((embed) => buildElkNode(embed, { x, y }));
        // Shared with `edgeContainersById` (see there) - edges filed under this container
        // by `buildEdge` need to end up on the node itself.
        edges = [];
        edgeContainersById.set(id, edges);
    } else {
        ({ width, height } = element.size());
    }

    let nodeProperties: NodeProperties = { x, y, width, height, layoutOptions };
    if (exportGraphOptions.nodeProperties) {
        nodeProperties = exportGraphOptions.nodeProperties({
            element,
            computedProperties: nodeProperties
        });
    }
    const node: ElkNode = {
        id,
        children,
        ports,
        edges,
        ...nodeProperties
    };
    return node;
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

function buildEdge(link: dia.Link): void {
    const sourceElement = link.getSourceElement();
    const targetElement = link.getTargetElement();
    // Links not connected to two elements (e.g. connected to a point or
    // to another link) are not part of the layout.
    if (!sourceElement || !targetElement) return;
    if (!elementsById.has(`${sourceElement.id}`) || !elementsById.has(`${targetElement.id}`)) return;

    const id = `${link.id}`;
    linksById.set(id, link);

    const sourcePort = link.source().port;
    const targetPort = link.target().port;

    let labels: ElkLabel[] | undefined;
    if (exportGraphOptions.edgeLabels) {
        const linkLabels = link.labels();
        if (linkLabels.length > 0) {
            labels = linkLabels.map((label): ElkLabel => {
                const { width, height } = label.size || DEFAULT_LABEL_SIZE;
                return {
                    // Some text is required, otherwise ELK ignores the label.
                    text: ELK_LABEL_TEXT,
                    width,
                    height,
                    // Place the label directly on the edge (and allocate space for it).
                    layoutOptions: ELK_INLINE_LABEL_OPTIONS
                };
            });
        }
    }

    const sources = (sourcePort) ? [`${sourceElement.id}:${sourcePort}`] : [`${sourceElement.id}`];

    const targets = (targetPort) ? [`${targetElement.id}:${targetPort}`] : [`${targetElement.id}`];

    let edgeProperties: EdgeProperties = {
        layoutOptions: {},
        labels
    };
    if (exportGraphOptions.edgeProperties) {
        edgeProperties = exportGraphOptions.edgeProperties({
            link,
            computedProperties: edgeProperties
        });
    }

    const edge: ElkExtendedEdge = {
        id,
        sources,
        targets,
        ...edgeProperties
    };

    const lcaId = getLowestCommonAncestorId(getAncestorPath(sourceElement), getAncestorPath(targetElement));
    const edges = edgeContainersById.get(lcaId);
    // `edges` is always defined - `lcaId` is either `undefined` (the root) or the id of
    // one of `sourceElement`/`targetElement`'s ancestors, and every ancestor is a container
    // that has already been registered in `edgeContainersById` by the time links are processed.
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
        .map((element) => buildElkNode(element));

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

    console.log(elkGraph);

    return { elkGraph, elementsById, linksById, portsById };
}
