import type { dia } from '@joint/core';
import { getPortPositionsMode, type PortPositionsMode, type PortPositionsOptions } from './import.mjs';

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
} from './elkOptions.mjs';

export const DEFAULT_LABEL_SIZE: dia.Size = {
    width: 50,
    height: 20
};

// ELK ignores labels with no text.
const ELK_LABEL_TEXT = '-';
// Used to estimate a port label's size from its text (see `getPortLabelSize`) when
// no explicit size is given - a rough, DOM-free approximation, not a real measurement.
const DEFAULT_FONT_SIZE = 16;
const AVERAGE_CHAR_WIDTH_RATIO = 0.6;
const LINE_HEIGHT_RATIO = 1.2;

const ELK_INLINE_LABEL_OPTIONS: LabelElkLayoutOptions = { 'edgeLabels.inline': 'true' };
// Maps a `PortPositionsMode` onto the corresponding `elk.portConstraints` value -
// see `PortPositionsMode` for what each mode means.
const ELK_PORT_CONSTRAINTS_BY_MODE: Record<PortPositionsMode, NodeElkLayoutOptions> = {
    'fixed': { 'elk.portConstraints': 'FIXED_POS' },
    'fixed-side': { 'elk.portConstraints': 'FIXED_SIDE' },
    'free': { 'elk.portConstraints': 'FREE' },
};

type GetSizeCallback = (element: dia.Element) => dia.Size;
type GetPortLabelSizeCallback = (port: dia.Element.Port, element: dia.Element) => dia.Size;
type NodeOptionsCallback = (element: dia.Element) => NodeElkLayoutOptions | undefined;
type PortOptionsCallback = (port: dia.Element.Port, element: dia.Element) => PortElkLayoutOptions | undefined;
type EdgeOptionsCallback = (link: dia.Link) => EdgeElkLayoutOptions | undefined;

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
    /**
     * Specify custom logic to determine the element's size used during layout
     * instead of the default `element.size()`. Not called for elements that
     * have embedded elements - their size is computed by ELK to fit their content.
     */
    getSize?: GetSizeCallback;
    /**
     * Specify custom logic to determine a port's label size, used when `positionPortLabels`
     * is enabled, instead of the default - the port's own `label.size`, falling back to its
     * group's `label.size`, falling back to an estimate from the label's text and font size
     * (`attrs.text.text`/`attrs.text.fontSize`, the latter defaulting to 16 if not set), and
     * finally to `DEFAULT_LABEL_SIZE` if there is no text either.
     */
    getPortLabelSize?: GetPortLabelSizeCallback;
    /**
     * Per-element ELK layout options, merged into the generated ELK node.
     * @example
     * nodeOptions: (element) => ({ 'partitioning.partition': element.get('layer') })
     */
    nodeOptions?: NodeOptionsCallback;
    /**
     * Per-port ELK layout options, merged into the generated ELK port.
     * @example
     * portOptions: (port) => ({ 'port.side': port.group === 'in' ? 'WEST' : 'EAST' })
     */
    portOptions?: PortOptionsCallback;
    /**
     * Per-link ELK layout options, merged into the generated ELK edge.
     */
    edgeOptions?: EdgeOptionsCallback;
    /**
     * Whether to account for link labels during layout and position them
     * along the routed link afterwards.
     * @defaultValue true
     */
    edgeLabels?: boolean;
    /**
     * How freely ELK may reposition (and reorder) ports along their element,
     * instead of keeping them at the position JointJS itself already computed
     * for them - see `PortPositionsMode`. Any new positions are written back
     * onto the graph - see the `positionPorts` option in `ImportLayoutOptions`.
     * @defaultValue 'fixed'
     */
    positionPorts?: PortPositionsMode | PortPositionsOptions;
    /**
     * Whether to let ELK reposition port labels along their port, instead of keeping
     * them at the position JointJS itself already computed for them. The new
     * positions are written back onto the graph - see the `positionPortLabels`
     * option in `ImportLayoutOptions`.
     * @defaultValue false
     */
    positionPortLabels?: boolean;
}

const getSize: GetSizeCallback = (element) => {
    return element.size();
};

/**
 * A rough, DOM-free approximation of a text's rendered size - not a real measurement
 * (that would need a live SVG document, see `util.breakText` in `@joint/core`), just
 * enough to give ELK a sane amount of space to reserve for a port label.
 */
