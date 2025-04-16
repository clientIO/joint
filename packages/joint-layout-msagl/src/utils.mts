import { dia, util, g } from '@joint/core';
import { Graph, GeomGraph, GeomNode, Node, Curve, Ellipse, CurveFactory, Point, Size, Edge, Label, GeomLabel, SugiyamaLayoutSettings } from '@msagl/core';
import { IdentifiableGeomEdge } from "./IdentifiableGeomEdge.mjs";
import { type Options, EdgeRoutingMode } from './index.mjs';

// --- Default Callbacks

export function setPosition(element: dia.Element, position: g.Point) {
    element.position(position.x, position.y);
}

export function setVertices(link: dia.Link, vertices: g.Point[]) {
    link.vertices(vertices);
}

export function setLabels(link: dia.Link, labelPosition: dia.Point, points: dia.Point[]) {

    const polyline = new g.Polyline(points);

    const length = polyline.closestPointLength(labelPosition);
    const closestPoint = polyline.pointAtLength(length);
    const distance = (length / polyline.length());
    const offset = new g.Point(labelPosition).difference(closestPoint!);
    link.label(0, {
        position: {
            distance,
            offset
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
    options: Required<Options>
) {
    const { curve, source: sourceGeomNode, target: targetGeomNode, label } = geomEdge;

    if (options.setVertices) {

        const vertices: g.Point[] = [];
        if (curve instanceof Curve) {
            vertices.push(...curveToVertices(curve, options.edgeRoutingMode));
        }

        if (util.isFunction(options.setVertices)) {
            (options.setVertices as unknown as typeof setVertices)(link, vertices);
        } else {
            setVertices(link, vertices);
        }
    }

    if (label) {
        const points = [curve.start, ...link.vertices(), curve.end];

        if (options.setLabels) {

            const labelPosition = label.boundingBox.leftTop;

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
        const position = new g.Point(x, y);

        options.setPosition(element, position);

        // If the node is a subgraph, its size has been modified
        // when packing its children, so we need to set it explicitly
        if (geomNode.node instanceof Graph) {
            element.size(geomNode.boundingBox.width, geomNode.boundingBox.height);
        }

        // Get all self edges and convert to array
        const selfEdges = Array.from(geomNode.selfEdges());
        for (let i = 0; i < selfEdges.length; i++) {
            const geomEdge = selfEdges[i] as IdentifiableGeomEdge;
            const link = graph.getCell(geomEdge.id) as dia.Link;

            applyLinkLayout(link, geomEdge, options);
        }

        const outEdges = Array.from(geomNode.outEdges());
        for (let i = 0; i < outEdges.length; i++) {
            const geomEdge = outEdges[i] as IdentifiableGeomEdge;
            const link = graph.getCell(geomEdge.id) as dia.Link;
            applyLinkLayout(link, geomEdge, options);
        }
    }

    // Recursively apply layout to subgraphs
    for (const cluster of geomGraph.Clusters) {
        applyLayoutResult(graph, cluster as GeomGraph, options);
    }
}

export function buildLayoutSettings(options: Required<Options>): SugiyamaLayoutSettings {

    const layoutSettings = new SugiyamaLayoutSettings();
    const { layerSeparation, nodeSeparation, layerDirection, gridSize, edgeRoutingMode } = options;

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

    layoutSettings.layerDirection = layerDirection;
    layoutSettings.edgeRoutingSettings.EdgeRoutingMode = edgeRoutingMode;

    return layoutSettings;
}

function curveToVertices(curve: Curve, edgeRoutingMode: EdgeRoutingMode): g.Point[] {
    const vertices = [];

    // Ellipses are the corners of links, JointJS will handle connecting the generated
    // vertices with straight lines
    const ellipses = curve.segs.filter((seg) => seg instanceof Ellipse) as Ellipse[];

    // const iterateeFunction = edgeRoutingMode === EdgeRoutingMode.Rectilinear ? rectilinearRouteMapper : splineBundlingRouteMapper;
    const iterateeFunction = edgeRoutingMode === EdgeRoutingMode.Rectilinear ? rectilinearRouteMapper : splineBundlingRouteMapper;

    for (const ellipse of ellipses) {
        vertices.push(...iterateeFunction(ellipse));
    }

    return new g.Polyline(vertices).simplify({ threshold: 0.001 }).points;
}

function rectilinearRouteMapper(ellipse: Ellipse): dia.Point[] {
    // Replace all ellipses along the curve with the sum of the start and the bAxis
    return [ellipse.start.add(ellipse.bAxis)];
}

function splineBundlingRouteMapper(ellipse: Ellipse): dia.Point[] {
    const middleParameter = (ellipse.parStart + ellipse.parEnd) / 2;
    return [ellipse.start, ellipse.value(middleParameter), ellipse.end];
}
