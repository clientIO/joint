import { type dia, g } from '@joint/core';
import type { ElkPoint } from 'elkjs';
import type { ElkNode, ElkExtendedEdge } from './elkOptions.mjs';
import type { ElkGraphPort } from './export.mjs';

type SetPositionCallback = (element: dia.Element, position: dia.Point) => void;
type SetVerticesCallback = (link: dia.Link, vertices: dia.Point[]) => void;
type SetAnchorCallback = (link: dia.Link, element: dia.Element, point: dia.Point, endType: 'source' | 'target') => void;
type SetLabelsCallback = (link: dia.Link, labelBBox: dia.BBox, points: dia.Point[], labelIndex: number) => void;
type SetPortPositionCallback = (element: dia.Element, portId: string, position: dia.Point) => void;
type SetPortLabelPositionCallback = (element: dia.Element, portId: string, position: dia.Point) => void;

export interface EdgeLabelsOptions {
    /**
     * Sets a link label's position, based on the ELK edge label.
     * Only takes effect when `edgeLabels` is enabled.
     * @example
     * setLabels: (link, labelBBox, points, labelIndex) => link.label(labelIndex, {
     *   position: { distance: 0, offset: 0 }
     * });
     */
    setLabels?: SetLabelsCallback;
}

export interface PortPositionsOptions {
    /**
     * Sets a port's position, based on the ELK port's layout result.
     * Only takes effect when `positionPorts` is enabled.
     * @example
     * setPortPosition: (element, portId, position) => element.portProp(portId, ['position', 'args'], position)
     */
    setPortPosition?: SetPortPositionCallback;
}

export interface PortLabelPositionsOptions {
    /**
     * Sets a port label's position, based on the ELK port label's layout result.
     * Only takes effect when `positionPortLabels` is enabled.
     * @example
     * setPortLabelPosition: (element, portId, position) => element.portProp(portId, ['label', 'position', 'args'], position)
     */
    setPortLabelPosition?: SetPortLabelPositionCallback;
}

export interface ImportLayoutOptions {
    /**
     * Specify a function to use when setting a new position to an element after layout
     * instead of the default `element.position(x, y)`.
     * @example
     * setPosition: (el, pos) => el.position(pos.x, pos.y)
     */
    setPosition?: SetPositionCallback;
    /**
     * Specify a function to use when setting new vertices to a link after layout
     * instead of the default `link.vertices(vertices)`.
     * @example
     * setVertices: (link, vertices) => link.vertices(vertices)
     */
    setVertices?: SetVerticesCallback;
    /**
     * Specify a function to use when setting a link's anchor at either source or target, based on the start/end
     * point of the ELK edge section instead of the default `topLeft` anchor. Not called for a link end that is
     * connected to a port - ports keep the anchor JointJS already gives them.
     * @example
     * setAnchor: (link, element, point, endType) => {
     *   const delta = element.getRelativePointFromAbsolute(point);
     *   link.prop(`${endType}/anchor`, {
     *     name: 'topLeft',
     *     args: {
     *       dx: delta.x,
     *       dy: delta.y,
     *       useModelGeometry: true
     *     }
     *   });
     * }
     */
    setAnchor?: SetAnchorCallback;
    /**
     * Whether to account for link labels during layout and position them
     * along the routed link afterwards.
     * @defaultValue true
     */
    edgeLabels?: boolean | EdgeLabelsOptions;
    /**
     * Whether to let ELK reposition (and reorder) ports along their element,
     * instead of keeping them at the position JointJS itself already computed
     * for them. When enabled, every port's owning group is switched to an
     * `'absolute'` position (preserving its `attrs`/`markup`/`label`) so the
     * position ELK computed for it can be applied.
     * @defaultValue false
     */
    positionPorts?: boolean | PortPositionsOptions;
    /**
     * Whether to let ELK reposition port labels along their port, instead of keeping
     * them at the position JointJS itself already computed for them (via the port
     * group's `label`). When enabled, every port's owning group's label is switched
     * to a `'manual'` position (preserving its `attrs`/`markup`) so the position ELK
     * computed for it can be applied.
     * @defaultValue false
     */
    positionPortLabels?: boolean | PortLabelPositionsOptions;
}

const defaultSetPosition = (element: dia.Element, position: dia.Point) => {
    element.position(position.x, position.y);
};

const defaultSetVertices = (link: dia.Link, vertices: dia.Point[]) => {
    link.vertices(vertices);
};

const defaultSetAnchor = (link: dia.Link, element: dia.Element, point: dia.Point, endType: 'source' | 'target') => {
    const delta = element.getRelativePointFromAbsolute(point);
    link.prop(`${endType}/anchor`, {
        name: 'topLeft',
        args: {
            dx: delta.x,
            dy: delta.y,
            useModelGeometry: true
        }
    });
};

const defaultSetPortPosition = (element: dia.Element, portId: string, position: dia.Point) => {
    const { group } = element.getPort(portId);
    if (group !== undefined) {
        // Every port ends up with a computed position (all of an element's ports are
        // exported), so switching the whole group to `'absolute'` is safe here - it
        // only replaces the group's `position`, leaving its `attrs`/`markup`/`label` intact.
        element.prop(['ports', 'groups', group, 'position'], { name: 'absolute' });
    }
    element.portProp(portId, ['position', 'args'], position);
};

