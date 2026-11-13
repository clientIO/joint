import * as dagreUtil from '@dagrejs/dagre';
import * as graphlibUtil from '@dagrejs/graphlib';
import { util, g, dia } from '@joint/core';

// The `ranksep` dagre uses when none is given.
const DAGRE_RANK_SEP = 50;

// A cluster is ranked by its children, so its own rank is never passed to dagre.
function removeClusterRanks(glGraph) {

    glGraph.nodes().forEach((nodeId) => {
        if (glGraph.children(nodeId).length === 0) return;
        const label = glGraph.node(nodeId);
        if (!label || !('rank' in label)) return;
        // The label is copied, so the object returned by `exportElement()` keeps its rank.
        const clusterLabel = { ...label };
        delete clusterLabel.rank;
        glGraph.setNode(nodeId, clusterLabel);
    });
}

// Prepares the graphlib graph for the `fixed` ranker:
// - takes the rank of every non-cluster node from its label (missing = 0),
// - numbers the used ranks from 0 without gaps for dagre (the empty ranks are added after the layout),
// - leaves out the edges within one rank (dagre can not lay them out),
// - reverses the backward edges (dagre requires the target rank to be greater than the source rank).
function prepareFixedRanks(glGraph) {

    const ranks = new Map();
    glGraph.nodes().forEach((nodeId) => {
        // The ranks are assigned by the ranker function only. The label is copied,
        // so the object returned by `exportElement()` keeps its rank.
        const { rank, ...label } = glGraph.node(nodeId);
        glGraph.setNode(nodeId, label);
        if (glGraph.children(nodeId).length > 0) return;
        ranks.set(nodeId, Number.isFinite(rank) ? Math.round(rank) : 0);
    });

    const usedRanks = Array.from(new Set(ranks.values())).sort((a, b) => a - b);
    const layoutRankByRank = new Map(usedRanks.map((rank, index) => [rank, index]));
    const layoutRanks = new Map();
    ranks.forEach((rank, nodeId) => layoutRanks.set(nodeId, layoutRankByRank.get(rank)));

    const sameRankLinkIds = [];
    const reversedEdges = [];
    glGraph.edges().forEach((edge) => {
        const { v: sourceId, w: targetId, name } = edge;
        // Self-loops are handled by dagre.
        if (sourceId === targetId) return;
        const sourceRank = ranks.get(sourceId);
        const targetRank = ranks.get(targetId);
        if (sourceRank === undefined || targetRank === undefined) return;
        if (sourceRank === targetRank) {
            glGraph.removeEdge(edge);
            sameRankLinkIds.push(name);
        } else if (sourceRank > targetRank) {
            const label = glGraph.edge(edge);
            glGraph.removeEdge(edge);
            glGraph.setEdge(targetId, sourceId, label, name);
            reversedEdges.push({ v: targetId, w: sourceId, name });
        }
    });

    return { ranks, layoutRanks, sameRankLinkIds, reversedEdges };
}

// Flips the points of the reversed edges back to go from the source to the target.
function restoreReversedEdges(glGraph, reversedEdges) {

    reversedEdges.forEach((edge) => {
        const label = glGraph.edge(edge);
        if (label.points) label.points.reverse();
    });
}