function estimateTextSize(text: string, fontSize: number): dia.Size {
    return {
        width: Math.ceil(text.length * fontSize * AVERAGE_CHAR_WIDTH_RATIO),
        height: Math.ceil(fontSize * LINE_HEIGHT_RATIO)
    };
}

const getPortLabelSize: GetPortLabelSizeCallback = (port, element) => {
    // `label.size` isn't part of the officially typed `dia.Element.Port`/`PortGroup.label`
    // shape, but JointJS reads it off both at render time if present - a port's own size
    // takes precedence over its group's, same as JointJS resolves every other port/group
    // property (`attrs`, `markup`, ...).
    const portLabelSize = (port.label as { size?: dia.Size } | undefined)?.size;
    if (portLabelSize) {
        return portLabelSize;
    }
    const groupDef = port.group && element.prop(`ports/groups/${port.group}`);
    if (groupDef?.label?.size) {
        return groupDef.label.size;
    }

    // No explicit size anywhere - estimate one from the label's actual text (again,
    // the port's own `attrs` take precedence over its group's) instead of resorting
    // straight away to `DEFAULT_LABEL_SIZE`.
    const text = port.attrs?.text?.text ?? groupDef?.attrs?.text?.text;
    if (text) {
        const fontSize = parseFloat(port.attrs?.text?.fontSize ?? groupDef?.attrs?.text?.fontSize);
        return estimateTextSize(text, isNaN(fontSize) ? DEFAULT_FONT_SIZE : fontSize);
    }

    return DEFAULT_LABEL_SIZE;
};

const nodeOptions: NodeOptionsCallback = (_element) => {
    return undefined;
};

const portOptions: PortOptionsCallback = (_port, _element) => {
    return undefined;
};

const edgeOptions: EdgeOptionsCallback = (_link) => {
    return undefined;
};

/**
 * Builds the ELK ports for an element's JointJS ports, starting out at the
 * position JointJS itself has already computed for them (via the element's
 * port groups). Whether ELK is free to move them from there, or has to treat
 * that position as final, is controlled by the node's own `elk.portConstraints`
 * (see `ELK_PORT_CONSTRAINTS_BY_MODE` in `buildElkNode`).
 */
