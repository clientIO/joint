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

// Default for `ExportGraphOptions.elkLayoutOptionsProperty` - the name of the property an
// element/port/group/link label can set to declare custom `elk.*` layoutOptions (see
// `getElkLayoutOptionsProperty` below).
const DEFAULT_ELK_LAYOUT_OPTIONS_PROPERTY = 'elkLayoutOptions';

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
    /**
     * The name of the property an element, port/port group, or link label can set to
     * declare custom `elk.*` layoutOptions for it, merged onto what this package itself
     * computes (see "Declaring custom ELK layout options" in the README) - without a
     * `nodeProperties`/`portProperties`/`edgeProperties` callback. Not to be confused with
     * `elkLayoutOptions` (`layout()`'s own option, the ELK options for the whole graph).
     * @defaultValue 'elkLayoutOptions'
     */
    elkLayoutOptionsProperty?: string;
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

// The name of the property to read custom `elk.*` layoutOptions from (see
// `ExportGraphOptions.elkLayoutOptionsProperty`).
function getElkLayoutOptionsProperty(): string {
    return exportGraphOptions.elkLayoutOptionsProperty || DEFAULT_ELK_LAYOUT_OPTIONS_PROPERTY;
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

        // Optional `elk.*` layoutOptions a consumer can set directly under a port's/group's
        // own `elkLayoutOptionsProperty` key (see `buildElkNode`'s node-level equivalent),
        // merged onto what this package itself computes below - `@joint/core` merges a
        // group's own value onto each of its ports for `portProp` reads.
        const elkLayout = element.portProp(portId, getElkLayoutOptionsProperty()) as PortElkLayoutOptions | undefined;

        // `getPortMetrics` resolves a port's `label.size` against its group's, unlike
        // `element.getPorts()`/`portProp`, which only ever see the port's own raw JSON.
        let labels: ElkLabel[] | undefined;
        if (exportGraphOptions.positionPortLabels) {
            const { width: labelWidth, height: labelHeight } = element.getPortMetrics(portId).labelSize ?? DEFAULT_LABEL_SIZE;
            labels = [{
                // Some text is required, otherwise ELK ignores the label.
                text: ELK_LABEL_TEXT,
                width: labelWidth,
                height: labelHeight,
                layoutOptions: {}
            }];
        }

        let portProperties: PortProperties = {};
        const computedLayoutOptions: PortElkLayoutOptions = {};
        const { x, y } = element.getPortRelativePosition(portId);
        const { width, height } = element.getPortRelativeRect(portId);

        // In 'fixed' mode ELK must use the exact current position; other modes let it
        // compute a new one, so sending one would only anchor/bias it needlessly.
        if (!exportGraphOptions.portsPosition || exportGraphOptions.portsPosition === 'fixed') {
            portProperties.x = x;
            portProperties.y = y;
        }

        // Negative offset moves the port inward from the node border, centering it there.
        if (exportGraphOptions.portsPosition === 'fixed-side' || exportGraphOptions.portsPosition === 'free') {
            computedLayoutOptions['elk.port.borderOffset'] = `${-width / 2}`;
        }

        // `elkLayout` (e.g. `{ 'elk.port.side': 'WEST' }`) maps directly onto ELK's own
        // layoutOptions - merged onto what this package computed above (see `mergeProperties`).
        const layoutOptions = elkLayout ? mergeProperties(elkLayout, computedLayoutOptions) : computedLayoutOptions;

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
    // `elkLayoutOptionsProperty` property (see the same one `buildPorts` reads per
    // port/group below), merged onto what this package itself computes - so e.g. a
    // container's `elk.padding` can be declared once, on the shape, without a
    // `nodeProperties` callback.
    const elkLayout = element.prop(getElkLayoutOptionsProperty()) as NodeElkLayoutOptions | undefined;
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
        // Resolved (`link.labels()`) - `size` falls back through `defaultLabel`/the built-in
        // default the same way `@joint/core` itself resolves it for rendering, and a custom
        // `elkLayoutOptionsProperty` property passes through too (whether set on the label
        // itself or on `defaultLabel` - see `Link#_getResolvedLabel`), so it can be read
        // directly here instead of from the label's raw JSON.
        const resolvedLabels = link.labels();
        if (resolvedLabels.length > 0) {
            const elkLayoutOptionsProperty = getElkLayoutOptionsProperty();
            labels = resolvedLabels.map((label): ElkLabel => {
                const { width, height } = label.size || DEFAULT_LABEL_SIZE;
                // Optional `elk.*` layoutOptions a consumer can set directly on the label's
                // own (or `defaultLabel`'s) `elkLayoutOptionsProperty` property (see
                // `buildElkNode`'s node-level equivalent above). Not inline by default - a
                // consumer wanting the old default back sets e.g.
                // `elkLayoutOptions: { 'elk.edgeLabels.inline': 'true' }` explicitly.
                const elkLayout = (label as Record<string, LabelElkLayoutOptions | undefined>)[elkLayoutOptionsProperty];
                // Cloned (not a direct reference into the label's own storage), same as
                // `buildElkNode`/`buildPorts` - `elk.layout()` shouldn't mutate a consumer's data.
                const layoutOptions = elkLayout ? mergeProperties(elkLayout, {}) : {};
                return {
                    // Some text is required, otherwise ELK ignores the label.
                    text: ELK_LABEL_TEXT,
                    width,
                    height,
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