// Dagre lays out the used ranks only. Moves the nodes, the edge points and the edge labels
// along the rank axis so that every empty rank between two used ranks gets `size` of room.
// An edge point or label between two ranks is moved proportionally. A node side between
// two ranks (the border of a cluster) keeps its distance to the nearest rank inside the node.
function addEmptyRanks(glGraph, ranks, size, rankDir) {

    const horizontal = (rankDir === 'LR' || rankDir === 'RL');
    const axis = horizontal ? 'x' : 'y';
    const dimension = horizontal ? 'width' : 'height';

    // The extent of every rank along the rank axis.
    const extents = new Map();
    ranks.forEach((rank, nodeId) => {
        const node = glGraph.node(nodeId);
        const start = node[axis] - node[dimension] / 2;
        const end = node[axis] + node[dimension] / 2;
        const extent = extents.get(rank);
        if (extent) {
            extent.start = Math.min(extent.start, start);
            extent.end = Math.max(extent.end, end);
        } else {
            extents.set(rank, { rank, start, end });
        }
    });

    // The gaps between the neighboring ranks (in the order along the axis)
    // with the empty ranks between them.
    const sortedExtents = Array.from(extents.values()).sort((a, b) => a.start - b.start);
    const gaps = [];
    let totalDelta = 0;
    for (let i = 1; i < sortedExtents.length; i++) {
        const previous = sortedExtents[i - 1];
        const next = sortedExtents[i];
        const emptyRankCount = Math.abs(next.rank - previous.rank) - 1;
        if (emptyRankCount === 0) continue;
        const delta = emptyRankCount * size;
        gaps.push({ start: previous.end, end: next.start, delta });
        totalDelta += delta;
    }
    if (gaps.length === 0) return;

    // `ratio` is the part of the gap delta applied to a coordinate inside the gap.
    const move = (coordinate, ratio) => {
        let offset = 0;
        for (const gap of gaps) {
            if (coordinate >= gap.end) {
                offset += gap.delta;
            } else {
                if (coordinate > gap.start) {
                    offset += gap.delta * ratio(coordinate, gap);
                }
                break;
            }
        }
        return coordinate + offset;
    };
    const proportionalRatio = (coordinate, gap) => (coordinate - gap.start) / (gap.end - gap.start);
    const nextRankRatio = () => 1;
    const previousRankRatio = () => 0;

    glGraph.nodes().forEach((nodeId) => {
        const node = glGraph.node(nodeId);
        // A cluster can span several ranks, so both of its sides are moved.
        const start = move(node[axis] - node[dimension] / 2, nextRankRatio);
        const end = move(node[axis] + node[dimension] / 2, previousRankRatio);
        node[axis] = (start + end) / 2;
        node[dimension] = end - start;
    });

    glGraph.edges().forEach((edge) => {
        const label = glGraph.edge(edge);
        if (label.points) {
            label.points.forEach((point) => {
                point[axis] = move(point[axis], proportionalRatio);
            });
        }
        if (axis in label) {
            label[axis] = move(label[axis], proportionalRatio);
        }
    });

    glGraph.graph()[dimension] += totalDelta;
}

// Dagre calls a function `ranker` with its layout graph instead of its own ranking.
function createFixedRanker(ranks) {

    return function(layoutGraph) {
        const { nestingRoot, nodeRankFactor = 1 } = layoutGraph.graph();
        // Dagre multiplies the length of every edge by 2 (to make room for edge labels)
        // and by `nodeRankFactor` (to make room for the borders of nested clusters).
        const scale = 2 * nodeRankFactor;
        // Dagre adds a top and a bottom border node to every cluster. The nesting root
        // points to the top borders of the top-level clusters, a top border points to
        // the top borders of its child clusters and to its other children. The bottom
        // borders are pointed to by the bottom borders of the child clusters and by the
        // other children. The top border has to be ranked before and the bottom border
        // after all the children of the cluster.
        const topBorderIds = new Set();
        const collectTopBorders = (nodeId) => {
            layoutGraph.successors(nodeId).forEach((childId) => {
                if (ranks.has(childId) || topBorderIds.has(childId)) return;
                topBorderIds.add(childId);
                collectTopBorders(childId);
            });
        };
        if (nestingRoot !== undefined) collectTopBorders(nestingRoot);
        const borderRanks = new Map();
        const getRank = (nodeId) => {
            if (ranks.has(nodeId)) return scale * ranks.get(nodeId);
            if (borderRanks.has(nodeId)) return borderRanks.get(nodeId);
            const rank = topBorderIds.has(nodeId)
                ? layoutGraph.successors(nodeId).reduce((min, childId) => Math.min(min, getRank(childId)), Infinity) - 1
                : layoutGraph.predecessors(nodeId).reduce((max, childId) => Math.max(max, getRank(childId)), -Infinity) + 1;
            borderRanks.set(nodeId, rank);
            return rank;
        };
        let minRank = Infinity;
        layoutGraph.nodes().forEach((nodeId) => {
            if (nodeId === nestingRoot) return;
            const rank = getRank(nodeId);
            layoutGraph.node(nodeId).rank = rank;
            minRank = Math.min(minRank, rank);
        });
        if (nestingRoot !== undefined) {
            // The root of the nesting graph has to be ranked before all the nodes.
            layoutGraph.node(nestingRoot).rank = Number.isFinite(minRank) ? minRank - 1 : 0;
        }
    };
}

