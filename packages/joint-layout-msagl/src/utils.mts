import { dia, util, g } from '@joint/core';
import {
    Graph,
    GeomGraph,
    GeomNode,
    Node,
    Curve,
    Ellipse,
    CurveFactory,
    Point,
    Size,
    Edge,
    Label,
    GeomLabel,
    SugiyamaLayoutSettings,
    BezierSeg,
    LineSegment
} from '@msagl/core';
import { IdentifiableGeomEdge } from "./IdentifiableGeomEdge.mjs";
import { type Options, EdgeRoutingMode } from './index.mjs';
import { sampleBezierSeg, sampleEllipse } from './sampling.mjs';

enum EDGE_TYPE {
    SelfEdge,
    OutEdge
}
const RECTILINEAR_SELF_EDGE_OFFSET = 10;

// --- Default Callbacks

export function setPosition(element: dia.Element, position: dia.Point) {
    element.position(position.x, position.y);
}

export function setVertices(link: dia.Link, vertices: dia.Point[]) {
    link.vertices(vertices);
}

export function setLabels(link: dia.Link, labelPosition: dia.Point, points: dia.Point[]) {

    const polyline = new g.Polyline(points);

    const linkSize = link.get('labelSize') as { width: number, height: number };

    const cx = labelPosition.x + linkSize.width / 2;
    const cy = labelPosition.y + linkSize.height / 2;

    const center = new g.Point(cx, cy);

    const distance = polyline.closestPointLength(center);
    // Get the tangent at the closest point to calculate the offset
    const tangent = polyline.tangentAtLength(distance);

    link.label(0, {
        position: {
            distance,
            offset: tangent?.pointOffset(center) || 0
        }
    });
}

export function setAnchor(link: dia.Link, referencePoint: dia.Point, bbox: dia.BBox, endType: 'source' | 'target') {
    link.prop(`${endType}/anchor`, {
        name: 'modelCenter',
        args: {
            dx: referencePoint.x - bbox.x - bbox.width / 2,
            dy: referencePoint.y - bbox.y - bbox.height / 2,
        }
    });
}

export function importJointGraph(graph: dia.Graph, msGraph: Graph) {

    // Start constructing nodes recursively
    // starting from top-level elements
    graph.getElements()
        .filter((element) => !element.parent())
        .forEach((topLevelEl) => importElement(topLevelEl, msGraph));

    graph.getLinks()
        .forEach((link) => importLink(link, msGraph));
}

function importElement(element: dia.Element, parent: Graph): Node {

    const embeds = element.getEmbeddedCells();

    if (embeds.length === 0) {
        const node = new Node(String(element.id));
        parent.addNode(node);
        const geomNode = new GeomNode(node);
        const size = element.size();
        geomNode.boundaryCurve = CurveFactory.createRectangle(size.width, size.height, new Point(0, 0));

        return node;
    }

    // Element has children therefore it is a subgraph
    const subgraph = new Graph(String(element.id));
    const geomGraph = new GeomGraph(subgraph)

    const labelSize = element.get('labelSize') as { width: number, height: number } | undefined;
    if (labelSize) {
        geomGraph.labelSize = new Size(labelSize.width, labelSize.height);
    }

    parent.addNode(subgraph);

    embeds.filter((cell) => cell.isElement()).forEach((child) => {
        importElement(child as dia.Element, subgraph);
    });

    return subgraph;
}

function importLink(link: dia.Link, msGraph: Graph) {
    const sourceNode = msGraph.findNodeRecursive(String(link.source().id));
    const targetNode = msGraph.findNodeRecursive(String(link.target().id));

    // Link either ended at a point or at an another link
    // ignore layout for such links
    if (!sourceNode || !targetNode) {
        return;
    }

    const edge = new Edge(sourceNode, targetNode);
    const geomEdge = new IdentifiableGeomEdge(edge, link.id);

    const linkLabelSize = link.get('labelSize') as { width: number, height: number } | undefined;

    // No `labelSize` provided, do not account for the link label in the layout
    if (!linkLabelSize) return;

    const label = new Label(edge);
    edge.label = label;

    const { width, height } = linkLabelSize;

    geomEdge.label = new GeomLabel(label, new Size(width, height));
}

function applyLinkLayout(
    link: dia.Link,
    geomEdge: IdentifiableGeomEdge,
    edgeType: EDGE_TYPE,
    options: Required<Options>
) {
    const { curve, source: sourceGeomNode, target: targetGeomNode, label } = geomEdge;
    const vertices: dia.Point[] = [];

    if (options.setVertices) {

        if (curve instanceof Curve) {
            if (edgeType === EDGE_TYPE.OutEdge) {
                vertices.push(...curveToVertices(curve, options.edgeRoutingMode));
            } else {
                vertices.push(...selfEdgeVertices(curve, options.edgeRoutingMode));
            }
        }

        if (util.isFunction(options.setVertices)) {
            (options.setVertices as unknown as typeof setVertices)(link, vertices);
        } else {
            setVertices(link, vertices);
        }
    }

    if (label) {
        const points = [curve.start, ...vertices, curve.end];

        if (options.setLabels) {

            const labelPosition = label.boundingBox.leftBottom;

            if (util.isFunction(options.setLabels)) {
                (options.setLabels as unknown as typeof setLabels)(link, labelPosition, points);
            } else {
                setLabels(link, labelPosition, points);
            }
        }
    }

    const { left: sx, bottom: sy, width: sourceWidth, height: sourceHeight } = sourceGeomNode.boundingBox;
    const sourceBBox = new g.Rect(sx, sy, sourceWidth, sourceHeight);

    const { left: tx, bottom: ty, width: targetWidth, height: targetHeight } = targetGeomNode.boundingBox;
    const targetBBox = new g.Rect(tx, ty, targetWidth, targetHeight);

    if (options.setAnchor) {
        if (util.isFunction(options.setAnchor)) {
            (options.setAnchor as unknown as typeof setAnchor)(link, curve.start, sourceBBox, 'source');
            (options.setAnchor as unknown as typeof setAnchor)(link, curve.end, targetBBox, 'target');
        } else {
            setAnchor(link, curve.start, sourceBBox, 'source');
            setAnchor(link, curve.end, targetBBox, 'target');
        }
    }
}