function buildPorts(
    element: dia.Element,
    portOptionsFn: PortOptionsCallback,
    getPortLabelSizeFn: GetPortLabelSizeCallback,
    portsById: Map<string, ElkGraphPort>,
    positionPortLabels: boolean
): ElkPort[] | undefined {
    if (!element.hasPorts()) return undefined;

    return element.getPorts().map((port): ElkPort => {
        const portId = `${port.id}`;
        const elkPortId = `${element.id}:${portId}`;
        portsById.set(elkPortId, { element, portId });

        const portLayoutOptions: ElkPort = {
            id: elkPortId,
            layoutOptions: portOptionsFn(port, element) || {}
        };

        const groupDef = port.group && element.prop(`ports/groups/${port.group}`);

        // A port's side is always determined by its group - JointJS has no way for an
        // individual port to sit on a different side than the rest of its group - so a
        // grouped port takes its group's `position`; an ungrouped one falls back to
        // JointJS's own default side ('left'), the same side it actually renders on.
        const positionName = (port.group) ? groupDef?.position : 'left';
        // ELK's `port.side` is a string, not a number, so we have to map JointJS's
        // named port positions to the corresponding string values.
        const side = (positionName === 'left') ? 'WEST'
            : (positionName === 'right') ? 'EAST'
                : (positionName === 'top') ? 'NORTH'
                    : (positionName === 'bottom') ? 'SOUTH'
                        : undefined;
        if (side) {
            portLayoutOptions.layoutOptions!['port.side'] = side;
        }

        // A port's own `label` (if it has one) always takes precedence over its group's -
        // same as JointJS itself resolves it (see `getPortLabelSizeFn`) - so either one is
        // enough to warrant reserving/positioning a label for this port.
        if (positionPortLabels && (port.label || groupDef?.label)) {
            const { width, height } = getPortLabelSizeFn(port, element);
            portLayoutOptions.labels = [{
                // Some text is required, otherwise ELK ignores the label.
                text: ELK_LABEL_TEXT,
                width,
                height,
                layoutOptions: {}
            }];
        }

        const { x, y, width, height } = element.getPortRelativeRect(portId);
        portLayoutOptions.x = x;
        portLayoutOptions.y = y;
        portLayoutOptions.width = width;
        portLayoutOptions.height = height;
        portLayoutOptions.layoutOptions!['port.borderOffset'] = (-width / 2).toString();

        return portLayoutOptions;
    });
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

    const getSizeFn = options.getSize ?? getSize;
    const getPortLabelSizeFn = options.getPortLabelSize ?? getPortLabelSize;
    const nodeOptionsFn = options.nodeOptions ?? nodeOptions;
    const portOptionsFn = options.portOptions ?? portOptions;
    const edgeOptionsFn = options.edgeOptions ?? edgeOptions;
    const portConstraintsOptions = ELK_PORT_CONSTRAINTS_BY_MODE[getPortPositionsMode(options.positionPorts)];

    const elementsById = new Map<string, dia.Element>();
    const linksById = new Map<string, dia.Link>();
    const portsById = new Map<string, ElkGraphPort>();
    // Every container node (plus the root), keyed by element id (`undefined` for the root) -
    // used to file each edge under the lowest common ancestor of its source and target.
    const edgeContainersById = new Map<string | undefined, ElkExtendedEdge[]>();

    // ELK positions a node's children (and routes a node's own edges) relative to that
    // node's own origin (see `toAbsolute` in `importLayout`) - `containerX`/`containerY`
    // convert an element's own graph-absolute `position()` into that frame, so that an
    // element's exported `x`/`y` is always a usable hint of where it currently is, e.g.
    // for `interactive` (see `Options` in `layout.mts`) to pick up.
    function buildElkNode(element: dia.Element, containerX = 0, containerY = 0): ElkNode {
        const id = `${element.id}`;
        elementsById.set(id, element);

        const ports = buildPorts(element, portOptionsFn, getPortLabelSizeFn, portsById, !!options.positionPortLabels);
        const customOptions = nodeOptionsFn(element);
        const { x: absoluteX, y: absoluteY } = element.position();
        const x = absoluteX - containerX;
        const y = absoluteY - containerY;

        const embeds = element.getEmbeddedCells()
            .filter((cell): cell is dia.Element => cell.isElement());

        if (embeds.length > 0) {
            // A container - its size is computed by ELK to fit its (recursively laid out) content.
            const children = embeds.map((embed) => buildElkNode(embed, absoluteX, absoluteY));
            const node: ElkNode = { id, x, y, children, ports, layoutOptions: customOptions };
            edgeContainersById.set(id, node.edges = []);
            return node;
        }

        const { width, height } = getSizeFn(element);
        return {
            id,
            x,
            y,
            width,
            height,
            ports,
            layoutOptions: (ports) ? {
                ...portConstraintsOptions,
                'portLabels.placement': 'OUTSIDE',
                ...customOptions
            } : customOptions
        };
    }

    const children: ElkNode[] = graph.getElements()
        .filter((element) => !element.parent())
        .map((element) => buildElkNode(element));

    const elkGraph: ElkNode = {
        id: 'root',
        layoutOptions: elkLayoutOptions,
        children,
        edges: []
    };
    edgeContainersById.set(undefined, elkGraph.edges as ElkExtendedEdge[]);

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

    graph.getLinks().forEach((link) => {
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

        const edge: ElkExtendedEdge = {
            id,
            sources: [(sourcePort) ? `${sourceElement.id}:${sourcePort}` : `${sourceElement.id}`],
            targets: [(targetPort) ? `${targetElement.id}:${targetPort}` : `${targetElement.id}`],
            layoutOptions: edgeOptionsFn(link)
        };

        if (options.edgeLabels) {
            const labels = link.labels();
            if (labels.length > 0) {
                edge.labels = labels.map((label): ElkLabel => {
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

        const lcaId = getLowestCommonAncestorId(getAncestorPath(sourceElement), getAncestorPath(targetElement));
        const edges = edgeContainersById.get(lcaId);
        // `edges` is always defined - `lcaId` is either `undefined` (the root) or the id of
        // one of `sourceElement`/`targetElement`'s ancestors, and every ancestor is a container
        // that has already been registered in `edgeContainersById` by the time links are processed.
        (edges as ElkExtendedEdge[]).push(edge);
    });

    return { elkGraph, elementsById, linksById, portsById };
}
