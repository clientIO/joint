import { PersonNode, ParentChildLink } from '../data';

// Maximum barycenter sweep iterations. The barycenter heuristic for crossing
// minimization (Sugiyama et al.) converges quickly in practice. Empirical
// studies (Jünger & Mutzel) show ~24 passes reliably reach a stable ordering
// for typical graphs without excessive computation.
const MAX_BARYCENTER_ITERATIONS = 24;

export interface MinimizeCrossingsContext {
    parentChildLinks: ParentChildLink[];
    layoutId: (personElId: string) => string;
    personById: Map<number, PersonNode>;
    identicalGroupOf: Map<number, number>;
    nodeMultipleGroup: Map<string, string>;
}

// Custom crossing-minimization for dagre layout.
//
// Phases:
// 1. Seed from dagre's default heuristic.
// 2. Multi-pass barycenter refinement (up/down sweeps).
// 3. Greedy node relocation — try every position in the rank.
// 4. Resolve visual crossings from couple expansion using real-edge
//    barycenter sweeps.
// 5. Enforce twin/triplet adjacency.
//
export function minimizeCrossings(
    glGraph: any,
    _jointGraph: any,
    defaultOrder: (g: any) => void,
    context: MinimizeCrossingsContext
) {
    const { parentChildLinks, layoutId, personById, identicalGroupOf, nodeMultipleGroup } = context;

    // Group nodes by rank.
    const nodesByRank = new Map<number, string[]>();
    for (const nodeId of glGraph.nodes()) {
        const node = glGraph.node(nodeId);
        if (node.rank === undefined) continue;
        if (!nodesByRank.has(node.rank)) nodesByRank.set(node.rank, []);
        nodesByRank.get(node.rank)!.push(nodeId);
    }
    const ranks = [...nodesByRank.keys()].sort((a, b) => a - b);

    // Count crossings between two adjacent ranks.
    function countCrossings(upperRank: number, lowerRank: number): number {
        const upperNodes = nodesByRank.get(upperRank) || [];
        const lowerNodes = nodesByRank.get(lowerRank) || [];
        if (upperNodes.length === 0 || lowerNodes.length === 0) return 0;

        const edges: [number, number][] = [];
        for (const uId of upperNodes) {
            const uOrder = glGraph.node(uId).order!;
            for (const lId of (glGraph.successors(uId) || [])) {
                const lNode = glGraph.node(lId);
                if (lNode.rank === lowerRank) {
                    edges.push([uOrder, lNode.order!]);
                }
            }
        }

        let crossings = 0;
        for (let i = 0; i < edges.length; i++) {
            for (let j = i + 1; j < edges.length; j++) {
                if ((edges[i][0] - edges[j][0]) * (edges[i][1] - edges[j][1]) < 0) {
                    crossings++;
                }
            }
        }
        return crossings;
    }

    function totalCrossings(): number {
        let total = 0;
        for (let i = 0; i < ranks.length - 1; i++) {
            total += countCrossings(ranks[i], ranks[i + 1]);
        }
        return total;
    }

    function applyOrder(nodes: string[]) {
        nodes.forEach((id, i) => { glGraph.node(id).order = i; });
    }

    function saveOrder(): Map<string, number> {
        const saved = new Map<string, number>();
        for (const nodeId of glGraph.nodes()) {
            saved.set(nodeId, glGraph.node(nodeId).order!);
        }
        return saved;
    }

    function restoreOrder(saved: Map<string, number>) {
        for (const [nodeId, order] of saved) {
            glGraph.node(nodeId).order = order;
        }
        // Also re-sort nodesByRank arrays to match.
        for (const nodes of nodesByRank.values()) {
            nodes.sort((a, b) => glGraph.node(a).order! - glGraph.node(b).order!);
        }
    }

    // Barycenter: reorder nodes at a rank by average neighbor position.
    function reorderByBarycenter(rank: number, direction: 'up' | 'down') {
        const nodes = nodesByRank.get(rank);
        if (!nodes || nodes.length <= 1) return;

        const barycenters = new Map<string, number>();
        for (const nodeId of nodes) {
            const neighbors = direction === 'up'
                ? (glGraph.predecessors(nodeId) || [])
                : (glGraph.successors(nodeId) || []);

            if (neighbors.length === 0) {
                barycenters.set(nodeId, glGraph.node(nodeId).order!);
                continue;
            }

            let sum = 0;
            for (const nId of neighbors) {
                sum += glGraph.node(nId).order!;
            }
            barycenters.set(nodeId, sum / neighbors.length);
        }

        nodes.sort((a, b) => {
            const ba = barycenters.get(a)!;
            const bb = barycenters.get(b)!;
            if (ba !== bb) return ba - bb;

            // Tie-breaker: birth date, then identical group.
            const personA = personById.get(Number(a));
            const personB = personById.get(Number(b));
            if (personA && personB) {
                const birthCmp = (personA.dob || '').localeCompare(personB.dob || '');
                if (birthCmp !== 0) return birthCmp;

                const groupA = identicalGroupOf.get(personA.id) ?? personA.id;
                const groupB = identicalGroupOf.get(personB.id) ?? personB.id;
                if (groupA !== groupB) return groupA - groupB;
            }

            return glGraph.node(a).order! - glGraph.node(b).order!;
        });

        applyOrder(nodes);
    }

    // --- Phase 1: Seed from dagre's default heuristic ---
    defaultOrder(glGraph);
    // Sync nodesByRank arrays with dagre's assigned order.
    for (const nodes of nodesByRank.values()) {
        nodes.sort((a, b) => glGraph.node(a).order! - glGraph.node(b).order!);
    }

    let bestCrossings = totalCrossings();
    let bestOrder = saveOrder();

    // --- Phase 2: Multi-pass barycenter refinement ---
    for (let iter = 0; iter < MAX_BARYCENTER_ITERATIONS; iter++) {
        for (const rank of ranks) {
            reorderByBarycenter(rank, 'up');
        }
        for (let i = ranks.length - 1; i >= 0; i--) {
            reorderByBarycenter(ranks[i], 'down');
        }

        const crossings = totalCrossings();
        if (crossings < bestCrossings) {
            bestCrossings = crossings;
            bestOrder = saveOrder();
        }
        if (crossings === 0) break;
    }

    // --- Phase 3: Greedy node relocation ---
    // For each node, try every position in its rank and pick the
    // one that minimizes TOTAL crossings (not just local rank).
    restoreOrder(bestOrder);

    let relocated = true;
    for (let relocIter = 0; relocIter < 10 && relocated; relocIter++) {
        relocated = false;
        const currentTotal = totalCrossings();
        if (currentTotal === 0) break;

        for (let ri = 0; ri < ranks.length; ri++) {
            const nodes = nodesByRank.get(ranks[ri])!;
            // Greedy relocation is O(n² × positions) per rank. Skip wide
            // ranks to avoid excessive computation on large datasets.
            const MAX_RANK_WIDTH_FOR_RELOCATION = 50;
            if (nodes.length <= 1 || nodes.length > MAX_RANK_WIDTH_FOR_RELOCATION) continue;

            for (let i = 0; i < nodes.length; i++) {
                const nodeId = nodes[i];
                let bestPos = i;
                let bestCost = totalCrossings();
                if (bestCost === 0) break;

                // Remove node from current position.
                nodes.splice(i, 1);

                // Try every insertion position.
                for (let j = 0; j <= nodes.length; j++) {
                    nodes.splice(j, 0, nodeId);
                    applyOrder(nodes);
                    const cost = totalCrossings();
                    if (cost < bestCost) {
                        bestCost = cost;
                        bestPos = j;
                    }
                    nodes.splice(j, 1);
                }

                // Insert at the best position.
                nodes.splice(bestPos, 0, nodeId);
                applyOrder(nodes);

                if (bestPos !== i) {
                    relocated = true;
                }
            }
        }
    }

    resolveContainerCrossings(glGraph, parentChildLinks, layoutId, ranks, nodesByRank, applyOrder, saveOrder, restoreOrder);

    enforceTwinAdjacency(ranks, nodesByRank, nodeMultipleGroup, personById, identicalGroupOf, applyOrder);
}

