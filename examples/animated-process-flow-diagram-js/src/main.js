import { V, dia, shapes, highlighters } from '@joint/core';
import './styles.css';

// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 10,
    async: true,
    frozen: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    clickThreshold: 10,
    defaultConnector: {
        name: 'rounded'
    },
    defaultRouter: {
        name: 'manhattan',
        args: {
            step: 10,
            endDirections: ['bottom'],
            startDirections: ['top'],
            padding: { bottom: 20 }
        }
    }
});

paperContainer.appendChild(paper.el);

const color = '#ff4468';

paper.svg.prepend(
    V.createSVGStyle(`
        .joint-element .selection {
            stroke: ${color};
        }
        .joint-link .selection {
            stroke: ${color};
            stroke-dasharray: 5;
            stroke-dashoffset: 10;
            animation: dash 0.5s infinite linear;
        }
        @keyframes dash {
            to {
                stroke-dashoffset: 0;
            }
        }
    `)
);

function element(x, y) {
    const el = new shapes.standard.Rectangle({
        position: { x, y },
        size: { width: 100, height: 60 },
        attrs: {
            label: {
                text: `Node ${graph.getElements().length + 1}`,
                fontFamily: 'sans-serif'
            }
        },
        z: 2
    });
    graph.addCell(el);
    return el;
}

function link(target, source) {
    const l = new shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
        z: 1
    });
    graph.addCell(l);
    return l;
}

const el1 = element(300, 50);
const el2 = element(100, 200);
const el3 = element(300, 200);
const el4 = element(500, 200);
const el5 = element(300, 350);
const el6 = element(40, 350);
const el7 = element(160, 350);
const el8 = element(160, 500);

link(el1, el3);
link(el1, el2);
link(el1, el4);
link(el2, el6);
link(el2, el7);
link(el3, el5);
link(el7, el8);

paper.unfreeze();

function getElementPredecessorLinks(el) {
    return graph
        .getSubgraph([el, ...graph.getPredecessors(el)])
        .filter((cell) => cell.isLink());
}

function highlightCell(cell) {
    highlighters.addClass.add(
        cell.findView(paper),
        cell.isElement() ? 'body' : 'line',
        'selection',
        { className: 'selection' }
    );
}

function unhighlightCell(cell) {
    highlighters.addClass.remove(cell.findView(paper), 'selection');
}

let selection = null;

function selectElement(el) {
    if (selection === el) return;
    if (selection) {
        unhighlightCell(selection);
        graph.getLinks().forEach((link) => unhighlightCell(link));
    }
    if (el) {
        highlightCell(el);
        getElementPredecessorLinks(el).forEach((link) => highlightCell(link));
        selection = el;
    } else {
        selection = null;
    }
}

paper.on('element:pointerclick', (elementView) =>
    selectElement(elementView.model)
);
paper.on('blank:pointerclick', (elementView) => selectElement(null));

selectElement(el2);
