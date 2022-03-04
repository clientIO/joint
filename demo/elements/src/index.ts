import { dia } from 'jointjs';
import LinkedProcess from './linked-process';
import Input from './input';
import Mark from './mark';
import Actor from './actor';

const namespace = {
    LinkedProcess,
    Input,
    Mark,
    Actor,
};

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

paper.el.style.border = '1px solid #e2e2e2';

const MARGIN = 10;
const COLUMNS_COUNT = 4;
const COLUMNS_GAP = 200;
const ROW_GAP = 100;

const elements = Object.keys(namespace).map((name, index) => {
    const Constructor = namespace[name];
    const col = index % COLUMNS_COUNT;
    const row = Math.floor(index / COLUMNS_COUNT);
    const element = new Constructor({
        attrs: {
            root: {
                title: `Requirements: JointJS v${Constructor.version}`,
                tabindex: index + 1
            }
        }
    });
    const { width, height } = element.size();
    element.position(
        MARGIN + col * COLUMNS_GAP + (COLUMNS_GAP - width) / 2,
        MARGIN + row * ROW_GAP + (ROW_GAP - height) / 2
    );
    return element;
});

graph.resetCells(elements);

paper.unfreeze();