// --- Phase 4: Resolve visual crossings from couple expansion ---
//
// Dagre's crossing-minimization works on a dummy-augmented graph where
// long edges are split into short segments. This can miss crossings
// between real edges that span multiple ranks. We fix this by re-running
// barycenter sweeps using only real-edge adjacency, checking container
// crossings after each sweep direction separately (a bottom-to-top sweep
// can reverse the fix from a top-to-bottom sweep).
function resolveContainerCrossings(
    glGraph: any,
    parentChildLinks: ParentChildLink[],
    layoutId: (personElId: string) => string,
    ranks: number[],
    nodesByRank: Map<number, string[]>,
    applyOrder: (nodes: string[]) => void,
    saveOrder: () => Map<string, number>,
    restoreOrder: (saved: Map<string, number>) => void,
) {
    function computeContainerCrossings(): number {
        const realEdges: { srcRank: number; tgtRank: number; srcOrder: number; tgtOrder: number }[] = [];
        const seen = new Set<string>();
        for (const rel of parentChildLinks) {
            const srcLayoutId = layoutId(String(rel.parentId));
            const tgtLayoutId = layoutId(String(rel.childId));
            const edgeKey = `${srcLayoutId}->${tgtLayoutId}`;
            if (seen.has(edgeKey)) continue;
            seen.add(edgeKey);
            const srcNode = glGraph.node(srcLayoutId);
            const tgtNode = glGraph.node(tgtLayoutId);
            if (!srcNode || !tgtNode) continue;
            realEdges.push({
                srcRank: srcNode.rank!,
                tgtRank: tgtNode.rank!,
                srcOrder: srcNode.order!,
                tgtOrder: tgtNode.order!,
            });
        }
        let crossings = 0;
        for (let i = 0; i < realEdges.length; i++) {
            for (let j = i + 1; j < realEdges.length; j++) {
                const ei = realEdges[i], ej = realEdges[j];
                if (ei.srcRank !== ej.srcRank || ei.tgtRank !== ej.tgtRank) continue;
                if ((ei.srcOrder - ej.srcOrder) * (ei.tgtOrder - ej.tgtOrder) < 0) {
                    crossings++;
                }
            }
        }
        return crossings;
    }

    // Build real-edge adjacency for barycenter sweeps.
    // Real nodes use real-edge neighbors; dummy nodes use dagre-graph
    // neighbors (preserving link routing quality).
    const realSucc = new Map<string, Set<string>>();
    const realPred = new Map<string, Set<string>>();
    const seenRE = new Set<string>();
    for (const rel of parentChildLinks) {
        const s = layoutId(String(rel.parentId));
        const t = layoutId(String(rel.childId));
        const k = `${s}->${t}`;
        if (seenRE.has(k)) continue;
        seenRE.add(k);
        if (!glGraph.node(s) || !glGraph.node(t)) continue;
        if (!realSucc.has(s)) realSucc.set(s, new Set());
        realSucc.get(s)!.add(t);
        if (!realPred.has(t)) realPred.set(t, new Set());
        realPred.get(t)!.add(s);
    }
    const isRealNode = (id: string) => realSucc.has(id) || realPred.has(id);

    function realBarycenter(rank: number, direction: 'up' | 'down') {
        const nodes = nodesByRank.get(rank)!;
        if (nodes.length <= 1) return;
        const bary = new Map<string, number>();
        for (const nodeId of nodes) {
            let neighbors: string[];
            if (isRealNode(nodeId)) {
                neighbors = direction === 'up'
                    ? [...(realPred.get(nodeId) || [])]
                    : [...(realSucc.get(nodeId) || [])];
            } else {
                neighbors = direction === 'up'
                    ? (glGraph.predecessors(nodeId) || [])
                    : (glGraph.successors(nodeId) || []);
            }
            if (neighbors.length === 0) {
                bary.set(nodeId, glGraph.node(nodeId).order!);
                continue;
            }
            let sum = 0;
            for (const nId of neighbors) sum += glGraph.node(nId).order!;
            bary.set(nodeId, sum / neighbors.length);
        }
        nodes.sort((a, b) => {
            const ba = bary.get(a)!, bb = bary.get(b)!;
            if (ba !== bb) return ba - bb;
            return glGraph.node(a).order! - glGraph.node(b).order!;
        });
        applyOrder(nodes);
    }

    let bestCC = computeContainerCrossings();
    let bestCCOrder = saveOrder();
    for (let iter = 0; iter < MAX_BARYCENTER_ITERATIONS && bestCC > 0; iter++) {
        for (const rank of ranks) realBarycenter(rank, 'up');
        let cc = computeContainerCrossings();
        if (cc < bestCC) { bestCC = cc; bestCCOrder = saveOrder(); }
        if (cc === 0) break;

        for (let ri = ranks.length - 1; ri >= 0; ri--) realBarycenter(ranks[ri], 'down');
        cc = computeContainerCrossings();
        if (cc < bestCC) { bestCC = cc; bestCCOrder = saveOrder(); }
        if (cc === 0) break;
    }
    restoreOrder(bestCCOrder);
}

