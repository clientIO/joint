import { dia, g, util } from "@joint/core";
import { Graph, GeomGraph, layoutGraphWithSugiayma, CancelToken } from '@msagl/core';
import {
    applyLayoutResult,
    buildLayoutSettings,
    importJointGraph
} from "./utils.mjs";
import { type Options, LayerDirectionEnum } from './types.mjs';
import { defaultOptions } from "./defaults.mjs";

const LAYOUT_BATCH_NAME = 'layout';

export function layout(graphOrCells: dia.Graph | dia.Cell[], options?: Options): g.Rect {

    // Merge user options with defaults and cast to the correct type
    const finalOptions = util.defaultsDeep({}, options || {}, defaultOptions) as Required<Options>;

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

    // Use finalOptions for margins and layout settings
    geomGraph.margins = finalOptions.margins;

    // Process the JointJS graph and convert it to a MSAGL graph
    importJointGraph(graph, msGraph, finalOptions);

    // Top-level layout settings
    geomGraph.layoutSettings = buildLayoutSettings(finalOptions);

    // Subgraphs layout settings
    for (const geomNode of geomGraph.subgraphsDepthFirst) {
        const geomSubgraph = geomNode as GeomGraph;
        const layoutSettings = buildLayoutSettings(finalOptions);
        // Note: Set the layer direction to top to bottom for subgraphs
        // Since anything else will cause the layout to break
        layoutSettings.layerDirection = LayerDirectionEnum.TB;
        geomSubgraph.layoutSettings = layoutSettings;
        // Propagate the margins to the subgraph
        geomSubgraph.margins = finalOptions.margins;
    }

    layoutGraphWithSugiayma(geomGraph, new CancelToken(), true);

    // Apply the layout result to the JointJS graph
    // wrap the changes in a batch
    graph.startBatch(LAYOUT_BATCH_NAME);
    applyLayoutResult(graph, geomGraph, finalOptions);
    graph.stopBatch(LAYOUT_BATCH_NAME);

    const bbox = geomGraph.boundingBox;

    // empty geomGraph returns { x: 0, y: 0, width: -1, height: 20 }
    if (bbox.isEmpty()) return new g.Rect(0, 0, 0, 0);

    // Use finalOptions.margins for calculating final bounding box
    const { left, right, top, bottom } = finalOptions.margins;

    return new g.Rect(
        bbox.left + left,
        bbox.bottom + bottom,
        bbox.width - (left + right),
        bbox.height - (top + bottom)
    );
}

export * from './types.mjs';
