import { dia, shapes } from '@joint/core';
import { MalePerson, FemalePerson, UnknownPerson, ParentChildLink, MateLink, IdenticalLink } from './shapes';
import { colors, sizes, linkStyleOverrides } from './theme';
import { getParentChildLinks, getMateLinks, PersonNode } from './data';
import { layoutGenogram } from './layout';
import { createPersonElement, setupLineageHighlighting, buildFamilyTree } from './utils';
import { applySymbolHighlighters } from './highlighters';
import './styles.css';

// --- All available datasets (Vite eager imports) ---
const dataModules = import.meta.glob<PersonNode[]>('./families/*.json', { eager: true, import: 'default' });

function getDataset(filename: string): PersonNode[] {
    const key = `./families/${filename}`;
    const data = dataModules[key];
    if (!data) throw new Error(`Unknown dataset: ${filename}`);
    return data;
}

// --- Paper setup (created once) ---
const cellNamespace = {
    ...shapes,
    genogram: { MalePerson, FemalePerson, UnknownPerson, ParentChildLink, MateLink, IdenticalLink }
};

const graph = new dia.Graph({}, { cellNamespace });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: cellNamespace,
    width: '100%',
    height: '100%',
    gridSize: 1,
    interactive: false,
    async: true,
    frozen: true,
    autoFreeze: true,
    background: { color: colors.paperBackground },
    defaultConnector: {
        name: 'straight',
    },
    defaultConnectionPoint: { name: 'rectangle', args: { useModelGeometry: true } },
    defaultAnchor: {
        name: 'center',
        args: { useModelGeometry: true }
    }
});

document.getElementById('paper-container')!.appendChild(paper.el);

// --- Hover highlighting ---
let familyTree = new dia.Graph();
setupLineageHighlighting(paper, graph, () => familyTree);

// --- Link style state ---
let linkStyle: 'fan' | 'orthogonal' = 'fan';

// --- Build and render a dataset ---
function renderDataset(filename: string) {
    const persons = getDataset(filename);
    const parentChildLinks = getParentChildLinks(persons);
    const mateLinks = getMateLinks(persons);
    const elements: dia.Element[] = persons.map((person) => createPersonElement(person));
    const layoutSizes = { ...sizes, ...linkStyleOverrides[linkStyle] };

    graph.resetCells([]);

    layoutGenogram({
        graph, elements, persons, parentChildLinks, mateLinks, sizes: layoutSizes, linkStyle,
        linkShapes: { ParentChildLink, MateLink, IdenticalLink },
    });

    applySymbolHighlighters(paper, persons);

    familyTree = buildFamilyTree(persons, parentChildLinks);

    paper.transformToFitContent({
        padding: sizes.paperPadding,
        verticalAlign: 'middle',
        horizontalAlign: 'middle',
        useModelGeometry: true,
    });
}

// --- Toggle link style and re-render ---
function toggleLinkStyle(linkStyleOverride?: 'fan' | 'orthogonal') {
    if (linkStyleOverride) {
        linkStyle = linkStyleOverride;
    } else {
        linkStyle = linkStyle === 'fan' ? 'orthogonal' : 'fan';
    }
    linkStyleToggle.textContent = linkStyle === 'fan' ? 'Orthogonal Link Style' : 'Fan Link Style';
    renderDataset(select.value);
}

// --- Dataset picker handler ---
const select = document.getElementById('dataset-select') as HTMLSelectElement;
select.addEventListener('change', () => renderDataset(select.value));

// --- Link style toggle handler ---
const linkStyleToggle = document.getElementById('link-style-toggle') as HTMLButtonElement;
linkStyleToggle.addEventListener('click', () => toggleLinkStyle());

// --- Initial render ---
toggleLinkStyle('fan');