// --- Phase 5: Enforce twin/triplet adjacency ---
//
// Crossing minimization may separate siblings from the same multiple-birth
// group. Pull group members together at the position of the leftmost member,
// with identical twins kept adjacent.
function enforceTwinAdjacency(
    ranks: number[],
    nodesByRank: Map<number, string[]>,
    nodeMultipleGroup: Map<string, string>,
    personById: Map<number, PersonNode>,
    identicalGroupOf: Map<number, number>,
    applyOrder: (nodes: string[]) => void,
) {
    for (const rank of ranks) {
        const nodes = nodesByRank.get(rank)!;
        if (nodes.length <= 1) continue;

        const groupMembers = new Map<string, string[]>();
        for (const nodeId of nodes) {
            const groupKey = nodeMultipleGroup.get(nodeId);
            if (!groupKey) continue;
            if (!groupMembers.has(groupKey)) groupMembers.set(groupKey, []);
            groupMembers.get(groupKey)!.push(nodeId);
        }

        let changed = false;
        for (const [, members] of groupMembers) {
            if (members.length <= 1) continue;

            members.sort((a, b) => {
                const personA = personById.get(Number(a));
                const personB = personById.get(Number(b));
                if (!personA || !personB) return 0;
                const identA = identicalGroupOf.get(personA.id) ?? personA.id;
                const identB = identicalGroupOf.get(personB.id) ?? personB.id;
                if (identA !== identB) return identA - identB;
                return (personA.dob || '').localeCompare(personB.dob || '');
            });

            const memberSet = new Set(members);
            const insertAt = nodes.findIndex((n) => memberSet.has(n));
            const filtered = nodes.filter((n) => !memberSet.has(n));
            filtered.splice(insertAt, 0, ...members);

            nodes.length = 0;
            nodes.push(...filtered);
            changed = true;
        }

        if (changed) applyOrder(nodes);
    }
}
