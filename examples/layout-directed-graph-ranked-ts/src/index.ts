import { dia, shapes } from '@joint/core';
import { DirectedGraph } from '@joint/layout-directed-graph';
import './styles.css';

interface Step {
    id: string;
    label: string;
    // The rank is given by the application, not computed by the layout.
    rank: number;
    parent?: string;
}

interface Flow {
    source: string;
    target: string;
}

// Rank 3 is left empty on purpose.
const steps: Step[] = [
    { id: 'requirements', label: 'Requirements', rank: 0 },
    { id: 'design', label: 'Design', rank: 0 },
    { id: 'frontend', label: 'Frontend', rank: 1, parent: 'build' },
    { id: 'backend', label: 'Backend', rank: 1, parent: 'build' },
    { id: 'unit-tests', label: 'Unit tests', rank: 2 },
    { id: 'e2e-tests', label: 'E2E tests', rank: 2 },
    { id: 'release', label: 'Release', rank: 4 }
];

const flows: Flow[] = [
    { source: 'requirements', target: 'frontend' },
    { source: 'requirements', target: 'backend' },
    { source: 'design', target: 'frontend' },
    // Within one rank: not laid out, drawn as a straight line.
    { source: 'frontend', target: 'backend' },
    { source: 'frontend', target: 'unit-tests' },
    { source: 'backend', target: 'unit-tests' },
    { source: 'backend', target: 'e2e-tests' },
    // Backward: to an earlier rank.
    { source: 'e2e-tests', target: 'backend' },
    // Over the empty rank.
    { source: 'unit-tests', target: 'release' },
    { source: 'e2e-tests', target: 'release' },
    // Over several ranks.
    { source: 'design', target: 'release' }
];

const rankColors = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'];

const graph = new dia.Graph({}, { cellNamespace: shapes });

const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: 800,
    height: 600,
    async: true,
    frozen: true,
    interactive: false,
    background: { color: '#f8fafc' },
    defaultConnector: {
        name: 'straight',
        args: { cornerType: 'cubic', cornerRadius: 8 }
    }
});

document.getElementById('canvas')!.appendChild(paper.el);

function createStep({ id, label, rank, parent }: Step): dia.Element {
    return new shapes.standard.Rectangle({
        id,
        rank,
        parent,
        size: { width: 120, height: 44 },
        z: 2,
        attrs: {
            body: {
                fill: rankColors[rank % rankColors.length],
                stroke: 'none',
                rx: 6,
                ry: 6
            },
            label: {
                text: `${label}\nrank ${rank}`,
                fill: rank < 2 ? '#fff' : '#1e293b',
                fontSize: 13,
                fontFamily: 'sans-serif'
            }
        }
    });
}

function createCluster(id: string, label: string, embeds: string[]): dia.Element {
    return new shapes.standard.Rectangle({
        id,
        embeds,
        z: 1,
        attrs: {
            body: {
                fill: '#e2e8f0',
                stroke: '#94a3b8',
                strokeDasharray: '4 3',
                rx: 8,
                ry: 8
            },
            label: {
                text: label,
                fill: '#475569',
                fontSize: 13,
                fontFamily: 'sans-serif',
                textVerticalAnchor: 'top',
                y: 8
            }
        }
    });
}

function createFlow({ source, target }: Flow): dia.Link {
    const sourceStep = steps.find((step) => step.id === source)!;
    const targetStep = steps.find((step) => step.id === target)!;
    const backward = targetStep.rank < sourceStep.rank;
    return new shapes.standard.Link({
        source: { id: source },
        target: { id: target },
        z: 3,
        attrs: {
            line: {
                stroke: backward ? '#e76f51' : '#64748b',
                strokeWidth: 1.5,
                strokeDasharray: backward ? '5 4' : 'none'
            }
        }
    });
}

const buildSteps = steps.filter((step) => step.parent === 'build').map((step) => step.id);

graph.resetCells([
    createCluster('build', 'Build', buildSteps),
    ...steps.map(createStep),
    ...flows.map(createFlow)
]);

const rankDirSelect = document.getElementById('rank-dir') as HTMLSelectElement;
const emptyRankSizeInput = document.getElementById('empty-rank-size') as HTMLInputElement;

function layout() {
    const emptyRankSize = emptyRankSizeInput.value === '' ? undefined : Number(emptyRankSizeInput.value);
    DirectedGraph.layout(graph, {
        ranker: 'fixed',
        rankDir: rankDirSelect.value as DirectedGraph.LayoutOptions['rankDir'],
        // Without it, an empty rank is as large as `rankSep`.
        emptyRankSize,
        rankSep: 60,
        nodeSep: 30,
        clusterPadding: { top: 32, left: 12, right: 12, bottom: 12 },
        setVertices: true,
        exportElement: (element) => ({ ...element.size(), rank: element.get('rank') })
    });
    paper.fitToContent({ padding: 40, allowNewOrigin: 'any', useModelGeometry: true });
}

rankDirSelect.addEventListener('change', layout);
emptyRankSizeInput.addEventListener('input', layout);

layout();
paper.unfreeze();