const defaultSetPortLabelPosition = (element: dia.Element, portId: string, position: dia.Point) => {
    const { group } = element.getPort(portId);
    if (group !== undefined) {
        // Every positioned port label ends up with a computed position (only ports whose
        // group defines a `label` are exported, but all of those are), so switching the
        // whole group's label to `'manual'` is safe here - it only replaces the group
        // label's `position`, leaving its `attrs`/`markup` intact.
        element.prop(['ports', 'groups', group, 'label', 'position'], { name: 'manual' });
    }
    element.portProp(portId, ['label', 'position', 'args'], position);
};

const defaultSetLabels = (link: dia.Link, labelBBox: dia.BBox, points: dia.Point[], labelIndex: number) => {

    const polyline = new g.Polyline(points);

    const { x, y, width, height } = labelBBox;
    const center = new g.Point(x + width / 2, y + height / 2);

    const distance = polyline.closestPointLength(center);
    // Get the tangent at the closest point to calculate the offset
    const tangent = polyline.tangentAtLength(distance);

    link.label(labelIndex, {
        position: {
            distance,
            offset: tangent ? tangent.pointOffset(center) : 0
        }
    });
};

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

    const setPositionFn = options.setPosition ?? defaultSetPosition;
    const setVerticesFn = options.setVertices ?? defaultSetVertices;
    const setAnchorFn = options.setAnchor ?? defaultSetAnchor;

    let setPortPositionFn: SetPortPositionCallback | undefined;
    if (options.positionPorts) {
        setPortPositionFn = defaultSetPortPosition;

        if (typeof options.positionPorts === 'object') {
            setPortPositionFn = options.positionPorts.setPortPosition ?? defaultSetPortPosition;
        }
    }

    let setPortLabelPositionFn: SetPortLabelPositionCallback | undefined;
    if (options.positionPortLabels) {
        setPortLabelPositionFn = defaultSetPortLabelPosition;

        if (typeof options.positionPortLabels === 'object') {
            setPortLabelPositionFn = options.positionPortLabels.setPortLabelPosition ?? defaultSetPortLabelPosition;
        }
    }

    let setLabelsFn: SetLabelsCallback | undefined;
    if (options.edgeLabels) {
        setLabelsFn = defaultSetLabels;

        if (typeof options.edgeLabels === 'object') {
            setLabelsFn = options.edgeLabels.setLabels ?? defaultSetLabels;
        }
    }

    // ELK positions a node's children (and routes a node's own edges) relative to that
    // node's own origin - `containerX`/`containerY` accumulate the offset needed to turn
    // those relative coordinates into graph-absolute ones as we walk down the hierarchy.
    const toAbsolute = (point: ElkPoint, containerX: number, containerY: number): dia.Point => ({
        x: containerX + point.x,
        y: containerY + point.y
    });

    function importEdges(edges: ElkExtendedEdge[] | undefined, containerX: number, containerY: number): void {
        (edges || []).forEach((edge) => {
            const link = linksById.get(edge.id);
            if (!link) return;

            const [section] = edge.sections || [];
            if (!section) return;

            const { startPoint, endPoint, bendPoints = [] } = section;

            setVerticesFn(link, bendPoints.map((point) => toAbsolute(point, containerX, containerY)));

            const sourceElement = link.getSourceElement() as dia.Element;
            const targetElement = link.getTargetElement() as dia.Element;

            // A port-connected end already has the anchor JointJS itself computed for that
            // port (the same position ELK was told to route to) - it does not need overriding.
            if (!link.source().port) {
                setAnchorFn(link, sourceElement, toAbsolute(startPoint, containerX, containerY), 'source');
            }
            if (!link.target().port) {
                setAnchorFn(link, targetElement, toAbsolute(endPoint, containerX, containerY), 'target');
            }

            if (setLabelsFn && edge.labels && edge.labels.length > 0) {
                const points = [startPoint, ...bendPoints, endPoint]
                    .map((point) => toAbsolute(point, containerX, containerY));
                edge.labels.forEach((label, labelIndex) => {
                    const { x = 0, y = 0, width = 0, height = 0 } = label;
                    setLabelsFn?.(link, { x: containerX + x, y: containerY + y, width, height }, points, labelIndex);
                });
            }
        });
    }

    function importNode(node: ElkNode, containerX: number, containerY: number): void {
        const x = containerX + (node.x || 0);
        const y = containerY + (node.y || 0);

        const element = elementsById.get(node.id);
        if (element) {
            setPositionFn(element, { x, y });
            if (node.children && node.children.length > 0) {
                // A container - ELK computed its size to fit its (recursively laid out) content.
                element.resize(node.width || 0, node.height || 0);
            }
        }

        if ((setPortPositionFn || setPortLabelPositionFn) && node.ports) {
            node.ports.forEach((port) => {
                const found = portsById.get(port.id);
                if (!found) return;

                if (setPortPositionFn) {
                    setPortPositionFn(found.element, found.portId, {
                        x: port.x || 0,
                        y: port.y || 0
                    });
                }

                if (setPortLabelPositionFn) {
                    const [label] = port.labels || [];
                    if (label) {
                        setPortLabelPositionFn(found.element, found.portId, {
                            x: label.x || 0,
                            y: label.y || 0
                        });
                    }
                }
            });
        }

        (node.children || []).forEach((child) => importNode(child, x, y));
        importEdges(node.edges, x, y);
    }

    (elkGraph.children || []).forEach((node) => importNode(node, 0, 0));
    importEdges(elkGraph.edges, 0, 0);
}
