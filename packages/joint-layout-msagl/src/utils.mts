import { dia, g } from '@joint/core';
import { Graph, GeomGraph, GeomNode, Node, Curve, Ellipse, CurveFactory, Point, Rectangle, Size } from '@msagl/core';
import type { IdentifiableGeomEdge } from "./IdentifiableGeomEdge.mjs";

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

export function applyLayoutResult(graph: dia.Graph, geomGraph: GeomGraph) {

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
                vertices.push(...curveToVertices(curve));
            }

            const link = graph.getCell(id) as dia.Link;

            link.vertices(vertices);

            // If label exists, set its position
            if (label) {
                const { x, y } = label.boundingBox.center;
                const point = new g.Point(x, y);

                // Convert the curve to a polyline to find the closest point along the curve
                const polyline = new g.Polyline([curve.start, ...vertices, curve.end]);
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

            // Source Anchor
            link.prop('source/anchor', getAnchor(curve.start, sourceGeomNode.boundingBox));

            // Target Anchor
            link.prop('target/anchor', getAnchor(curve.end, targetGeomNode.boundingBox));
        }
    }

    // Recursively apply layout to subgraphs
    for (const cluster of geomGraph.Clusters) {
        applyLayoutResult(graph, cluster as GeomGraph);
    }
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

function curveToVertices(curve: Curve): dia.Point[] {
    const vertices = [];

    // Ellipses are the corners of links, JointJS will handle connecting the generated
    // vertices with straight lines
    const ellipses = curve.segs.filter((seg: any) => seg instanceof Ellipse) as Ellipse[];

    // Replace all ellipses along the curve with the sum of the start and the bAxis
    for (const ellipse of ellipses) {
        vertices.push(ellipse.start.add(ellipse.bAxis));
    }

    return vertices;
}
