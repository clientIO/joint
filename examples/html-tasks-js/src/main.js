import { dia, V, shapes } from '@joint/core';
import { HtmlElement, HtmlElementView } from './shapes';
import './styles.css';

// Notes:
// - It's not possible to use SVG/Raster export plugins with HTML shapes
// - Links stacking order is limited to be either above or below HTML elements
// - Ports are partially hidden below the HTML elements by default
// - Do not use CSS background on the root HTML element when using ports

const namespace = {
    ...shapes,
    html: {
        Element: HtmlElement,
        ElementView: HtmlElementView
    }
}

const graph = new dia.Graph({}, { cellNamespace: namespace });
const paper = new dia.Paper({
    el: document.getElementById('paper-container'),
    width: 850,
    height: 600,
    model: graph,
    cellViewNamespace: namespace,
    async: true,
    frozen: true,
    sorting: dia.Paper.sorting.NONE
});

// Container for all HTML views inside paper
const htmlContainer = document.createElement('div');
htmlContainer.style.pointerEvents = 'none';
htmlContainer.style.position = 'absolute';
htmlContainer.style.inset = '0';
paper.el.appendChild(htmlContainer);
paper.htmlContainer = htmlContainer;

paper.on('transform', function() {
    // Update the transformation of all JointJS HTML Elements
    const htmlContainer = this.htmlContainer;
    htmlContainer.style.transformOrigin = '0 0';
    htmlContainer.style.transform = V.matrixToTransformString(this.matrix());
});

paper.on('blank:pointerdown cell:pointerdown', function() {
    document.activeElement.blur();
});

const el1 = new HtmlElement({
    position: { x: 16, y: 150 },
    fields: {
        name: 'Create Story',
        resource: 'bob',
        state: 'done'
    }
});

const el2 = new HtmlElement({
    position: { x: 298, y: 150 },
    fields: {
        name: 'Promote',
        resource: 'mary'
    }
});

const el3 = new HtmlElement({
    position: { x: 580, y: 150 },
    fields: {
        name: 'Measure',
        resource: 'john',
        state: 'at-risk'
    }
});

const l1 = new shapes.standard.Link({
    source: { id: el1.id },
    target: { id: el2.id },
    attrs: {
        line: {
            stroke: '#464554'
        }
    }
});

const l2 = new shapes.standard.Link({
    source: { id: el2.id },
    target: { id: el3.id },
    attrs: {
        line: {
            stroke: '#464554'
        }
    }
});

graph.resetCells([el1, el2, el3, l1, l2]);

paper.unfreeze();

// Toolbar
let zoomLevel = 1;

const center = paper.getArea().center();

document.getElementById('zoom-in').addEventListener('click', function() {
    zoomLevel = Math.min(3, zoomLevel + 0.2);
    paper.scaleUniformAtPoint(zoomLevel, center);
});

document.getElementById('zoom-out').addEventListener('click', function() {
    zoomLevel = Math.max(0.2, zoomLevel - 0.2);
    paper.scaleUniformAtPoint(zoomLevel, center);
});

document.getElementById('reset').addEventListener('click', function() {
    graph.getElements().forEach(function(element) {
        element.prop(['fields', 'name'], '');
        element.prop(['fields', 'resource'], '');
        element.prop(['fields', 'state'], '');
    });
});