export function applyLayoutResult(graph: dia.Graph, geomGraph: GeomGraph, options: Required<Options>) {

    for (const geomNode of geomGraph.shallowNodes) {
        const { id } = geomNode;
        const { left: x, bottom: y } = geomNode.boundingBox;

        const element = graph.getCell(id) as dia.Element;
        const position = { x, y };

        options.setPosition(element, position);

        // Note: If the node is a subgraph, its size has been modified
        // when packing its children, so we need to set it explicitly
        if (geomNode.node instanceof Graph) {
            element.size(geomNode.boundingBox.width, geomNode.boundingBox.height);
        }

        const selfEdges = Array.from(geomNode.selfEdges());
        for (let i = 0; i < selfEdges.length; i++) {
            const geomEdge = selfEdges[i] as IdentifiableGeomEdge;
            const link = graph.getCell(geomEdge.id) as dia.Link;
            applyLinkLayout(link, geomEdge, EDGE_TYPE.SelfEdge, options);
        }

        const outEdges = Array.from(geomNode.outEdges());
        for (let i = 0; i < outEdges.length; i++) {
            const geomEdge = outEdges[i] as IdentifiableGeomEdge;
            const link = graph.getCell(geomEdge.id) as dia.Link;
            applyLinkLayout(link, geomEdge, EDGE_TYPE.OutEdge, options);
        }
    }

    // Recursively apply layout to subgraphs
    for (const cluster of geomGraph.Clusters) {
        applyLayoutResult(graph, cluster as GeomGraph, options);
    }
}

export function buildLayoutSettings(options: Required<Options>): SugiyamaLayoutSettings {

    const layoutSettings = new SugiyamaLayoutSettings();
    const { layerSeparation, nodeSeparation, layerDirection, polylinePadding,gridSize, edgeRoutingMode } = options;

    if (util.isNumber(layerSeparation)) {
        layoutSettings.LayerSeparation = layerSeparation;
    }

    if (util.isNumber(nodeSeparation)) {
        layoutSettings.commonSettings.NodeSeparation = nodeSeparation;
    }

    if (util.isNumber(gridSize)) {
        layoutSettings.GridSizeByX = gridSize;
        layoutSettings.GridSizeByY = gridSize;
    }

    if (util.isNumber(polylinePadding)) {
        layoutSettings.edgeRoutingSettings.polylinePadding = polylinePadding;
    }

    layoutSettings.layerDirection = layerDirection;
    layoutSettings.edgeRoutingSettings.EdgeRoutingMode = edgeRoutingMode;

    return layoutSettings;
}

function curveToVertices(curve: Curve, edgeRoutingMode: EdgeRoutingMode): dia.Point[] {
    const vertices = [];

    if (edgeRoutingMode === EdgeRoutingMode.Rectilinear) {
        // Ellipses are the corners of links, JointJS will handle connecting the generated
        // vertices with straight lines
        const ellipses = curve.segs.filter((curve) => curve instanceof Ellipse);
        for (const ellipse of ellipses) {
            vertices.push(...rectilinearRouteMapper(ellipse));
        }
    } else {
        const curves = curve.segs.filter((curve) => !(curve instanceof LineSegment)) as (BezierSeg | Ellipse)[];
        for (const curve of curves) {
            vertices.push(...splineBundlingRouteMapper(curve));
        }
    }

    // return new g.Polyline(vertices).simplify({ threshold: 0.001 }).points;
    return vertices;
}

function selfEdgeVertices(curve: Curve, edgeRoutingMode: EdgeRoutingMode): dia.Point[] {
    // If the routing mode is rectilinear, we create the vertices for the link ourselves
    if (edgeRoutingMode === EdgeRoutingMode.Rectilinear) {
        const { start, end } = curve;
        return [
            { x: start.x, y: start.y + RECTILINEAR_SELF_EDGE_OFFSET },
            { x: end.x, y: end.y + RECTILINEAR_SELF_EDGE_OFFSET }
        ];
    } else {
        return curveToVertices(curve, edgeRoutingMode);
    }
}

function rectilinearRouteMapper(curve: Ellipse): dia.Point[] {
    // Replace all ellipses along the curve with the sum of the start and the bAxis
    return [curve.start.add(curve.bAxis)];
}

function splineBundlingRouteMapper(segment: Ellipse | BezierSeg): dia.Point[] {
    return segment instanceof Ellipse ? sampleEllipse(segment) : sampleBezierSeg(segment);
}
