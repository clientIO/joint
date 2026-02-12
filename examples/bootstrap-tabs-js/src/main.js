import { dia, shapes } from '@joint/core';
import 'bootstrap';
import './styles.css';

const graph = new dia.Graph();

const paper = new dia.Paper({
    el: document.getElementById('diagram'),
    width: 600,
    height: 200,
    model: graph,
    frozen: true,
    sorting: dia.Paper.sorting.APPROX
});

const rect = new shapes.standard.Rectangle({
    position: { x: 100, y: 30 },
    size: { width: 120, height: 40 },
    attrs: {
        body: {
            fill: '#0D6EFD',
            stroke: 'none',
            rx: 2,
            ry: 2
        },
        label: {
            text: 'my box',
            fill: '#FFFFFF'
        }
    }
});

const rect2 = rect.clone();
rect2.translate(300);

const link = new shapes.standard.Link({
    source: { id: rect.id },
    target: { id: rect2.id }
});

graph.addCells([rect, rect2, link]);

document.querySelectorAll('#myTabs button.nav-link').forEach(function (tab) {
    tab.addEventListener('hidden.bs.tab', function (event) {
        switch (event.target.id) {
            case 'main-tab': {
                break;
            }
            case 'jointjs-tab': {
                paper.freeze();
                break;
            }
        }
    });

    tab.addEventListener('shown.bs.tab', function (event) {
        switch (event.target.id) {
            case 'main-tab': {
                break;
            }
            case 'jointjs-tab': {
                paper.unfreeze();
                break;
            }
        }
    });
});

document.getElementById('move-element-button').addEventListener('click', function () {
    rect.translate(0, 20);
});
