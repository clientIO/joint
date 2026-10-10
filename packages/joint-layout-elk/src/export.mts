import { type dia } from '@joint/core';
import { ELK_ROOT_ID, getElkEdgeId, getElkNodeId, getElkPortId, getLinkLabelId } from './elkIds.mjs';

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
 * An ELK label draft
 */
export interface ElkLabelDraft {
    x?: number;
    y?: number;
    width: number;
    height: number;
    layoutOptions: LabelElkLayoutOptions;
}

/** An ELK node draft, one per JointJS element. */
export interface ElkNodeDraft {
    /** The element's id - with any `\` and `:` in it escaped with a `\`. */
    readonly id: string;
    /** Relative to the parent node. */
    x?: number;
    y?: number;
    /** The element's own size - ELK overrides it for a node that ends up with children. */
    width: number;
    height: number;
    /** `{ 'elk.portConstraints': 'FIXED_POS' }` for an element with ports, empty otherwise. */
    layoutOptions: NodeElkLayoutOptions;
    /**
     * Empty. JointJS elements carry no labels, so add them only if ELK should
     * size around them, e.g. under `elk.nodeSize.constraints: 'NODE_LABELS'`.
     */
    labels?: ElkLabelDraft[];
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

/** An ELK port draft, one per JointJS port. */
export interface ElkPortDraft {
    /** `<element id>:<port id>` - with any `\` and `:` in either escaped with a `\`. */
    readonly id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    layoutOptions: PortElkLayoutOptions;
}

/**
 * Mutate `elkPort` to customize what this package computed for a port, or return
 * `false` to keep the port out of the ELK graph - ELK then neither positions it nor
 * routes to it, so the links connected to it are left out of the layout too and keep
 * the route they already had.
 */
export type ExportPortCallback = (params: ExportPortCallbackParameters) => void | false;
export type ExportPortCallbackParameters = {
    portId: string;
    element: dia.Element;
    elkPort: ElkPortDraft;
};

/** An ELK edge draft, one per JointJS link. */
export interface ElkEdgeDraft {
    /** The link's id - with any `\` and `:` in it escaped with a `\`. */
    readonly id: string;
    layoutOptions: EdgeElkLayoutOptions;
}

/**
 * Mutate `elkEdge` to customize what this package computed for a link, or return
 * `false` to drop the edge from the ELK graph - it is simply not routed/laid out.
 */
export type ExportLinkCallback = (params: ExportLinkCallbackParameters) => void | false;
export type ExportLinkCallbackParameters = {
    link: dia.Link;
    elkEdge: ElkEdgeDraft;
};

/**
 * Size `elkPortLabel` (it starts at `0`x`0`, which leaves the port without a label in the
 * ELK graph) for ELK to place the port's label, or return `false` to leave it out.
 */
export type ExportPortLabelCallback = (params: ExportPortLabelCallbackParameters) => void | false;
export type ExportPortLabelCallbackParameters = {
    portId: string;
    element: dia.Element;
    elkPortLabel: ElkLabelDraft;
};

export type ExportLinkLabelCallback = (params: ExportLinkLabelCallbackParameters) => void | false;
export type ExportLinkLabelCallbackParameters = {
    link: dia.Link;
    labelIndex: number;
    elkEdgeLabel: ElkLabelDraft;
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
    exportPortLabel?: ExportPortLabelCallback;
    exportLink?: ExportLinkCallback;
    exportLinkLabel?: ExportLinkLabelCallback;
}

let exportGraphOptions: ExportGraphOptions;

let elementsById: Map<string, dia.Element>;
let linksById: Map<string, dia.Link>;
let portsById: Map<string, ElkGraphPort>;
// Every container node (plus the root), keyed by element id (`undefined` for the root) -
// used to file each edge under the lowest common ancestor of its source and target.
let edgeContainersById: Map<string | undefined, ElkExtendedEdge[]>;
// Every exported node's parent node in the ELK graph (`undefined` for a top-level one) -
// not always its JointJS parent (see `exportGraph`).
let elkParentIdsById: Map<string, string | undefined>;
// Each element's position in the list of elements given to `exportGraph`.
let elementIndicesById: Map<string, number>;
// Whether this call has already reported a rotated element (see `buildElkNode`).
let hasWarnedAboutRotation: boolean;
// The elements laid out inside each container, keyed by the container's element id and
// in the order of the list given to `exportGraph`. Built from each element's `parent()`
// rather than read off the graph, so it covers an element that is in no graph (e.g. a
// container that only exists to group others for the layout).
let childElementsByParentId: Map<string, dia.Element[]>;

/**
 * (Re)initializes all the module-level state above for a single `exportGraph` call, so
 * that no callback, option or lookup table can leak from one call into the next.
 */
function init(options: ExportGraphOptions, elements: dia.Element[]): void {
    exportGraphOptions = options;

    elementsById = new Map();
    linksById = new Map();
    portsById = new Map();
    edgeContainersById = new Map();
    elkParentIdsById = new Map();
    elementIndicesById = new Map(elements.map((element, index) => [`${element.id}`, index]));
    hasWarnedAboutRotation = false;

    // A second pass - a container may be listed after the elements inside it.
    childElementsByParentId = new Map();
    elements.forEach((element) => {
        const parentId = element.parent();
        if (parentId === undefined || parentId === null) return;
        const containerId = `${parentId}`;
        if (!elementIndicesById.has(containerId)) return;
        const children = childElementsByParentId.get(containerId);
        if (children) {
            children.push(element);
        } else {
            childElementsByParentId.set(containerId, [element]);
        }
    });
}

// Whether an element's parent is laid out too - i.e. the element is laid out inside it,
// rather than as a top-level node.
function hasLaidOutParent(element: dia.Element): boolean {
    const parentId = element.parent();
    if (parentId === undefined || parentId === null) return false;
    return elementIndicesById.has(`${parentId}`);
}

// An element's embedded elements that take part in the layout, in the order of the list
// of elements given to `exportGraph`.
function getEmbeddedElements(element: dia.Element): dia.Element[] {
    return childElementsByParentId.get(`${element.id}`) ?? [];
}

// ELK's ids are strings, while a JointJS cell's id may be a string or a number - so two
// cells whose ids differ only in type (`5` and `'5'`) would share one ELK id. ELK accepts
// the duplicate and lays both out, and the import then resolves them to the same cell,
// leaving the other one where it was.
function throwIfIdTaken(taken: boolean, cell: dia.Cell, id: string): void {
    if (!taken) return;
    throw new Error(`@joint/layout-elk: the id of ${cell.isLink() ? 'link' : 'element'} \`${cell.id}\` collides with another cell's in the ELK graph ("${id}").`);
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
        const elkPortId = getElkPortId(element, portId);

        // ELK takes a port's top-left corner, not its center. No `elk.port.borderOffset`:
        // ELK places the port just outside the border, and `importLayout` moves its center
        // onto the border (a negative offset would also shift the port along the side).
        const { x, y, width, height } = element.getPortRelativeRect(portId);

        const elkPort: ElkPortDraft = {
            id: elkPortId,
            x,
            y,
            width,
            height,
            layoutOptions: {}
        };

        if (exportGraphOptions.exportPort?.({ portId, element, elkPort }) === false) return;

        const portLabel: ElkLabelDraft = {
            width: 0,
            height: 0,
            layoutOptions: {}
        };

        const isLabelExported = exportGraphOptions.exportPortLabel?.({ portId, element, elkPortLabel: portLabel }) !== false;

        let labels: ElkLabel[] = [];
        if (isLabelExported && portLabel.width && portLabel.height) {
            labels = [{
                ...portLabel,
                text: ELK_LABEL_TEXT
            }];
        }

        portsById.set(elkPort.id, { element, portId });
        ports.push({
            ...elkPort,
            labels
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
function buildElkNode(element: dia.Element, parentId?: string): ElkNode | null {
    const id = getElkNodeId(element);

    const embeds = getEmbeddedElements(element);

    // ELK computes the size of a node that ends up with children, from its content - the
    // element's own size is what a leaf is laid out with, and what a container falls back
    // to if `exportElement` drops every element inside it.
    const { width, height } = element.size();

    const elkNode: ElkNodeDraft = {
        id,
        width,
        height,
        // Ports stay where JointJS already places them - without it, ELK is free to move
        // them to another side or reorder them. `exportElement` may override it.
        layoutOptions: element.hasPorts() ? { 'elk.portConstraints': 'FIXED_POS' } : {}
    };

    if (exportGraphOptions.exportElement?.({ element, elkNode }) === false)
        return null;

    // An ELK node is a box with a position and a size, with no rotation, so the element
    // goes in with the geometry it would have at `angle: 0` and ELK reserves the wrong
    // area for a rotated one. Reported only for an element that is actually laid out.
    if (!hasWarnedAboutRotation && element.angle() !== 0) {
        hasWarnedAboutRotation = true;
        console.warn('@joint/layout-elk: element rotation is not supported - exclude rotated elements from the layout.');
    }

    throwIfIdTaken(elementsById.has(id), element, id);
    elementsById.set(id, element);
    elkParentIdsById.set(id, parentId);

    const ports = buildPorts(element);

    let children: ElkNode[] | undefined;
    let edges: ElkExtendedEdge[] | undefined;
    if (embeds.length > 0) {
        children = embeds
            .map((embed) => buildElkNode(embed, id))
            .filter((node): node is ElkNode => node !== null);
        if (children.length > 0) {
            // Shared with `edgeContainersById` (see there) - edges filed under this
            // container by `buildEdge` need to end up on the node itself.
            edges = [];
            edgeContainersById.set(id, edges);
        } else {
            // `exportElement` dropped every embed - laid out as a leaf.
            children = undefined;
        }
    }

    return {
        ...elkNode,
        children,
        ports,
        edges
    };
}

// The lowest common ancestor of an element and itself/an ancestor is the element's parent chain -
// this returns that chain in the ELK graph, ordered from the outermost ancestor to the
// immediate parent.
function getAncestorPath(element: dia.Element): string[] {
    const path: string[] = [];
    let parentId = elkParentIdsById.get(getElkNodeId(element));
    while (parentId !== undefined) {
        path.unshift(parentId);
        parentId = elkParentIdsById.get(parentId);
    }
    return path;
}

// The id shared by the last matching entries of two ancestor paths (or `undefined` if
// they don't share a root, i.e. one of them is the top-level root itself).
function getLowestCommonAncestorId(sourcePath: string[], targetPath: string[]): string | undefined {
    let commonId: string | undefined;
    const length = Math.min(sourcePath.length, targetPath.length);
    for (let i = 0; i < length; i++) {
        if (sourcePath[i] !== targetPath[i]) break;
        commonId = sourcePath[i];
    }
    return commonId;
}

// Whether a link end's port is one `exportPort` dropped - the port is there, it is only
// hidden from ELK, so there is nothing for an edge to attach to.
function isEndPortDropped(element: dia.Element, port: string | number | undefined | null): boolean {
    if (port === undefined || port === null) return false;
    const portId = `${port}`;
    return element.hasPort(portId) && !portsById.has(getElkPortId(element, portId));
}

/**
 * The id a link end anchors on in the ELK graph - its port's, or the element's when the
 * end has no port, or references one the element no longer has. JointJS renders such an
 * end against the element's bbox, while ELK rejects the whole graph over the dangling
 * reference, so the edge is attached to the node instead.
 */
function getElkEndId(element: dia.Element, port: string | number | undefined | null): string {
    if (port !== undefined && port !== null) {
        const elkPortId = getElkPortId(element, `${port}`);
        if (portsById.has(elkPortId)) return elkPortId;
    }
    return getElkNodeId(element);
}

/**
 * Builds a link's ELK edge. `exportLink` (if given) may mutate the edge's draft, or
 * return `false` to drop it from the ELK graph (see `ExportLinkCallback`).
 */
function buildEdge(link: dia.Link): void {
    // `getSourceCell()`, not `getSourceElement()` - the latter walks through a chain of
    // links and returns the element at its far end, so a link connected to another link
    // would pass the guard below and be exported as an edge between the wrong ends.
    const sourceCell = link.getSourceCell();
    const targetCell = link.getTargetCell();
    // Links not connected to two elements (e.g. connected to a point or
    // to another link) are not part of the layout.
    if (!sourceCell?.isElement() || !targetCell?.isElement()) return;
    const sourceElement = sourceCell as dia.Element;
    const targetElement = targetCell as dia.Element;
    // Covers both a link connected to an element `exportElement` dropped, and one
    // connected to an element that was never part of the layout to begin with.
    if (!elementsById.has(getElkNodeId(sourceElement)) || !elementsById.has(getElkNodeId(targetElement))) return;
    // A port `exportPort` dropped takes the links connected to it out of the layout too -
    // the same rule as an element that isn't laid out, one level down.
    if (isEndPortDropped(sourceElement, link.source().port)) return;
    if (isEndPortDropped(targetElement, link.target().port)) return;

    const id = getElkEdgeId(link);

    const sources = [getElkEndId(sourceElement, link.source().port)];
    const targets = [getElkEndId(targetElement, link.target().port)];

    const elkEdge: ElkEdgeDraft = {
        id,
        layoutOptions: {}
    };

    if (exportGraphOptions.exportLink?.({ link, elkEdge }) === false)
        return;

    throwIfIdTaken(linksById.has(id), link, id);
    linksById.set(id, link);

    // Computed (`link.getComputedLabels()`) - `size` falls back through `defaultLabel`/the
    // built-in default the same way `@joint/core` itself computes it for rendering, so it
    // can be read directly here instead of from the label's raw JSON.
    // @ts-expect-error `getComputedLabels()` is `protected` in `@joint/core`'s types for now - it
    // will become public in the future (it is on every link at runtime already).
    const computedLabels: dia.Link.ComputedLabel[] = link.getComputedLabels();
    let labels: ElkLabel[] = [];
    if (computedLabels.length > 0) {
        labels = computedLabels.reduce((result: ElkLabel[], label, labelIndex) => {
            const { width, height } = label.size!;
            const labelDraft: ElkLabelDraft = {
                width,
                height,
                layoutOptions: {
                    'elk.edgeLabels.inline': 'true'
                }
            };

            if (exportGraphOptions.exportLinkLabel?.({ link, labelIndex, elkEdgeLabel: labelDraft }) === false)
                return result;

            result.push({
                ...labelDraft,
                id: getLinkLabelId(id, labelIndex),
                text: ELK_LABEL_TEXT
            });
            return result;
        }, []);
    }

    const edge: ElkExtendedEdge = {
        ...elkEdge,
        sources,
        targets,
        labels
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
 * Converts JointJS elements (with their embedded elements and ports) and the links
 * between them to an ELK graph structure.
 *
 * `elements`/`links` are what takes part - a link only if both its ends do too - and
 * set its order: the root's children and edges follow them, and so do each container's
 * own children. An element whose parent isn't in `elements` becomes a top-level node.
 */
export function exportGraph(
    elements: dia.Element[],
    links: dia.Link[],
    options: ExportGraphOptions,
    elkLayoutOptions: ElkLayoutOptions
): ElkGraphData {

    init(options, elements);

    const topLevelElements = elements.filter((element) => !hasLaidOutParent(element));

    const children: ElkNode[] = topLevelElements
        .map((element) => buildElkNode(element))
        .filter((node): node is ElkNode => node !== null);

    const elkGraph: ElkNode = {
        id: ELK_ROOT_ID,
        layoutOptions: elkLayoutOptions,
        children,
        edges: []
    };
    // Shared with `edgeContainersById` (see there) - edges filed under the root by
    // `buildEdge` need to end up on `elkGraph` itself.
    edgeContainersById.set(undefined, elkGraph.edges as ElkExtendedEdge[]);

    links.forEach(buildEdge);

    return { elkGraph, elementsById, linksById, portsById };
}
