import { util } from '@joint/core';

// The `ranksep` dagre uses when none is given.
const DAGRE_RANK_SEP = 50;

// Prepares the graphlib graph for the `fixed` ranker (before the dagre layout):
// - takes the rank of every non-cluster node from its label (missing = 0),
// - numbers the used ranks from 0 without gaps for dagre (the empty ranks are added after the layout),
// - leaves out the edges within one rank (dagre cannot lay them out),
// - reverses the backward edges (dagre requires the target rank to be greater than the source rank).
export function prepareFixedRanks(glGraph) {

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

    return { ranks, sameRankLinkIds, reversedEdges, ranker: createFixedRanker(layoutRanks) };
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

// Finishes the dagre layout for the `fixed` ranker:
// - flips the reversed edges back,
// - adds the room for the empty ranks.
export function finishFixedRanks(glGraph, fixedRanks, opt) {

    restoreReversedEdges(glGraph, fixedRanks.reversedEdges);
    const rankSep = util.isNumber(opt.rankSep) ? opt.rankSep : DAGRE_RANK_SEP;
    const emptyRankSize = (Number.isFinite(opt.emptyRankSize) && opt.emptyRankSize > 0) ? opt.emptyRankSize : 0;
    const rankDir = (opt.rankDir || 'TB').toUpperCase();
    addEmptyRanks(glGraph, fixedRanks.ranks, rankSep + emptyRankSize, rankDir);
}
