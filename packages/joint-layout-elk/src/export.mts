import { util, type dia } from '@joint/core';
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

/** Everything about a node this package computes, for `nodeProperties` to adjust - except `id`/`ports`/`children` (structural). */
export type NodeProperties = Omit<ElkNode, 'id' | 'ports' | 'children'>;
/** Everything about a port this package computes, for `portProperties` to adjust - except `id` (structural). */
export type PortProperties = Omit<ElkPort, 'id'>;
/** Everything about an edge this package computes, for `edgeProperties` to adjust - except `id`/`sources`/`targets` (structural). */
export type EdgeProperties = Omit<ElkExtendedEdge, 'id' | 'sources' | 'targets' | 'container'>;

// A callback's return value is merged onto its `computedProperties` (see `mergeProperties`) -
// only what it actually returns overrides the computed value, so e.g. returning `{}` (or
// omitting a key) keeps that part of `computedProperties` as-is.
export type NodePropertiesCallback = (params: NodePropertiesCallbackParameters) => Partial<NodeProperties>;
export type NodePropertiesCallbackParameters = {
    element: dia.Element;
    computedProperties: NodeProperties;
}

export type PortPropertiesCallback = (params: PortPropertiesCallbackParameters) => Partial<PortProperties>;
export type PortPropertiesCallbackParameters = {
    port: dia.Element.Port;
    element: dia.Element;
    computedProperties: PortProperties;
};

export type EdgePropertiesCallback = (params: EdgePropertiesCallbackParameters) => Partial<EdgeProperties>;
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
     * Whether to account for link labels during layout and position them afterwards.
     * @defaultValue true
     */
    edgeLabels?: boolean;
    /**
     * How freely ELK may reposition (and reorder) ports, instead of keeping them
     * where JointJS's port groups place them - see `PortsPositionMode`.
     * @defaultValue 'fixed'
     */
    portsPosition?: PortsPositionMode;
    /**
     * Whether to let ELK reposition port labels along their port, instead of
     * keeping them where JointJS's port groups place them.
     * @defaultValue false
     */
    positionPortLabels?: boolean;
}

export const DEFAULT_LABEL_SIZE: dia.Size = {
    width: 50,
    height: 20
};

// Deep-merges a `nodeProperties`/`portProperties`/`edgeProperties` callback's return value
// onto what this package itself computed - the override wins on conflicts (including into
// nested objects like `layoutOptions`), `computed` fills in anything the override didn't set.
function mergeProperties<T extends object>(overrides: Partial<T>, computed: T): T {
    return util.defaultsDeep({}, overrides, computed) as T;
}

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
 * Builds a node's ELK ports, starting from the position JointJS already computed
 * for them - `elk.portConstraints` (see `ELK_PORT_CONSTRAINTS_BY_MODE`) decides
 * whether ELK can move them from there.
 */
function buildPorts(element: dia.Element): ElkPort[] | undefined {
    if (!element.hasPorts()) return undefined;

    return element.getPorts().map((port): ElkPort => {
        const portId = `${port.id}`;
        const elkPortId = `${element.id}:${portId}`;
        portsById.set(elkPortId, { element, portId });

        // Optional per-port/group metadata (`side`, `labelSize`) a consumer can set under
        // a group's/port's own `elkLayout` key - merged onto the port by `@joint/core`.
        const properties = element.portProp(portId, 'elkLayout');

        // `element.getPorts()` gives the fully resolved label (merged with the group's) -
        // `portProp`/`getPort` only ever see the port's own raw JSON.
        let labels: ElkLabel[] | undefined;
        if (exportGraphOptions.positionPortLabels) {

            const { width: labelWidth, height: labelHeight } = properties?.labelSize ?? DEFAULT_LABEL_SIZE;
            labels = [{
                // Some text is required, otherwise ELK ignores the label.
                text: ELK_LABEL_TEXT,
                width: labelWidth,
                height: labelHeight,
                layoutOptions: {}
            }];
        }

        let portProperties: PortProperties = {};
        const layoutOptions: PortElkLayoutOptions = {};
        const { x, y } = element.getPortRelativePosition(portId);
        const { width, height } = element.getPortRelativeRect(portId);

        // In 'fixed' mode ELK must use the exact current position; other modes let it
        // compute a new one, so sending one would only anchor/bias it needlessly.
        if (!exportGraphOptions.portsPosition || exportGraphOptions.portsPosition === 'fixed') {
            portProperties.x = x;
            portProperties.y = y;
        }

        // Only 'fixed-side' pins the side - 'free' lets ELK choose it on its own.
        if (exportGraphOptions.portsPosition === 'fixed-side') {
            switch (properties?.side) {
                case 'WEST':
                    layoutOptions['elk.port.side'] = 'WEST';
                    break;
                case 'EAST':
                    layoutOptions['elk.port.side'] = 'EAST';
                    break;
                case 'SOUTH':
                    layoutOptions['elk.port.side'] = 'SOUTH';
                    break;
                case 'NORTH':
                    layoutOptions['elk.port.side'] = 'NORTH';
                    break;
                default:
            }
        }

        // Negative offset moves the port inward from the node border, centering it there.
        if (exportGraphOptions.portsPosition === 'fixed-side' || exportGraphOptions.portsPosition === 'free') {
            layoutOptions['elk.port.borderOffset'] = `${-width / 2}`;
        }

        portProperties = {
            width,
            height,
            labels,
            layoutOptions,
            ...portProperties
        };

        if (exportGraphOptions.portProperties) {
            const overrides = exportGraphOptions.portProperties({
                port,
                element,
                computedProperties: portProperties
            });
            portProperties = mergeProperties(overrides, portProperties);
        }

        return {
            id: elkPortId,
            ...portProperties
        };
    });
}

