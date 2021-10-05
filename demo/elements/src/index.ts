import { dia } from 'jointjs';
import LinkedProcess from './linked-process';
import Input from './input';
import Mark from './mark';

const namespace = {
    LinkedProcess,
    Input,
    Mark,
}

const graph = new dia.Graph({}, { cellNamespace: namespace });

const paper = new dia.Paper({
    cellViewNamespace: namespace,
    el: document.getElementById('paper'),
    width: 800,
    height: 800,
    model: graph,
    frozen: true,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    interactive: false,
    guard: () => true,
    background: {
        color: '#F3F7F6'
    }
});

paper.el.style.border = `1px solid #e2e2e2`;

const COLUMNS_COUNT = 4;
const COLUMNS_GAP = 200;
const ROW_GAP = 100;

const elements = Object.keys(namespace).map((name, index) => {
    const Constructor = namespace[name];
    const col = index % COLUMNS_COUNT;
    const row = Math.floor(index / COLUMNS_COUNT);
    return new Constructor({
        position: {
            x: 10 + col * COLUMNS_GAP,
            y: 10 + row * ROW_GAP
        },
        attrs: {
            root: {
                title: `Requirements: JointJS v${Constructor.version}`,
                tabindex: index + 1
            }
        }
    });
});

graph.resetCells(elements);

paper.unfreeze();
