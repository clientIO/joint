import { type dia, g } from '@joint/core';
import type { ElkPoint } from 'elkjs';
import type { ElkNode, ElkExtendedEdge } from './types/index.mjs';
import type { ElkGraphPort } from './export.mjs';

export type SetElementAttributesCallback = (params: SetElementAttributesCallbackParameters) => void;
export type SetElementAttributesCallbackParameters = {
    element: dia.Element;
    attributes: {
        position: dia.Point;
        // Present only for a container - its size is computed by ELK to fit its
        // (recursively laid out) content; a leaf element keeps its existing size.
        size?: dia.Size;
    };
};

export type SetPortAttributesCallback = (params: SetPortAttributesCallbackParameters) => void;
export type SetPortAttributesCallbackParameters = {
    element: dia.Element;
    portId: string;
    // Shaped for `element.portProp(portId, attributes)` - only the port's own
    // `position.args`/`label.position.args` (a group's `position`/`label.position`
    // decides which layout function reads them - handled separately, see `importNode`).
    attributes: {
        // Present only when `portsPosition` is not 'fixed' - nothing to apply otherwise.
        position?: { args: dia.Point };
        // Present only when `positionPortLabels` is enabled and the port has a label.
        label?: { position: { args: dia.Point } };
    };
};

export type SetLinkAttributesCallback = (params: SetLinkAttributesCallbackParameters) => void;
export type SetLinkAttributesCallbackParameters = {
    link: dia.Link;
    // Shaped for `link.set(attributes)`.
    attributes: {
        vertices: dia.Point[];
        // Present only for an end not already connected to a port - carries the end's
        // existing `id`/`port`/... alongside the new `anchor`, since `link.set(...)`
        // replaces `source`/`target` outright rather than merging into them.
        source?: dia.Link.EndJSON;
        target?: dia.Link.EndJSON;
        // Present only when `edgeLabels` is enabled and the link has labels - the whole
        // current `labels` array, with each routed label's `position` replaced.
        labels?: dia.Link.Label[];
    };
};

export interface ImportLayoutOptions {
    setElementAttributes?: SetElementAttributesCallback;
    setLinkAttributes?: SetLinkAttributesCallback;
    setPortAttributes?: SetPortAttributesCallback;
}

// The anchor for a link end not connected to a port - computed the same way JointJS
// computes one for a port-connected end, so both react the same way to future moves.
function getPortlessEndAnchor(element: dia.Element, point: dia.Point): NonNullable<dia.Link.EndCellArgs['anchor']> {
    const delta = element.getRelativePointFromAbsolute(point);
    return {
        name: 'topLeft',
        args: {
            dx: delta.x,
            dy: delta.y,
            useModelGeometry: true
        }
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

// ELK positions a node's children (and routes a node's own edges) relative to that
// node's own origin - `containerPosition` accumulates the offset needed to turn those
// relative coordinates into graph-absolute ones as we walk down the hierarchy.
function toAbsolute(point: ElkPoint, containerPosition: dia.Point): dia.Point {
    return {
        x: containerPosition.x + point.x,
        y: containerPosition.y + point.y
    };
}

function importEdges(edges: ElkExtendedEdge[] | undefined, containerPosition: dia.Point = { x: 0, y: 0 }): void {
    const setLinkAttributes = importLayoutOptions.setLinkAttributes ?? defaultSetLinkAttributes;

    (edges || []).forEach((edge) => {
        const link = linksById.get(edge.id);
        if (!link) return;

        const [section] = edge.sections || [];
        if (!section) return;

        const { startPoint, endPoint, bendPoints = [] } = section;

        const vertices = bendPoints.map((point) => toAbsolute(point, containerPosition));

        // A port-connected end already has its anchor computed by JointJS - no override
        // needed. The end's existing `id`/`port` is kept, since `.set()` replaces it outright.
        const currentSource = link.source();
        const source = (currentSource.port) ? undefined : {
            ...currentSource,
            anchor: getPortlessEndAnchor(link.getSourceElement() as dia.Element, toAbsolute(startPoint, containerPosition))
        };
        const currentTarget = link.target();
        const target = (currentTarget.port) ? undefined : {
            ...currentTarget,
            anchor: getPortlessEndAnchor(link.getTargetElement() as dia.Element, toAbsolute(endPoint, containerPosition))
        };

        let labels: dia.Link.Label[] | undefined;
        if (edge.labels && edge.labels.length > 0) {
            const points = [startPoint, ...bendPoints, endPoint]
                .map((point) => toAbsolute(point, containerPosition));
            const polyline = new g.Polyline(points);
            // `link.labels()` returns each label resolved against `defaultLabel`/the built-in
            // default (`@joint/core`) - reading `labels` (the raw model attribute) directly
            // instead, so writing `labels[index]` back below doesn't bake that resolved
            // `markup`/`attrs`/`size` permanently into the label's own stored JSON.
            const currentLabels: dia.Link.Label[] = link.get('labels') || [];
            labels = currentLabels.slice();
            edge.labels.forEach((label, index) => {
                const { x = 0, y = 0, width = 0, height = 0 } = label;
                const center = new g.Point(containerPosition.x + x + width / 2, containerPosition.y + y + height / 2);
                const distance = polyline.closestPointLength(center);
                // Get the tangent at the closest point to calculate the offset
                const tangent = polyline.tangentAtLength(distance);
                labels![index] = {
                    ...currentLabels[index],
                    position: {
                        distance,
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
            }
        });
    });
}

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
            }
        });
    }

    if (node.ports) {
        const setPortAttributes = importLayoutOptions.setPortAttributes ?? defaultSetPortAttributes;

        node.ports.forEach((port) => {
            const found = portsById.get(port.id);
            if (!found) return;
            const { element, portId } = found;

            let labelPosition: dia.Point | undefined;
            const [label] = port.labels || [];
            if (label) {
                // ELK's `label.x`/`y` are relative to the port's top-left corner, but
                // 'manual' label position expects an offset from the port's *center*.
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
                        args: {
                            x: (port.x || 0) + (port.width || 0) / 2,
                            y: (port.y || 0) + (port.height || 0) / 2
                        }
                    },
                    ...(labelPosition ? {
                        label: {
                            position: {
                                args: labelPosition
                            }
                        }
                    } : {})
                }
            });
        });
    }

    (node.children || []).forEach((child) => importNode(child, position));
    importEdges(node.edges, position);
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
