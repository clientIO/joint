import { dia, shapes } from '@joint/core';
import { DirectedGraph } from '@joint/layout-directed-graph';
import { PersonNode, ParentChildLink, MateLink } from '../data';
import { sizes as themeSizes } from '../theme';
import { minimizeCrossings } from './minimize-crossings';

type LinkConstructor = new (attrs: Record<string, unknown>) => dia.Link;

interface LayoutSizes {
    symbolWidth: number;
    symbolHeight: number;
    coupleGap: number;
    symbolGap: number;
    levelGap: number;
    nameMaxLineCount: number;
}

interface LayoutInput {
    graph: dia.Graph;
    elements: dia.Element[];
    persons: PersonNode[];
    parentChildLinks: ParentChildLink[];
    mateLinks: MateLink[];
    sizes: LayoutSizes;
    linkStyle?: 'fan' | 'orthogonal';
    linkShapes?: {
        ParentChildLink?: LinkConstructor;
        MateLink?: LinkConstructor;
        IdenticalLink?: LinkConstructor;
    };
}

// Layout a genogram as a directed graph (top-to-bottom family tree).
//
// The layout is performed in 5 steps:
//
// 1. COUPLE CONTAINERS — Replace each mated pair with a single wide rectangle
//    so dagre treats the couple as one node and keeps partners side by side.
//
// 2. DAGRE LAYOUT — Run DirectedGraph.layout on the containers, solo elements,
//    and deduplicated links (one edge per couple→child, not two). Custom
//    crossing minimization handles ordering.
//
// 3. COUPLE POSITIONING — Place each partner inside their container (left/right
//    decided by which partner's parents are further left in the layout).
//
// 4. LINK RECONNECTION & ROUTING — Reconnect links from containers back to the
//    real person elements. Add vertices so links route through the couple
//    midpoint, with a shared fork point for twins/triplets.
//
// 5. MATE & IDENTICAL LINKS — Add horizontal mate (partner) links and dashed
//    link-to-link connections between identical twins/triplets.
//
export function layoutGenogram({ graph, elements, persons, parentChildLinks, mateLinks, sizes, linkStyle = 'fan', linkShapes }: LayoutInput): void {

    const ParentChildLinkShape = linkShapes?.ParentChildLink ?? shapes.standard.Link as unknown as LinkConstructor;
    const MateLinkShape = linkShapes?.MateLink ?? shapes.standard.Link as unknown as LinkConstructor;
    const IdenticalLinkShape = linkShapes?.IdenticalLink ?? shapes.standard.Link as unknown as LinkConstructor;

    const personById = new Map<number, PersonNode>();
    for (const person of persons) {
        personById.set(person.id, person);
    }

    // -----------------------------------------------------------------------
    // Step 1: Couple containers
    // -----------------------------------------------------------------------
    // For each mated pair, create an invisible rectangle (couple container)
    // that is wide enough to hold both partners side by side. During layout,
    // dagre sees this single node instead of two separate ones — this keeps
    // partners on the same rank and horizontally adjacent.

    const coupleContainers: dia.Element[] = [];
    const personIdToContainer = new Map<string, dia.Element>();
    const mateOf = new Map<string, string>();
    const coupledPersonIds = new Set<string>();

    interface CoupleInfo {
        container: dia.Element;
        fromId: string;
        toId: string;
    }
    const coupleInfos: CoupleInfo[] = [];

    for (const ml of mateLinks) {
        const fromId = String(ml.from);
        const toId = String(ml.to);

        if (coupledPersonIds.has(fromId) || coupledPersonIds.has(toId)) continue;

        const extraWidth = linkStyle === 'orthogonal' ? sizes.symbolWidth : 0;
        const container = new shapes.standard.Rectangle({
            size: { width: sizes.symbolWidth * 2 + sizes.coupleGap + extraWidth, height: sizes.symbolHeight },
        });

        coupledPersonIds.add(fromId);
        coupledPersonIds.add(toId);
        mateOf.set(fromId, toId);
        mateOf.set(toId, fromId);
        personIdToContainer.set(fromId, container);
        personIdToContainer.set(toId, container);
        coupleContainers.push(container);
        coupleInfos.push({ container, fromId, toId });
    }

    // Resolve the layout ID for a person: container if coupled, own ID otherwise.
    function layoutId(personElId: string): string {
        const container = personIdToContainer.get(personElId);
        return container ? container.id as string : personElId;
    }

    // Solo (non-coupled) person elements participate in layout directly.
    const soloElements = elements.filter((el) => !coupledPersonIds.has(el.id as string));

    // Identical twin/triplet group maps (used by crossing minimization).
    const identicalGroupOf = new Map<number, number>();
    for (const person of persons) {
        if (person.identical !== undefined) {
            const groupId = Math.min(person.id, person.identical);
            identicalGroupOf.set(person.id, groupId);
            identicalGroupOf.set(person.identical, groupId);
        }
    }

    // Key = parentLayoutId|multipleNumber, so siblings from the same parents
    // with the same `multiple` value are grouped together.
    const nodeMultipleGroup = new Map<string, string>();
    for (const person of persons) {
        if (person.multiple === undefined) continue;
        const nodeId = layoutId(String(person.id));
        const parentLayoutNodeId = person.mother
            ? layoutId(String(person.mother))
            : person.father
                ? layoutId(String(person.father))
                : '';
        nodeMultipleGroup.set(nodeId, `${parentLayoutNodeId}|${person.multiple}`);
    }

    // -----------------------------------------------------------------------
    // Step 2: Dagre layout
    // -----------------------------------------------------------------------
    // Create JointJS links pointing to layout nodes (containers or solo elements).
    // Deduplicate: when both parents share a container, only one layout edge is
    // needed (dagre does not handle duplicate edges well).

    interface LinkInfo {
        link: dia.Link;
        realSourceId: string;
        realTargetId: string;
    }
    const linkInfos: LinkInfo[] = [];
    const layoutEdgeSet = new Set<string>();
    for (const rel of parentChildLinks) {
        const realSourceId = String(rel.parentId);
        const realTargetId = String(rel.childId);
        const srcLayout = layoutId(realSourceId);
        const tgtLayout = layoutId(realTargetId);
        const edgeKey = `${srcLayout}→${tgtLayout}`;
        const isDuplicate = layoutEdgeSet.has(edgeKey);
        layoutEdgeSet.add(edgeKey);

        const link = new ParentChildLinkShape({
            source: { id: srcLayout },
            target: { id: tgtLayout },
        });
        linkInfos.push({ link, realSourceId, realTargetId });
        if (isDuplicate) {
            (link as any)._layoutDuplicate = true;
        }
    }
    const links = linkInfos.map((li) => li.link);
    const layoutLinks = links.filter((l) => !(l as any)._layoutDuplicate);

    graph.resetCells([...coupleContainers, ...soloElements, ...layoutLinks]);

    DirectedGraph.layout(graph, {
        rankDir: 'TB',
        nodeSep: sizes.symbolGap,
        rankSep: sizes.levelGap,
        customOrder: (glGraph, jointGraph, defaultOrder) => minimizeCrossings(glGraph, jointGraph, defaultOrder, {
            parentChildLinks, layoutId, personById, identicalGroupOf, nodeMultipleGroup,
        }),
    });

    // Add duplicate links back (they were excluded from layout).
    const duplicateLinks = links.filter((l) => (l as any)._layoutDuplicate);
    if (duplicateLinks.length > 0) {
        graph.addCells(duplicateLinks);
    }

    // -----------------------------------------------------------------------
    // Step 3: Couple positioning
    // -----------------------------------------------------------------------
    // Place each partner inside their container. The partner whose parents are
    // further left goes on the left side.

    const gap = sizes.coupleGap;

    function getParentX(personElId: string): number {
        const person = personById.get(Number(personElId));
        if (!person) return Infinity;
        const parentIds: number[] = [];
        if (typeof person.mother === 'number') parentIds.push(person.mother);
        if (typeof person.father === 'number') parentIds.push(person.father);
        if (parentIds.length === 0) return Infinity;

        let sum = 0;
        let count = 0;
        for (const pid of parentIds) {
            const parentLayoutNodeId = layoutId(String(pid));
            const parentCell = graph.getCell(parentLayoutNodeId) as dia.Element;
            if (parentCell) {
                sum += parentCell.getCenter().x;
                count++;
            }
        }
        return count > 0 ? sum / count : Infinity;
    }

    for (const { container, fromId, toId } of coupleInfos) {
        const pos = container.position();
        const fromEl = elements.find((e) => e.id === fromId)!;
        const toEl = elements.find((e) => e.id === toId)!;

        const fromParentX = getParentX(fromId);
        const toParentX = getParentX(toId);

        const [leftEl, rightEl] = fromParentX <= toParentX
            ? [fromEl, toEl]
            : [toEl, fromEl];

        const inset = linkStyle === 'orthogonal' ? sizes.symbolWidth / 2 : 0;
        leftEl.position(pos.x + inset, pos.y);
        rightEl.position(pos.x + inset + sizes.symbolWidth + gap, pos.y);

        if (linkStyle === 'orthogonal') {
            const nameOverrides = {
                textWrap: { maxLineCount: sizes.nameMaxLineCount },
            };
            leftEl.attr('name', { ...nameOverrides, textAnchor: 'end', x: `calc(w / 2 - ${themeSizes.nameMargin})` });
            rightEl.attr('name', { ...nameOverrides, textAnchor: 'start', x: `calc(w / 2 + ${themeSizes.nameMargin})` });
        }
    }

    const coupledElements = elements.filter((el) => coupledPersonIds.has(el.id as string));
    graph.addCells(coupledElements);

    // -----------------------------------------------------------------------
    // Step 4: Link reconnection & routing
    // -----------------------------------------------------------------------
    // Links currently point to containers. Reconnect them to the real person
    // elements and add vertices so each link routes through the couple midpoint
    // (the point between the two partners). For twins/triplets, links share a
    // common fork point at the average X of the group members.

    function twinGroupKey(sourceContainerId: string, targetPersonId: string): string | null {
        const person = personById.get(Number(targetPersonId));
        if (!person || person.multiple === undefined) return null;
        return `${sourceContainerId}|${person.multiple}`;
    }

    const containerIdSet = new Set(coupleContainers.map((c) => c.id as string));

    // Pre-compute twin/triplet fork points (average X of group members).
    const twinGroupMembers = new Map<string, string[]>();
    for (const { realSourceId, realTargetId } of linkInfos) {
        const sourceContainer = personIdToContainer.get(realSourceId);
        if (!sourceContainer) continue;
        const gKey = twinGroupKey(sourceContainer.id as string, realTargetId);
        if (!gKey) continue;
        const members = twinGroupMembers.get(gKey) || [];
        members.push(realTargetId);
        twinGroupMembers.set(gKey, members);
    }

    const twinGroupForkX = new Map<string, number>();
    for (const [gKey, memberIds] of twinGroupMembers) {
        if (memberIds.length < 2) continue;
        const uniqueIds = [...new Set(memberIds)];
        const avgX = uniqueIds.reduce((sum, id) => {
            return sum + (graph.getCell(id) as dia.Element).getCenter().x;
        }, 0) / uniqueIds.length;
        twinGroupForkX.set(gKey, avgX);
    }

    for (const { link, realSourceId, realTargetId } of linkInfos) {
        const sourceLayoutId = (link.source() as { id: string }).id;
        const targetLayoutId = (link.target() as { id: string }).id;
        const sourceWasContainer = containerIdSet.has(sourceLayoutId);
        const targetWasContainer = containerIdSet.has(targetLayoutId);

        // Reconnect to real person elements.
        link.source({ id: realSourceId });
        link.target({
            id: realTargetId,
            anchor: { name: 'top', args: { useModelGeometry: true } }
         });

        // Route through couple midpoint when source was a container.
        if (sourceWasContainer) {
            const partnerId = mateOf.get(realSourceId)!;
            const sourceEl = graph.getCell(realSourceId) as dia.Element;
            const partnerEl = graph.getCell(partnerId) as dia.Element;
            const targetEl = graph.getCell(realTargetId) as dia.Element;

            const sourceCenter = sourceEl.getCenter();
            const partnerCenter = partnerEl.getCenter();
            const targetCenter = targetEl.getCenter();

            const midX = (sourceCenter.x + partnerCenter.x) / 2;
            const midY = (sourceCenter.y + partnerCenter.y) / 2;

            const gKey = twinGroupKey(sourceLayoutId, realTargetId);
            const forkX = gKey ? twinGroupForkX.get(gKey) : undefined;

            if (linkStyle === 'orthogonal') {
                const thirdY = midY + (targetCenter.y - midY) / 3;
                const twoThirdsY = midY + 2 * (targetCenter.y - midY) / 3;
                const endX = forkX !== undefined ? forkX : targetCenter.x;
                link.vertices([
                    { x: sourceCenter.x, y: thirdY },
                    { x: midX, y: thirdY },
                    { x: midX, y: twoThirdsY },
                    { x: endX, y: twoThirdsY }
                ]);
            } else {
                const halfwayY = (midY + targetCenter.y) / 2;
                if (forkX !== undefined) {
                    link.vertices([
                        { x: midX, y: midY },
                        { x: midX, y: halfwayY },
                        { x: forkX, y: halfwayY }
                    ]);
                } else {
                    link.vertices([
                        { x: midX, y: midY },
                        { x: midX, y: halfwayY },
                        { x: targetCenter.x, y: halfwayY }
                    ]);
                }
            }
        }

        // Route into the correct person when target was a container.
        if (targetWasContainer && !sourceWasContainer) {
            const targetEl = graph.getCell(realTargetId) as dia.Element;
            const targetCenter = targetEl.getCenter();
            const sourceEl = graph.getCell(realSourceId) as dia.Element;
            const sourceCenter = sourceEl.getCenter();

            if (linkStyle === 'orthogonal') {
                const midY = sourceCenter.y + sourceEl.size().height / 2;
                const thirdY = midY + (targetCenter.y - midY) / 3;
                link.vertices([
                    { x: sourceCenter.x, y: thirdY },
                    { x: targetCenter.x, y: thirdY }
                ]);
            } else {
                const halfwayY = (sourceCenter.y + targetCenter.y) / 2;
                link.vertices([
                    { x: sourceCenter.x, y: halfwayY },
                    { x: targetCenter.x, y: halfwayY }
                ]);
            }
        }
    }

    // Containers are no longer needed.
    for (const container of coupleContainers) {
        container.remove();
    }

    // -----------------------------------------------------------------------
    // Step 5: Mate & identical links
    // -----------------------------------------------------------------------
    // Add horizontal mate links between partners and dashed link-to-link
    // connections between identical twins/triplets. These are visual-only and
    // were not part of the dagre layout (they would break the DAG structure).

    const mateJointLinks: dia.Link[] = mateLinks.map((ml) => {
        return new MateLinkShape({
            source: {
                id: String(ml.from),
                anchor: { name: 'center', args: { useModelGeometry: true } }
            },
            target: {
                id: String(ml.to),
                anchor: { name: 'center', args: { useModelGeometry: true } }
            },
        });
    });

    if (mateJointLinks.length > 0) {
        graph.addCells(mateJointLinks);
    }

    // Identical twin/triplet links: connect two parent→child links with a
    // dashed line using connectionRatio anchors (link-to-link connection).
    const ANCHOR_VERTICAL_OFFSET = sizes.levelGap / (linkStyle === 'orthogonal' ? 8 : 4);

    // Compute the ratio along a link's path at a given vertical offset from
    // the target end. Used to position link-to-link anchors consistently.
    function computeAnchorRatio(link: dia.Link, verticalOffset: number): number {
        const sourceEl = graph.getCell((link.source() as { id: string }).id) as dia.Element;
        const targetEl = graph.getCell((link.target() as { id: string }).id) as dia.Element;
        if (!sourceEl || !targetEl) {
            throw new Error(`Link source or target element not found for link ${link.id}`);
        }

        const srcBBox = sourceEl.getBBox();
        const tgtBBox = targetEl.getBBox();
        const srcPt = { x: srcBBox.x + srcBBox.width / 2, y: srcBBox.y + srcBBox.height / 2 };
        const tgtPt = { x: tgtBBox.x + tgtBBox.width / 2, y: tgtBBox.y };
        const vertices = link.vertices() || [];
        const points: { x: number; y: number }[] = [srcPt, ...vertices, tgtPt];

        const segLengths: number[] = [];
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i - 1].x;
            const dy = points[i].y - points[i - 1].y;
            segLengths.push(Math.sqrt(dx * dx + dy * dy));
        }
        const totalLength = segLengths.reduce((a, b) => a + b, 0);
        if (totalLength === 0) return 0.5; // Arbitrary ratio for zero-length links

        // Walk backwards from the target to find the distance at the offset.
        let remainingVertical = verticalOffset;
        let distFromEnd = 0;
        for (let i = points.length - 1; i > 0; i--) {
            const dy = Math.abs(points[i].y - points[i - 1].y);
            const segLen = segLengths[i - 1];
            if (dy >= remainingVertical && dy > 0) {
                distFromEnd += (remainingVertical / dy) * segLen;
                break;
            }
            remainingVertical -= dy;
            distFromEnd += segLen;
        }

        return Math.max(0.01, Math.min(0.99, 1 - distFromEnd / totalLength));
    }

    const childElIdToLink = new Map<string, dia.Link>();
    for (const { link, realTargetId } of linkInfos) {
        if (!childElIdToLink.has(realTargetId)) {
            childElIdToLink.set(realTargetId, link);
        }
    }

    const identicalLinks: dia.Link[] = [];
    const processedIdenticalPairs = new Set<string>();
    for (const person of persons) {
        if (person.identical === undefined) continue;
        const personElId = String(person.id);
        const identicalElId = String(person.identical);

        const pairKey = [person.id, person.identical].sort().join('|');
        if (processedIdenticalPairs.has(pairKey)) continue;
        processedIdenticalPairs.add(pairKey);

        const linkA = childElIdToLink.get(personElId);
        const linkB = childElIdToLink.get(identicalElId);
        if (!linkA || !linkB) continue;

        const ratioA = computeAnchorRatio(linkA, ANCHOR_VERTICAL_OFFSET);
        const ratioB = computeAnchorRatio(linkB, ANCHOR_VERTICAL_OFFSET);

        identicalLinks.push(new IdenticalLinkShape({
            source: { id: linkA.id, anchor: { name: 'connectionRatio', args: { ratio: ratioA } } },
            target: { id: linkB.id, anchor: { name: 'connectionRatio', args: { ratio: ratioB } } },
        }));
    }

    if (identicalLinks.length > 0) {
        graph.addCells(identicalLinks);
    }
}
