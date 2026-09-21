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
    attributes: {
        position: dia.Point;
        // Present only when `positionPortLabels` is enabled and the port has a label.
        labelPosition?: dia.Point;
    };
};

export type SetLinkAttributesCallback = (params: SetLinkAttributesCallbackParameters) => void;
export type SetLinkAttributesCallbackParameters = {
    link: dia.Link;
    attributes: {
        vertices: dia.Point[];
        // Present only for an end not already connected to a port - a port-connected
        // end already has the anchor JointJS itself computed for that port (the same
        // position ELK was told to route to), so it does not need overriding.
        sourceAnchor?: dia.Point;
        targetAnchor?: dia.Point;
        // Present only when `edgeLabels` is enabled and the link has labels.
        labels?: SetLinkAttributesLabelParameters[];
    };
};
export type SetLinkAttributesLabelParameters = {
    index: number;
    bbox: dia.BBox;
    points: dia.Point[];
};

/**
 * Controls how freely ELK may reposition a port along its element - maps directly
 * onto ELK's own `elk.portConstraints` (see https://eclipse.dev/elk/reference/options/org-eclipse-elk-portConstraints.html):
 * - `'fixed'` (default) - the port stays exactly where JointJS's own port groups
 *   already place it; ELK only uses that position to route edges to/from it
 *   (`FIXED_POS`).
 * - `'fixed-side'` - ELK may reposition (and reorder) the port along the side its
 *   group already assigns it to, e.g. to minimize edge crossings (`FIXED_SIDE`).
 * - `'free'` - ELK may reposition the port anywhere around its element, including
 *   onto a different side than its group's (`FREE`).
 */
export type PortsPositionMode = 'fixed' | 'fixed-side' | 'free';

export interface ImportLayoutOptions {
    setElementAttributes?: SetElementAttributesCallback;
    setLinkAttributes?: SetLinkAttributesCallback;
    setPortAttributes?: SetPortAttributesCallback;
    /**
     * Whether to account for link labels during layout and position them
     * along the routed link afterwards.
     * @defaultValue true
     */
    edgeLabels?: boolean;
    /**
     * How freely ELK may reposition (and reorder) ports along their element,
     * instead of keeping them at the position JointJS itself already computed
     * for them - see `PortsPositionMode`. When set to anything other than
     * `'fixed'`, every port's owning group is switched to an `'absolute'`
     * position (preserving its `attrs`/`markup`/`label`) so the position ELK
     * computed for it can be applied.
     * @defaultValue 'fixed'
     */
    portsPosition?: PortsPositionMode;
    /**
     * Whether to let ELK reposition port labels along their port, instead of keeping
     * them at the position JointJS itself already computed for them (via the port
     * group's `label`). When enabled, every port's owning group's label is switched
     * to a `'manual'` position (preserving its `attrs`/`markup`) so the position ELK
     * computed for it can be applied.
     * @defaultValue false
     */
    positionPortLabels?: boolean;
}

function setLinkAnchor(link: dia.Link, element: dia.Element, point: dia.Point, endType: 'source' | 'target'): void {
    const delta = element.getRelativePointFromAbsolute(point);
    link.prop(`${endType}/anchor`, {
        name: 'topLeft',
        args: {
            dx: delta.x,
            dy: delta.y,
            useModelGeometry: true
        }
    });
}

const defaultSetElementAttributes: SetElementAttributesCallback = ({ element, attributes }) => {
    element.position(attributes.position.x, attributes.position.y);
    if (attributes.size) {
        element.resize(attributes.size.width, attributes.size.height);
    }
};

