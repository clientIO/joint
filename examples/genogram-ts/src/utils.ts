import { dia, highlighters } from '@joint/core';
import { MalePerson, FemalePerson, UnknownPerson, IdenticalLink } from './shapes';
import { colors, defaultZIndex } from './theme';
import { PersonNode, ParentChildLink } from './data';

// --- Element creation ---

function computeAge(dob: string, dod?: string): number {
    const birthDate = new Date(dob);
    const endDate = dod ? new Date(dod) : new Date();
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/** Create a JointJS element for a person, choosing the shape by sex (male/female/unknown). */
export function createPersonElement(person: PersonNode): dia.Element {
    const ShapeClass = person.sex === 'M' ? MalePerson : person.sex === 'F' ? FemalePerson : UnknownPerson;
    const birthYear = person.dob ? person.dob.slice(0, 4) : '?';
    const deathYear = person.dod ? person.dod.slice(0, 4) : '*';

    const attrs: Record<string, Record<string, unknown>> = {
        root: { title: `${person.name} (${birthYear}–${deathYear})` },
        name: { text: person.name },
    };
    if (person.dob) {
        attrs.age = { text: String(computeAge(person.dob, person.dod)) };
    }
    return new ShapeClass({ id: String(person.id), attrs });
}

// --- Lineage highlighting ---

const HIGHLIGHT_DIM = 'lineage-dim';
const HIGHLIGHT_FOCUS = 'lineage-focus';

/**
 * Set up hover-based lineage highlighting on the paper.
 * On `element:mouseenter`, ancestors and descendants are kept visible while
 * unrelated cells are dimmed. Related links are brought to the front via
 * z-index offsets. On `element:mouseleave`, all highlights are removed.
 */
export function setupLineageHighlighting(
    paper: dia.Paper,
    graph: dia.Graph,
    getFamilyTree: () => dia.Graph,
) {
    const zByType: Record<string, number> = {
        'genogram.ParentChildLink': defaultZIndex.parentChildLink,
        'genogram.MateLink': defaultZIndex.mateLink,
        'genogram.IdenticalLink': defaultZIndex.identicalLink,
    };

    paper.on('element:mouseenter', (cellView: dia.ElementView) => {
        const familyTree = getFamilyTree();
        const treeEl = familyTree.getCell(cellView.model.id) as dia.Element;
        if (!treeEl) return;

        const relatedElIds = new Set<string>([
            treeEl.id as string,
            ...familyTree.getPredecessors(treeEl).map((el) => el.id as string),
            ...familyTree.getSuccessors(treeEl).map((el) => el.id as string),
        ]);

        highlighters.stroke.add(cellView, 'body', HIGHLIGHT_FOCUS, {
            padding: 1,
            layer: dia.Paper.Layers.BACK,
            attrs: {
                class: 'hover-highlight',
                stroke: colors.highlightStroke,
                strokeWidth: 10,
            }
        });

        for (const el of graph.getElements()) {
            if (relatedElIds.has(el.id as string)) continue;
            const view = paper.findViewByModel(el);
            if (view) {
                highlighters.addClass.add(view, 'root', HIGHLIGHT_DIM, { className: 'dimmed' });
            }
        }

        // Collect related link IDs (non-identical links whose source and
        // target are both related persons).
        const relatedLinkIds = new Set<string>();
        const allLinks = graph.getLinks();
        const identicalLinks: IdenticalLink[] = [];
        for (const link of allLinks) {
            if (link.get('type') === 'genogram.IdenticalLink') {
                identicalLinks.push(link as IdenticalLink);
                continue;
            }
            const sourceId = (link.source() as { id?: string }).id;
            const targetId = (link.target() as { id?: string }).id;
            if (sourceId && relatedElIds.has(sourceId) && targetId && relatedElIds.has(targetId)) {
                relatedLinkIds.add(link.id as string);
            }
        }

        // IdenticalLinks connect two parent-child links (link-to-link).
        // Resolve the twin person IDs from the connected parent-child links
        // and check if both twins are in the related set.
        for (const link of identicalLinks) {
            const pcLinkA = link.getSourceCell() as dia.Link | null;
            const pcLinkB = link.getTargetCell() as dia.Link | null;
            const twinAId = pcLinkA?.getTargetCell()?.id as string | undefined;
            const twinBId = pcLinkB?.getTargetCell()?.id as string | undefined;
            if (twinAId && relatedElIds.has(twinAId) && twinBId && relatedElIds.has(twinBId)) {
                relatedLinkIds.add(link.id as string);
            }
        }

        // Apply z-index boost to related links, dim unrelated ones.
        for (const link of allLinks) {
            if (relatedLinkIds.has(link.id as string)) {
                const z = zByType[link.get('type') as string];
                if (z !== undefined) link.set('z', z + defaultZIndex.focusedOffset);
                continue;
            }
            const view = paper.findViewByModel(link);
            if (view) {
                highlighters.addClass.add(view, 'root', HIGHLIGHT_DIM, { className: 'dimmed' });
            }
        }
    });

    paper.on('element:mouseleave', () => {
        highlighters.addClass.removeAll(paper, HIGHLIGHT_DIM);
        highlighters.stroke.removeAll(paper, HIGHLIGHT_FOCUS);
        for (const link of graph.getLinks()) {
            const z = zByType[link.get('type') as string];
            if (z !== undefined) link.set('z', z);
        }
    });
}

// --- Family tree graph (for lineage traversal) ---

/**
 * Build a lightweight graph containing only person nodes and parent-child links,
 * used for efficient ancestor/descendant traversal via `getPredecessors`/`getSuccessors`.
 */
export function buildFamilyTree(
    persons: PersonNode[],
    parentChildLinks: ParentChildLink[],
): dia.Graph {
    const familyTree = new dia.Graph();
    familyTree.resetCells([
        ...persons.map((p) => new dia.Element({
            id: String(p.id),
            type: 'family-element'
        })),
        ...parentChildLinks.map((rel) => new dia.Link({
            type: 'family-link',
            source: { id: String(rel.parentId) },
            target: { id: String(rel.childId) },
        }))
    ]);
    return familyTree;
}
