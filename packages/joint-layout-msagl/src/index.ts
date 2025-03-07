import { dia, g, util } from "@joint/core";
import { Graph, GeomGraph, Edge, EdgeRoutingMode, SugiyamaLayoutSettings, layoutGeomGraph, LayerDirectionEnum, Label, GeomLabel, Size } from '@msagl/core';
import { IdentifiableGeomEdge } from "./IdentifiableGeomEdge";
import { constructNode, applyLayoutResult } from "./utils";

export interface Options {
    layoutOptions?: {
        layerSeparation?: number,
        nodeSeparation?: number,
        layerDirection?: LayerDirectionEnum,
        gridSize?: number
    }
    margins?: {
        left: number,
        right: number,
        top: number,
        bottom: number
    },
    measureLinkLabel?: (link: dia.Link, canvasContext: CanvasRenderingContext2D) => { width: number, height: number }
}

export { LayerDirectionEnum } from '@msagl/core';

const LAYOUT_BATCH_NAME = 'layout';

export function layout(graphOrCells: dia.Graph | dia.Cell[], options?: Options): g.Rect {

    let jjGraph: dia.Graph;

    if (graphOrCells instanceof dia.Graph) {
        jjGraph = graphOrCells;
    } else {
        jjGraph = new dia.Graph();
        // Reset cells in dry mode so the graph reference is not stored on the cells.
        // `sort: false` to prevent elements to change their order based on the z-index
        jjGraph.resetCells(graphOrCells, { dry: true, sort: false });
    }

    const graph = new Graph();
    const geomGraph = new GeomGraph(graph);

    const margins = options?.margins || { left: 10, right: 10, top: 10, bottom: 10 };
    geomGraph.margins = margins;

    // Start constructing nodes recursively
    // starting from top-level elements
    jjGraph.getElements()
        .filter((element) => !element.parent())
        .forEach((topLevelEl) => {
            constructNode(topLevelEl, graph);
        });

    // Prepapare canvas for measuring link labels
    const canvas = document.createElement('canvas');

    jjGraph.getLinks()
        .forEach((link) => {
            const sourceNode = graph.findNodeRecursive(String(link.source().id));
            const targetNode = graph.findNodeRecursive(String(link.target().id));

            // Link either ended at a point or at an another link
            // ignore layout for such links
            if (!sourceNode || !targetNode) {
                return;
            }

            const edge = new Edge(sourceNode, targetNode);
            const geomEdge = new IdentifiableGeomEdge(edge, link.id);

            const { measureLinkLabel } = options || {};

            const jjLabel = link.label(0);
            // Label does not exist or callback to measure label is not provided
            if (!jjLabel || !measureLinkLabel) return;

            const label = new Label(edge);
            edge.label = label;

            const { width, height } = measureLinkLabel(link, canvas.getContext('2d')!);

            geomEdge.label = new GeomLabel(label, new Size(width, height));
        });

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

    layoutSettings.edgeRoutingSettings.EdgeRoutingMode = EdgeRoutingMode.Rectilinear;
    geomGraph.layoutSettings = layoutSettings;

    layoutGeomGraph(geomGraph);

    // Apply the layout result to the JointJS graph
    // while traversing the geomGraph
    // wrap the changes in a batch
    jjGraph.startBatch(LAYOUT_BATCH_NAME);
    applyLayoutResult(jjGraph, geomGraph);
    jjGraph.stopBatch(LAYOUT_BATCH_NAME);

    const bbox = geomGraph.boundingBox;

    // empty geomGraph returns { x: 0, y: 0, width: -1, height: 20 }
    if (bbox.isEmpty()) return new g.Rect(0, 0, 0, 0);

    return new g.Rect(
        bbox.left + margins.left,
        bbox.bottom + margins.bottom,
        bbox.width - (margins.left + margins.right),
        bbox.height - (margins.top + margins.bottom)
    );
}