export const DirectedGraph = {

    exportElement: function(element) {

        // The width and height of the element.
        return element.size();
    },

    exportLink: function(link) {

        var labelSize = link.get('labelSize') || {};
        var edge = {
            // The number of ranks to keep between the source and target of the edge.
            minLen: link.get('minLen') || 1,
            // The weight to assign edges. Higher weight edges are generally
            // made shorter and straighter than lower weight edges.
            weight: link.get('weight') || 1,
            // Where to place the label relative to the edge.
            // l = left, c = center r = right.
            labelpos: link.get('labelPosition') || 'c',
            // How many pixels to move the label away from the edge.
            // Applies only when labelpos is l or r.
            labeloffset: link.get('labelOffset') || 0,
            // The width of the edge label in pixels.
            width: labelSize.width || 0,
            // The height of the edge label in pixels.
            height: labelSize.height || 0
        };

        return edge;
    },

    importElement: function(nodeId, glGraph, graph, opt) {

        const element = graph.getCell(nodeId);
        const glNode = glGraph.node(nodeId);

        if (util.isFunction(opt.setPosition)) {
            opt.setPosition(element, glNode);
        } else {
            element.set('position', {
                x: glNode.x - glNode.width / 2,
                y: glNode.y - glNode.height / 2
            });
        }

        // check if we want to use Dagre's default cluster padding
        if (opt.resizeClusters && (opt.clusterPadding === 'default')) {
            // check if element is a cluster (clusters has no `rank` assigned)
            if (glNode.rank === undefined) {
                element.set('size', {
                    width: glNode.width,
                    height: glNode.height
                });
            }
        } // else: possibly apply numeric `opt.clusterPadding` (see `layout()` function)
    },

    importLink: function(edgeObj, glGraph, graph, opt) {

        const SIMPLIFY_THRESHOLD = 0.001;

        const link = graph.getCell(edgeObj.name);
        const glEdge = glGraph.edge(edgeObj);
        const points = glEdge.points || [];
        const polyline = new g.Polyline(points);

        // check the `setLinkVertices` here for backwards compatibility
        if (opt.setVertices || opt.setLinkVertices) {
            if (util.isFunction(opt.setVertices)) {
                opt.setVertices(link, points);
            } else {
                // simplify the `points` polyline
                polyline.simplify({ threshold: SIMPLIFY_THRESHOLD });
                const polylinePoints = polyline.points.map((point) => (point.toJSON())); // JSON of points after simplification
                const numPolylinePoints = polylinePoints.length; // number of points after simplification
                // set simplified polyline points as link vertices
                // remove first and last polyline points (= source/target connectionPoints)
                link.set('vertices', polylinePoints.slice(1, numPolylinePoints - 1));
            }
        }

        if (opt.setLabels && ('x' in glEdge) && ('y' in glEdge)) {
            const labelPosition = { x: glEdge.x, y: glEdge.y };
            if (util.isFunction(opt.setLabels)) {
                opt.setLabels(link, labelPosition, points);
            } else {
                // convert the absolute label position to a relative position
                // towards the closest point on the edge
                const length = polyline.closestPointLength(labelPosition);
                const closestPoint = polyline.pointAtLength(length);
                const distance = (length / polyline.length());
                const offset = new g.Point(labelPosition).difference(closestPoint).toJSON();
                link.label(0, {
                    position: {
                        distance: distance,
                        offset: offset
                    }
                });
            }
        }
    },

    layout: function(graphOrCells, opt) {

        var graph;

        if (graphOrCells instanceof dia.Graph) {
            graph = graphOrCells;
        } else {
            // Create a temporary graph to layout the given cells.
            // Layers has no significance to the layout process.
            graph = new dia.Graph(null, { ignoreLayers: true });
            // Reset cells in dry mode so the graph reference is not stored on the cells.
            // `sort: false` to prevent elements to change their order based on the z-index
            graph.resetCells(graphOrCells, { dry: true, sort: false });
        }

        // This is not needed anymore.
        graphOrCells = null;

        opt = util.defaults(opt || {}, {
            resizeClusters: true,
            clusterPadding: 10,
            exportElement: this.exportElement,
            exportLink: this.exportLink,
            disableOptimalOrderHeuristic: false
        });

        // create a graphlib.Graph that represents the joint.dia.Graph
        // var glGraph = graph.toGraphLib({
        var glGraph = DirectedGraph.toGraphLib(graph, {
            directed: true,
            // We are about to use edge naming feature.
            multigraph: true,
            // We are able to layout graphs with embeds.
            compound: true,
            setNodeLabel: opt.exportElement,
            setEdgeLabel: opt.exportLink,
            setEdgeName: function(link) {
                // Graphlib edges have no ids. We use edge name property
                // to store and retrieve ids instead.
                return link.id;
            }
        });

        var glLabel = {};
        var marginX = (util.isNumber(opt.marginX)) ? opt.marginX : 0;
        var marginY = (util.isNumber(opt.marginY)) ? opt.marginY : 0;

        // Dagre layout accepts options as lower case.
        // Direction for rank nodes. Can be TB, BT, LR, or RL
        if (opt.rankDir) glLabel.rankdir = opt.rankDir;
        // Alignment for rank nodes. Can be UL, UR, DL, or DR
        if (opt.align) glLabel.align = opt.align;
        // Number of pixels that separate nodes horizontally in the layout.
        if (util.isNumber(opt.nodeSep)) glLabel.nodesep = opt.nodeSep;
        // Number of pixels that separate edges horizontally in the layout.
        if (util.isNumber(opt.edgeSep)) glLabel.edgesep = opt.edgeSep;
        // Number of pixels between each rank in the layout.
        if (util.isNumber(opt.rankSep)) glLabel.ranksep = opt.rankSep;
        // Type of algorithm to assign a rank to each node in the input graph.
        // Possible values: network-simplex, tight-tree, longest-path or fixed
        removeClusterRanks(glGraph);
        let fixedRanks = null;
        if (opt.ranker === 'fixed') {
            fixedRanks = prepareFixedRanks(glGraph);
            glLabel.ranker = createFixedRanker(fixedRanks.layoutRanks);
        } else if (opt.ranker) {
            glLabel.ranker = opt.ranker;
        }
        // Number of pixels to use as a margin around the left and right of the graph.
        glLabel.marginx = marginX;
        // Number of pixels to use as a margin around the top and bottom of the graph.
        glLabel.marginy = marginY;

        // Set the option object for the graph label.
        glGraph.setGraph(glLabel);

        // Custom order callback.
        let customOrder;
        if (util.isFunction(opt.customOrder)) {
            customOrder = (dagreGraph, order) => {
                opt.customOrder(dagreGraph, graph, order);
            };
        }

        // Executes the layout.
        dagreUtil.layout(glGraph, {
            debugTiming: !!opt.debugTiming,
            disableOptimalOrderHeuristic: !!opt.disableOptimalOrderHeuristic,
            customOrder,
        });

        if (fixedRanks) {
            restoreReversedEdges(glGraph, fixedRanks.reversedEdges);
            const rankSep = util.isNumber(opt.rankSep) ? opt.rankSep : DAGRE_RANK_SEP;
            const emptyRankSize = (Number.isFinite(opt.emptyRankSize) && opt.emptyRankSize > 0) ? opt.emptyRankSize : 0;
            const rankDir = (opt.rankDir || 'TB').toUpperCase();
            addEmptyRanks(glGraph, fixedRanks.ranks, rankSep + emptyRankSize, rankDir);
        }

        // Wrap all graph changes into a batch.
        graph.startBatch('layout');

        if (fixedRanks && (opt.setVertices || opt.setLinkVertices)) {
            // Links within one rank are not laid out, so they have no route.
            fixedRanks.sameRankLinkIds.forEach((linkId) => {
                const link = graph.getCell(linkId);
                if (util.isFunction(opt.setVertices)) {
                    opt.setVertices(link, []);
                } else {
                    link.set('vertices', []);
                }
            });
        }

        DirectedGraph.fromGraphLib(glGraph, {
            importNode: this.importElement,
            importEdge: this.importLink,
            ...opt,
            graph,
        });

        if (opt.resizeClusters && (opt.clusterPadding !== 'default')) {
            // Resize and reposition cluster elements
            // Filter out top-level clusters (nodes without a parent and with children) and map them to cells
            const topLevelClusters = glGraph.nodes()
                .filter(v => !glGraph.parent(v) && glGraph.children(v).length > 0)
                .map(graph.getCell.bind(graph));

            // Since the `opt.deep` is set to `true`, the `fitToChildren` method is applied in reverse-depth
            // order starting from the deepest descendant - working its way up to the top-level clusters.
            util.invoke(topLevelClusters, 'fitToChildren', { padding: opt.clusterPadding, deep: true });
        }

        graph.stopBatch('layout');

        // Width and height of the graph extended by margins.
        var glSize = glGraph.graph();
        // Return the bounding box of the graph after the layout.
        return new g.Rect(
            marginX,
            marginY,
            Math.abs(glSize.width - 2 * marginX),
            Math.abs(glSize.height - 2 * marginY)
        );
    },

    fromGraphLib: function(glGraph, opt) {

        opt = opt || {};

        var importNode = opt.importNode || util.noop;
        var importEdge = opt.importEdge || util.noop;
        var graph = opt.graph;
        if (!graph) {
            // The graph should be required as an option.
            // @deprecated
            if (this instanceof dia.Graph) {
                // Backwards compatibility.
                graph = this;
            } else {
                graph = new dia.Graph();
            }
        }

        // Import all nodes.
        glGraph.nodes().forEach(function(node) {
            importNode.call(graph, node, glGraph, graph, opt);
        });

        // Import all edges.
        glGraph.edges().forEach(function(edge) {
            importEdge.call(graph, edge, glGraph, graph, opt);
        });

        return graph;
    },

    // Create new graphlib graph from existing JointJS graph.
    toGraphLib: function(graph, opt = {}) {

        const glGraphType = util.pick(opt, 'directed', 'compound', 'multigraph');
        const glGraph = new graphlibUtil.Graph(glGraphType);
        const setNodeLabel = opt.setNodeLabel || util.noop;
        const setEdgeLabel = opt.setEdgeLabel || util.noop;
        const setEdgeName = opt.setEdgeName || util.noop;

        for (const cell of graph.getCells()) {
            if (cell.isLink()) {

                var source = cell.get('source');
                var target = cell.get('target');

                // Links that end at a point are ignored.
                if (!source.id || !target.id) break;

                // Note that if we are creating a multigraph we can name the edges. If
                // we try to name edges on a non-multigraph an exception is thrown.
                glGraph.setEdge(source.id, target.id, setEdgeLabel(cell), setEdgeName(cell));

            } else {

                glGraph.setNode(cell.id, setNodeLabel(cell));

                // For the compound graphs we have to take embeds into account.
                if (glGraph.isCompound() && cell.has('parent')) {
                    const parentId = cell.get('parent');
                    if (graph.getCell(parentId)) {
                        // Make sure the parent cell is included in the graph (this can
                        // happen when the layout is run on part of the graph only).
                        glGraph.setParent(cell.id, parentId);
                    }
                }
            }
        }

        return glGraph;
    }
};
