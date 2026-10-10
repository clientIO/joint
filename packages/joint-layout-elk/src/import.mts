import { type dia, g } from '@joint/core';
import type { ElkPoint } from 'elkjs';
import type { ElkNode, ElkExtendedEdge, ElkPort } from './types/index.mjs';
import type { ElkGraphPort } from './export.mjs';
import { getLinkLabelIndex } from './elkIds.mjs';

/** Applies the ELK-computed position (and, for a container, size) to `element`. */
export type SetElementAttributesCallback = (params: SetElementAttributesCallbackParameters) => void;
export type SetElementAttributesCallbackParameters = {
    element: dia.Element;
    attributes: {
        position: dia.Point;
        // Present only for a container - its size is computed by ELK to fit its
        // (recursively laid out) content; a leaf element keeps its existing size.
        size?: dia.Size;
    };
    elkNode: ElkNode
};

/** Applies the ELK-computed position (and, for a labeled port, label position) to a port. */
export type SetPortAttributesCallback = (params: SetPortAttributesCallbackParameters) => void;
export type SetPortAttributesCallbackParameters = {
    element: dia.Element;
    portId: string;
    // Shaped for `element.portProp(portId, attributes)` - only the port's own
    // `position.args`/`label.position.args` (a group's `position`/`label.position`
    // decides which layout function reads them - handled separately, see `importNode`).
    attributes: {
        position: { args: dia.Point };
        // Present only when the port has a label.
        label?: { position: { args: dia.Point } };
    };
    elkPort: ElkPort
};

/** Applies the ELK-computed vertices, end anchors and label positions to a link. */
export type SetLinkAttributesCallback = (params: SetLinkAttributesCallbackParameters) => void;
export type SetLinkAttributesCallbackParameters = {
    link: dia.Link;
    // Shaped for `link.set(attributes)`.
    attributes: {
        vertices: dia.Point[];
        // Present only for an end ELK anchored on the element rather than on a port -
        // carries the end's existing `id`/`port`/... alongside the new `anchor`, since
        // `link.set(...)` replaces `source`/`target` outright rather than merging into them.
        source?: dia.Link.EndJSON;
        target?: dia.Link.EndJSON;
        // Present only when the link has labels - the whole current `labels` array,
        // with each routed label's `position` replaced.
        labels?: dia.Link.Label[];
    };
    elkEdge: ElkExtendedEdge
};

export interface ImportLayoutOptions {
    setElementAttributes?: SetElementAttributesCallback;
    setLinkAttributes?: SetLinkAttributesCallback;
    setPortAttributes?: SetPortAttributesCallback;
}

// The anchor for a link end ELK routed to an element - computed the same way JointJS
// computes one for a port-connected end, so both react the same way to future moves.
// Only ends that carry no port, or one the element does not have, are routed this way -
// which is also when `useModelGeometry` measures `topLeft` from the element's own bbox.
function getElementAnchorAtPoint(
    element: dia.Element,
    point: dia.Point
): NonNullable<dia.Link.EndCellArgs['anchor']> {
    const delta = element.getRelativePointFromAbsolute(point);
    return {
        name: 'topLeft',
        args: {
            dx: delta.x,
            dy: delta.y,
            useModelGeometry: true,
            rotate: true
        }
    };
}

// A label's `distance` in `(0, 1]` is read back as a ratio of the link's length, not as a
// length (see `LinkView.prototype._getLabelTransformationMatrix`) - a label that close to
// the link's start is pinned to the start instead.
function toLabelDistance(length: number): number {
    return (length > 0 && length <= 1) ? 0 : length;
}

/**
 * The end to write back, or `null` when ELK anchored it on a port - JointJS computes that
 * anchor itself. The end's existing `id`/`port`/... is kept, since `link.set()` replaces
 * `source`/`target` outright rather than merging into them.
 */
function buildEnd(
    currentEnd: dia.Link.EndJSON,
    refs: string[] | undefined,
    point: dia.Point
): dia.Link.EndJSON | null {
    const [elkId] = refs || [];
    if (elkId === undefined) return null;
    const element = elementsById.get(elkId);
    if (!element) return null;
    return {
        ...currentEnd,
        anchor: getElementAnchorAtPoint(element, point)
    };
}

const defaultSetElementAttributes: SetElementAttributesCallback = ({ element, attributes }) => {
    element.set(attributes);
};

const defaultSetPortAttributes: SetPortAttributesCallback = ({ element, portId, attributes }) => {
    element.portProp(portId, attributes);
};

const defaultSetLinkAttributes: SetLinkAttributesCallback = ({ link, attributes }) => {
    link.set(attributes);
};

let importLayoutOptions: ImportLayoutOptions;

let elementsById: Map<string, dia.Element>;
let linksById: Map<string, dia.Link>;
let portsById: Map<string, ElkGraphPort>;

/**
 * (Re)initializes all the module-level state above for a single `importLayout` call, so
 * that no lookup table or option can leak from one call into the next.
 */
function init(
    elements: Map<string, dia.Element>,
    links: Map<string, dia.Link>,
    ports: Map<string, ElkGraphPort>,
    options: ImportLayoutOptions
): void {
    importLayoutOptions = options;

    elementsById = elements;
    linksById = links;
    portsById = ports;
}

// ELK positions a node's children relative to that node's own origin - `containerPosition`
// accumulates the offset needed to turn those relative coordinates into graph-absolute
// ones as we walk down the hierarchy. Edges need no such conversion: `layout()` defaults
// `elk.json.edgeCoords` to 'ROOT', so ELK already returns their coordinates graph-absolute.
function toAbsolute(point: ElkPoint, containerPosition: dia.Point): dia.Point {
    return {
        x: containerPosition.x + point.x,
        y: containerPosition.y + point.y
    };
}

