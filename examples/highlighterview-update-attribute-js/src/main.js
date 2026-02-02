import { dia, shapes } from '@joint/core';
import './styles.css';

// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 20,
    drawGrid: { name: 'mesh' },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' }
});

paperContainer.appendChild(paper.el);

function setCounterValue(value) {
    counterValueSpan.innerText = value;
    counterRange.value = value;
    graph.getElements().forEach((element) => {
        element.set('counter', value);
    });
}

const defaultCounterVal = 1;
const counterValueSpan = document.querySelector('#counter-value');
const counterRange = document.querySelector('#counter-range');
setCounterValue(defaultCounterVal);

counterRange.addEventListener('input', ({ target: { value }}) =>
    setCounterValue(value)
);

const color = '#0057FF';
const errorColor = '#FF0000';

const CounterHighlighter = dia.HighlighterView.extend({
    UPDATE_ATTRIBUTES: ['counter'],
    tagName: 'g',
    children: [
        {
            tagName: 'rect',
            selector: 'background',
            attributes: {
                x: -10,
                y: -10,
                rx: 10,
                ry: 10,
                height: 20,
                'stroke-width': 0
            }
        },
        {
            tagName: 'text',
            selector: 'label',
            attributes: {
                x: 0,
                y: '.3em',
                fill: '#ffffff',
                'font-size': 11,
                'font-family': 'monospace'
            }
        }
    ],
    highlight: function(cellView) {
        this.renderChildren();
        const { background, label } = this.childNodes;
        const { model } = cellView;
        const counter = model.get('counter');
        const [body] = cellView.findBySelector('body');
        if (counter == 0) {
            background.setAttribute('width', 100);
            background.setAttribute('fill', errorColor);
            label.setAttribute('text-anchor', 'start');
            label.textContent = 'Out of Stock';
            // Override the stroke color of the cellView body using CSS.
            body.style.stroke = errorColor;
        } else {
            background.setAttribute('width', 20);
            background.setAttribute('fill', color);
            label.setAttribute('text-anchor', 'middle');
            label.textContent = counter;
            // Reset the stroke color of the cellView body.
            // The color defined on the model will be used.
            body.style.stroke = '';
        }
    }
});

const rect = new shapes.standard.Rectangle({
    size: { width: 100, height: 100 },
    position: { x: 100, y: 100 },
    counter: defaultCounterVal,
    attrs: {
        body: {
            strokeWidth: 4
        }
    }
});

rect.addTo(graph);

CounterHighlighter.add(rect.findView(paper), 'root', 'links');
