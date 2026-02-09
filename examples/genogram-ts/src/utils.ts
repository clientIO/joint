import { dia, highlighters } from '@joint/core';
import { MalePerson, FemalePerson, UnknownPerson } from './shapes';
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

        for (const link of graph.getLinks()) {
            const sourceId = (link.source() as { id?: string }).id;
            const targetId = (link.target() as { id?: string }).id;
            const sourceRelated = sourceId ? relatedElIds.has(sourceId) : false;
            const targetRelated = targetId ? relatedElIds.has(targetId) : false;
            if (sourceRelated && targetRelated) {
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