/**
 * Applies a container's (or the root's) own ELK edges back onto their JointJS links,
 * via `setLinkAttributes` (or the default). Their coordinates are used as they are - see
 * `toAbsolute` above.
 */
function importEdges(edges: ElkExtendedEdge[] | undefined): void {
    const setLinkAttributes = importLayoutOptions.setLinkAttributes ?? defaultSetLinkAttributes;

    (edges || []).forEach((edge) => {
        const link = linksById.get(edge.id);
        if (!link) return;

        const [section] = edge.sections || [];
        if (!section) return;

        const { startPoint, endPoint, bendPoints = [] } = section;

        const vertices = bendPoints.map(({ x, y }) => ({ x, y }));

        // Which end ELK anchored on is read back from the edge itself, rather than from
        // the link: the graph may have changed while the layout was running, and an end
        // whose port `exportPort` dropped was routed to the element despite keeping it.
        const source = buildEnd(link.source(), edge.sources, startPoint);
        const target = buildEnd(link.target(), edge.targets, endPoint);

        let labels: dia.Link.Label[] | undefined;
        if (edge.labels && edge.labels.length > 0) {
            const polyline = new g.Polyline([startPoint, ...bendPoints, endPoint]);
            // `link.getComputedLabels()` (`@joint/core`) returns each label computed against
            // `defaultLabel`/the built-in default - reading `labels` (the raw model attribute)
            // directly instead, so writing `labels[index]` back below doesn't bake that
            // computed `markup`/`attrs`/`size` permanently into the label's own stored JSON.
            const currentLabels: dia.Link.Label[] = link.get('labels') || [];
            labels = currentLabels.slice();
            edge.labels.forEach((label) => {
                // Not the label's index in `edge.labels` - labels `exportLinkLabel` dropped
                // are missing there (see `getLinkLabelId`).
                const index = getLinkLabelIndex(edge.id, label.id);
                if (index === undefined || !currentLabels[index]) return;
                const { x = 0, y = 0, width = 0, height = 0 } = label;
                const center = new g.Point(x + width / 2, y + height / 2);
                const length = polyline.closestPointLength(center);
                // Get the tangent at the closest point to calculate the offset
                const tangent = polyline.tangentAtLength(length);
                const currentPosition = currentLabels[index]!.position;
                labels![index] = {
                    ...currentLabels[index],
                    position: {
                        // `angle`, `args` and any other position setting the label already
                        // had are kept - only its place along the link is ELK's to decide.
                        ...(typeof currentPosition === 'object' ? currentPosition : {}),
                        distance: toLabelDistance(length),
                        offset: tangent ? tangent.pointOffset(center) : 0
                    }
                };
            });
        }

        setLinkAttributes({
            link,
            attributes: {
                vertices,
                ...(source ? { source } : {}),
                ...(target ? { target } : {}),
                ...(labels ? { labels } : {})
            },
            elkEdge: edge
        });
    });
}

/**
 * Applies one ELK node's result (position, size, ports) back onto its JointJS element,
 * then recurses into its children and its own edges.
 */
function importNode(node: ElkNode, containerPosition: dia.Point = { x: 0, y: 0 }): void {
    const position = toAbsolute({ x: node.x || 0, y: node.y || 0 }, containerPosition);

    const element = elementsById.get(node.id);
    if (element) {
        const isContainer = !!node.children && node.children.length > 0;
        const setElementAttributes = importLayoutOptions.setElementAttributes ?? defaultSetElementAttributes;
        setElementAttributes({
            element,
            attributes: {
                position,
                // Omitted entirely for a leaf (not just `undefined`) - `attributes` goes
                // straight to `element.set(...)`, which would otherwise wipe its size.
                ...(isContainer ? { size: { width: node.width || 0, height: node.height || 0 }} : {})
            },
            elkNode: node
        });
    }

    if (node.ports) {
        const setPortAttributes = importLayoutOptions.setPortAttributes ?? defaultSetPortAttributes;

        node.ports.forEach((port) => {
            const found = portsById.get(port.id);
            if (!found) return;
            const { element, portId } = found;

            // ELK places a port just outside the node's border - clamping its center
            // into the node's bounds moves it onto the border, whichever side it is on.
            const center = {
                x: Math.min(Math.max((port.x || 0) + (port.width || 0) / 2, 0), node.width || 0),
                y: Math.min(Math.max((port.y || 0) + (port.height || 0) / 2, 0), node.height || 0)
            };

            let labelPosition: dia.Point | undefined;
            const [label] = port.labels || [];
            if (label) {
                // ELK's `label.x`/`y` are relative to the port's top-left corner, but
                // 'manual' label position expects an offset from the port's center - the
                // label keeps its place next to the port as the port moves onto the border.
                labelPosition = {
                    x: (label.x || 0) - (port.width || 0) / 2,
                    y: (label.y || 0) - (port.height || 0) / 2
                };
            }

            setPortAttributes({
                element,
                portId,
                attributes: {
                    position: {
                        args: center
                    },
                    ...(labelPosition ? {
                        label: {
                            position: {
                                args: labelPosition
                            }
                        }
                    } : {})
                },
                elkPort: port
            });
        });
    }

    (node.children || []).forEach((child) => importNode(child, position));
    importEdges(node.edges);
}

/**
 * Applies an ELK layout result back onto the JointJS graph.
 */
export function importLayout(
    elkGraph: ElkNode,
    elementsById: Map<string, dia.Element>,
    linksById: Map<string, dia.Link>,
    portsById: Map<string, ElkGraphPort>,
    options: ImportLayoutOptions
): void {

    init(elementsById, linksById, portsById, options);

    (elkGraph.children || []).forEach((node) => importNode(node));
    importEdges(elkGraph.edges);
}
