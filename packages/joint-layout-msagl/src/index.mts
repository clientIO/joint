import { dia, g, util } from '@joint/core';
import { Graph, GeomGraph, layoutGraphWithSugiayma, CancelToken } from '@msagl/core';
import {
    applyLayoutResult,
    buildLayoutSettings,
    importJointGraph
} from './utils.mjs';
import { type Options, type LayoutResult } from './types.mjs';
import { defaultOptions } from './defaults.mjs';
import { LayerDirectionEnum } from './enums.mjs';

const LAYOUT_BATCH_NAME = 'layout';

export function layout(graphOrCells: dia.Graph | dia.Cell[], options?: Options): LayoutResult {

    // Merge user options with defaults and cast to the correct type
    const finalOptions = util.defaults({}, options || {}, defaultOptions) as Required<Options>;

    let graph: dia.Graph;

    if (graphOrCells instanceof dia.Graph) {
        graph = graphOrCells;
    } else {
        // Create a temporary graph to layout the given cells.
        // Layers has no significance to the layout process.
        graph = new dia.Graph({}, { ignoreLayers: true });
        // Reset cells in dry mode so the graph reference is not stored on the cells.
        // `sort: false` to prevent elements to change their order based on the z-index
        graph.resetCells(graphOrCells, { dry: true, sort: false });
    }

    const msGraph = new Graph();
    const geomGraph = new GeomGraph(msGraph);

    // Use finalOptions for origin offsets and layout settings
    geomGraph.margins = {
        left: finalOptions.x,
        top: finalOptions.y,
        right: 0,
        bottom: 0
    };

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
        // Propagate the margins (cluster padding) to the subgraph
        geomSubgraph.margins = util.normalizeSides(finalOptions.clusterPadding) as Required<dia.PaddingJSON>;
    }

    layoutGraphWithSugiayma(geomGraph, new CancelToken(), true);

    // Apply the layout result to the JointJS graph
    // wrap the changes in a batch
    graph.startBatch(LAYOUT_BATCH_NAME);
    applyLayoutResult(graph, geomGraph, finalOptions);
    graph.stopBatch(LAYOUT_BATCH_NAME);

    const bbox = geomGraph.boundingBox;
    const margins = geomGraph.margins;

    return {
        bbox: new g.Rect(
            margins.left,
            margins.top,
            Math.abs(bbox.width - (margins.left + margins.right)),
            Math.abs(bbox.height - (margins.top + margins.bottom))
        ),
        msGraph,
        msGeomGraph: geomGraph
    };
}

export * from './types.mjs';
export * from './enums.mjs';
