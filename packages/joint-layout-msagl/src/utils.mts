import { dia, util, g } from '@joint/core';
import { Graph, GeomGraph, GeomNode, Node, Curve, Ellipse, CurveFactory, Point, Rectangle, Size, Edge, Label, GeomLabel, SugiyamaLayoutSettings } from '@msagl/core';
import { IdentifiableGeomEdge } from "./IdentifiableGeomEdge.mjs";
import { type Options, EdgeRoutingMode } from './index.mjs';

export function processJointGraph(graph: dia.Graph, msGraph: Graph) {

    // Start constructing nodes recursively
    // starting from top-level elements
    graph.getElements()
        .filter((element) => !element.parent())
        .forEach((topLevelEl) => {
            constructNode(topLevelEl, msGraph);
        });

    graph.getLinks()
        .forEach((link) => {
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
        });
}

export function constructNode(element: dia.Element, parent: Graph): Node {

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
        constructNode(child as dia.Element, subgraph);
    });

    return subgraph;
}

export function getAnchor(point: Point, bbox: Rectangle) {

    const { x, y } = point;
    const { left: elX, bottom: elY } = bbox;

    return {
        name: 'modelCenter',
        args: {
            dx: x - elX - bbox.width / 2,
            dy: y - elY - bbox.height / 2,
        },
    }
}

export function setLinkLabel(link: dia.Link, polyline: g.Polyline, label: GeomLabel) {

    const { x, y } = label.boundingBox.center;
    const point = new g.Point(x, y);

    const distance = polyline.closestPointLength(point);
    // Get the tangent at the closest point to calculate the offset
    const tangent = polyline.tangentAtLength(distance);

    link.label(0, {
        position: {
            distance,
            offset: tangent?.pointOffset(point) || 0
        }
    })
}

export function applyLayoutResult(graph: dia.Graph, geomGraph: GeomGraph, edgeRoutingMode: EdgeRoutingMode) {

    for (const geomNode of geomGraph.shallowNodes) {
        const { id } = geomNode;
        const { left: x, bottom: y } = geomNode.boundingBox;

        const element = graph.getCell(id) as dia.Element;

        element.position(x, y);

        // If the node is a subgraph, its size has been modified
        // when packing its children, so we need to set it explicitly
        if (geomNode.node instanceof Graph) {
            element.size(geomNode.boundingBox.width, geomNode.boundingBox.height);
        }

        for (const geomEdge of geomNode.outEdges()) {

            const { id, curve, source: sourceGeomNode, target: targetGeomNode, label } = geomEdge as IdentifiableGeomEdge;

            const vertices = [];
            // `curve` doesn't have to be a Curve instance, it can be a straight line etc.
            if (curve instanceof Curve) {
                vertices.push(...curveToVertices(curve, edgeRoutingMode));
            }

            const link = graph.getCell(id) as dia.Link;

            link.vertices(vertices);

            // If label exists, set its position
            if (label) {
                const polyline = new g.Polyline([curve.start, ...vertices, curve.end]);
                setLinkLabel(link, polyline, label);
            }

            // Source Anchor
            link.prop('source/anchor', getAnchor(curve.start, sourceGeomNode.boundingBox));

            // Target Anchor
            link.prop('target/anchor', getAnchor(curve.end, targetGeomNode.boundingBox));
        }
    }

    // Recursively apply layout to subgraphs
    for (const cluster of geomGraph.Clusters) {
        applyLayoutResult(graph, cluster as GeomGraph, edgeRoutingMode);
    }
}

export function buildLayoutSettings(options?: Options): SugiyamaLayoutSettings {

    const layoutSettings = new SugiyamaLayoutSettings();

    // Setup layout options
    if (options?.layoutOptions) {
        const { layerSeparation, nodeSeparation, layerDirection, gridSize } = options.layoutOptions;

        if (util.isNumber(layerSeparation)) {
            layoutSettings.LayerSeparation = layerSeparation!;
        }

        if (util.isNumber(nodeSeparation)) {
            layoutSettings.commonSettings.NodeSeparation = nodeSeparation!;
        }

        if (layerDirection) {
            layoutSettings.layerDirection = layerDirection;
        }

        if (util.isNumber(gridSize)) {
            layoutSettings.GridSizeByX = gridSize!;
            layoutSettings.GridSizeByY = gridSize!;
        }
    }

    const { edgeRoutingMode = EdgeRoutingMode.Rectilinear } = options?.edgeRoutingSettings || {};

    layoutSettings.edgeRoutingSettings.EdgeRoutingMode = edgeRoutingMode;

    return layoutSettings;
}

function curveToVertices(curve: Curve, edgeRoutingMode: EdgeRoutingMode): dia.Point[] {
    const vertices = [];

    // Ellipses are the corners of links, JointJS will handle connecting the generated
    // vertices with straight lines
    const ellipses = curve.segs.filter((seg) => seg instanceof Ellipse) as Ellipse[];

    const iterateeFunction = edgeRoutingMode === EdgeRoutingMode.Rectilinear ? rectilinearRouteMapper : splineBundlingRouteMapper;

    for (const ellipse of ellipses) {
        vertices.push(...iterateeFunction(ellipse));
    }

    return new g.Polyline(vertices).simplify().points;
}

function rectilinearRouteMapper(ellipse: Ellipse): dia.Point[] {
    // Replace all ellipses along the curve with the sum of the start and the bAxis
    return [ellipse.start.add(ellipse.bAxis)];
}

function splineBundlingRouteMapper(ellipse: Ellipse): dia.Point[] {
    const middleParameter = (ellipse.parStart + ellipse.parEnd) / 2;
    return [ellipse.start, ellipse.value(middleParameter), ellipse.end];
}