/**
 * ELK positions a node's children/edges relative to its own origin - `containerPosition`
 * converts an element's graph-absolute position into that frame as we recurse down.
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


    // Only relevant for a node that has ports - see `ELK_PORT_CONSTRAINTS_BY_MODE`.
    const computedLayoutOptions: NodeElkLayoutOptions = (ports) ? {
        ...ELK_PORT_CONSTRAINTS_BY_MODE[exportGraphOptions.portsPosition ?? 'fixed'],
        'portLabels.placement': 'OUTSIDE'
    } : {};

    // Optional `elk.*` layoutOptions a consumer can set directly on the element's own
    // `elkLayout` property (see the same-named property `buildPorts` reads per port/group
    // below), merged onto what this package itself computes - so e.g. a container's
    // `elk.padding` can be declared once, on the shape, without a `nodeProperties` callback.
    const elkLayout = element.prop('elkLayout') as NodeElkLayoutOptions | undefined;
    const layoutOptions = elkLayout ? mergeProperties(elkLayout, computedLayoutOptions) : computedLayoutOptions;

    const embeds = element.getEmbeddedCells()
        .filter((cell): cell is dia.Element => cell.isElement());

    let children: ElkNode[] | undefined;
    let edges: ElkExtendedEdge[] | undefined;
    // A container's real size is computed by ELK to fit its content - `0` is just a
    // placeholder (elkjs needs a numeric size upfront for a hierarchical node).
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
        const overrides = exportGraphOptions.nodeProperties({
            element,
            computedProperties: nodeProperties
        });
        nodeProperties = mergeProperties(overrides, nodeProperties);
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
        // Raw (not `link.labels()`) - a custom `elkLayout` property (read below) isn't
        // part of the resolved label `@joint/core` returns (see `Link#_getResolvedLabel`).
        const linkLabels = (link.get('labels') as dia.Link.Label[] | undefined) || [];
        if (linkLabels.length > 0) {
            labels = linkLabels.map((label): ElkLabel => {
                const { width, height } = label.size || DEFAULT_LABEL_SIZE;
                // Optional `elk.*` layoutOptions a consumer can set directly on the label's
                // own `elkLayout` property (see `buildElkNode`'s node-level equivalent above).
                const elkLayout = (label as { elkLayout?: LabelElkLayoutOptions }).elkLayout;
                const layoutOptions = elkLayout ? mergeProperties(elkLayout, ELK_INLINE_LABEL_OPTIONS) : ELK_INLINE_LABEL_OPTIONS;
                return {
                    // Some text is required, otherwise ELK ignores the label.
                    text: ELK_LABEL_TEXT,
                    width,
                    height,
                    // Place the label directly on the edge (and allocate space for it),
                    // unless `elkLayout` overrides that.
                    layoutOptions
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
        const overrides = exportGraphOptions.edgeProperties({
            link,
            computedProperties: edgeProperties
        });
        edgeProperties = mergeProperties(overrides, edgeProperties);
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

    return { elkGraph, elementsById, linksById, portsById };
}