const defaultSetPortAttributes: SetPortAttributesCallback = ({ element, portId, attributes }) => {
    const { group } = element.getPort(portId);

    // With `portsPosition` 'fixed' (the default), a port already stays exactly where
    // JointJS's own port groups place it - ELK was only told where that is, not asked
    // to move it - so there is nothing to apply back, and the group keeps its own
    // position type (e.g. 'left') instead of being replaced with a fixed 'absolute' one.
    if ((importLayoutOptions.portsPosition ?? 'fixed') !== 'fixed') {
        if (group !== undefined) {
            // Every port ends up with a computed position (all of an element's ports are
            // exported), so switching the whole group to `'absolute'` is safe here - it
            // only replaces the group's `position`, leaving its `attrs`/`markup`/`label` intact.
            element.prop(['ports', 'groups', group, 'position'], { name: 'absolute' });
        }
        element.portProp(portId, ['position', 'args'], attributes.position);
    }

    if (attributes.labelPosition) {
        if (group !== undefined) {
            // Every positioned port label ends up with a computed position (only ports whose
            // group defines a `label` are exported, but all of those are), so switching the
            // whole group's label to `'manual'` is safe here - it only replaces the group
            // label's `position`, leaving its `attrs`/`markup` intact.
            element.prop(['ports', 'groups', group, 'label', 'position'], { name: 'manual' });
        }
        element.portProp(portId, ['label', 'position', 'args'], attributes.labelPosition);
    }
};

const defaultSetLinkAttributes: SetLinkAttributesCallback = ({ link, attributes }) => {
    link.vertices(attributes.vertices);

    if (attributes.sourceAnchor) {
        setLinkAnchor(link, link.getSourceElement() as dia.Element, attributes.sourceAnchor, 'source');
    }
    if (attributes.targetAnchor) {
        setLinkAnchor(link, link.getTargetElement() as dia.Element, attributes.targetAnchor, 'target');
    }

    attributes.labels?.forEach(({ index, bbox, points }) => {
        const polyline = new g.Polyline(points);

        const { x, y, width, height } = bbox;
        const center = new g.Point(x + width / 2, y + height / 2);

        const distance = polyline.closestPointLength(center);
        // Get the tangent at the closest point to calculate the offset
        const tangent = polyline.tangentAtLength(distance);

        link.label(index, {
            position: {
                distance,
                offset: tangent ? tangent.pointOffset(center) : 0
            }
        });
    });
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

        // A port-connected end already has the anchor JointJS itself computed for that
        // port (the same position ELK was told to route to) - it does not need overriding.
        const sourceAnchor = (link.source().port) ? undefined : toAbsolute(startPoint, containerPosition);
        const targetAnchor = (link.target().port) ? undefined : toAbsolute(endPoint, containerPosition);

        let labels: SetLinkAttributesLabelParameters[] | undefined;
        if (importLayoutOptions.edgeLabels && edge.labels && edge.labels.length > 0) {
            const points = [startPoint, ...bendPoints, endPoint]
                .map((point) => toAbsolute(point, containerPosition));
            labels = edge.labels.map((label, index) => {
                const { x = 0, y = 0, width = 0, height = 0 } = label;
                return {
                    index,
                    bbox: { x: containerPosition.x + x, y: containerPosition.y + y, width, height },
                    points
                };
            });
        }

        setLinkAttributes({ link, attributes: { vertices, sourceAnchor, targetAnchor, labels }});
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
                // A container's size is computed by ELK to fit its (recursively laid out) content.
                size: (isContainer) ? { width: node.width || 0, height: node.height || 0 } : undefined
            }
        });
    }

    if (node.ports) {
        const setPortAttributes = importLayoutOptions.setPortAttributes ?? defaultSetPortAttributes;
        node.ports.forEach((port) => {
            const found = portsById.get(port.id);
            if (!found) return;

            let labelPosition: dia.Point | undefined;
            if (importLayoutOptions.positionPortLabels) {
                const [label] = port.labels || [];
                if (label) {
                    labelPosition = { x: label.x || 0, y: label.y || 0 };
                }
            }

            setPortAttributes({
                element: found.element,
                portId: found.portId,
                attributes: { position: { x: port.x || 0, y: port.y || 0 }, labelPosition }
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
