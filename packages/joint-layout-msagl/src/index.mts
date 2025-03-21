import { dia, g } from "@joint/core";
import { Graph, GeomGraph, layoutGraphWithSugiayma, LayerDirectionEnum, CancelToken } from '@msagl/core';
import { applyLayoutResult, buildLayoutSettings, processJointGraph } from "./utils.mjs";

const LAYOUT_BATCH_NAME = 'layout';

export enum EdgeRoutingMode {
    SplineBundling = 1,
    Rectilinear = 4
}

export interface Options {
    layoutOptions?: {
        layerSeparation?: number,
        nodeSeparation?: number,
        layerDirection?: LayerDirectionEnum,
        gridSize?: number
    },
    edgeRoutingSettings?: {
        edgeRoutingMode?: EdgeRoutingMode
    },
    margins?: {
        left: number,
        right: number,
        top: number,
        bottom: number
    }
}

export { LayerDirectionEnum } from '@msagl/core';

export function layout(graphOrCells: dia.Graph | dia.Cell[], options?: Options): g.Rect {

    let graph: dia.Graph;

    if (graphOrCells instanceof dia.Graph) {
        graph = graphOrCells;
    } else {
        graph = new dia.Graph();
        // Reset cells in dry mode so the graph reference is not stored on the cells.
        // `sort: false` to prevent elements to change their order based on the z-index
        graph.resetCells(graphOrCells, { dry: true, sort: false });
    }

    const msGraph = new Graph();
    const geomGraph = new GeomGraph(msGraph);

    const margins = options?.margins || { left: 10, right: 10, top: 10, bottom: 10 };
    geomGraph.margins = margins;

    // Process the JointJS graph and convert it to a MSAGL graph
    processJointGraph(graph, msGraph);

    // Top-level layout settings
    geomGraph.layoutSettings = buildLayoutSettings(options);

    // Subgraphs layout settings
    for (const geomNode of geomGraph.subgraphsDepthFirst) {
        const geomSubgraph = geomNode as GeomGraph;
        const layoutSettings = buildLayoutSettings(options);
        // Set the layer direction to top to bottom for subgraphs
        // Since anything else will cause the layout to break
        layoutSettings.layerDirection = LayerDirectionEnum.TB;
        geomSubgraph.layoutSettings = layoutSettings;
        // Propagate the margins to the subgraph
        geomSubgraph.margins = margins;
    }

    layoutGraphWithSugiayma(geomGraph, new CancelToken(), true);

    // Apply the layout result to the JointJS graph
    // while traversing the geomGraph
    // wrap the changes in a batch
    graph.startBatch(LAYOUT_BATCH_NAME);
    const edgeRoutingMode = options?.edgeRoutingSettings?.edgeRoutingMode || EdgeRoutingMode.Rectilinear;
    applyLayoutResult(graph, geomGraph, edgeRoutingMode);
    graph.stopBatch(LAYOUT_BATCH_NAME);

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
