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
import { IdentifiableGeomEdge } from './IdentifiableGeomEdge.mjs';
import type { Options } from './types.mjs';
import { EdgeRoutingMode } from './enums.mjs';
import { sampleBezierSeg, sampleEllipse } from './sampling.mjs';
import { setVertices, setLabels, setAnchor } from './defaults.mjs';

enum EDGE_TYPE {
    SelfEdge,
    OutEdge
}

export function importJointGraph(graph: dia.Graph, msGraph: Graph, options: Required<Options>) {

    // Start constructing nodes recursively
    // starting from top-level elements
    graph.getElements()
        .filter((element) => !element.parent())
        .forEach((topLevelEl) => importElement(topLevelEl, msGraph, options));

    graph.getLinks()
        .forEach((link) => importLink(link, msGraph, options));
}

function importElement(element: dia.Element, parent: Graph, options: Required<Options>): Node {

    const embeds = element.getEmbeddedCells();

    if (embeds.length === 0) {
        const node = new Node(String(element.id));
        parent.addNode(node);
        const geomNode = new GeomNode(node);
        const size = options.getSize(element);
        geomNode.boundaryCurve = CurveFactory.createRectangle(size.width, size.height, new Point(0, 0));

        return node;
    }

    // Element has children therefore it is a subgraph
    const subgraph = new Graph(String(element.id));
    const geomGraph = new GeomGraph(subgraph);

    const labelSize = options.getLabelSize(element);
    if (labelSize) {
        geomGraph.labelSize = new Size(labelSize.width, labelSize.height);
    }

    parent.addNode(subgraph);

    embeds.filter((cell) => cell.isElement()).forEach((child) => {
        importElement(child as dia.Element, subgraph, options);
    });

    return subgraph;
}

function importLink(link: dia.Link, msGraph: Graph, options: Required<Options>) {
    const sourceNode = msGraph.findNodeRecursive(String(link.source().id));
    const targetNode = msGraph.findNodeRecursive(String(link.target().id));

    // Link either ended at a point or at an another link
    // ignore layout for such links
    if (!sourceNode || !targetNode) {
        return;
    }

    const edge = new Edge(sourceNode, targetNode);
    const geomEdge = new IdentifiableGeomEdge(edge, link.id);

    const linkLabelSize = options.getLabelSize(link);

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
                vertices.push(...selfEdgeVertices(curve, options.edgeRoutingMode, options.rectilinearSelfEdgeOffset));
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

            const { leftBottom } = label.boundingBox;
            const labelBBox = {
                x: leftBottom.x,
                y: leftBottom.y,
                width: label.boundingBox.width,
                height: label.boundingBox.height
            };

            if (util.isFunction(options.setLabels)) {
                (options.setLabels as unknown as typeof setLabels)(link, labelBBox, points);
            } else {
                setLabels(link, labelBBox, points);
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
            options.setClusterSize(element, { width: geomNode.boundingBox.width, height: geomNode.boundingBox.height });
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

    return vertices;
}

function selfEdgeVertices(curve: Curve, edgeRoutingMode: EdgeRoutingMode, rectilinearSelfEdgeOffset: number): dia.Point[] {
    // If the routing mode is rectilinear, we create the vertices for the link ourselves
    if (edgeRoutingMode === EdgeRoutingMode.Rectilinear) {
        const { start, end } = curve;
        return [
            { x: start.x, y: start.y + rectilinearSelfEdgeOffset },
            { x: end.x, y: end.y + rectilinearSelfEdgeOffset }
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
