import { g, dia, shapes, highlighters } from '@joint/core';
import './styles.css';

// Paper

const paperContainer = document.getElementById('paper-container');

const highlighterId = 'embedding';

const highlighterOptions = {
    padding: 2,
    attrs: {
        'stroke-width': 3,
        stroke: '#7c68fc'
    }
};

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 1,
    drawGrid: { name: 'mesh' },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    embeddingMode: true,
    frontParentOnly: false,
    clickThreshold: 10,
    highlighting: {
        embedding: {
            name: 'mask',
            options: highlighterOptions
        }
    },
    validateEmbedding: (childView, parentView) => isContainer(parentView.model)
});

paperContainer.appendChild(paper.el);

// Elements

const r1 = new shapes.standard.Rectangle({
    position: { x: 100, y: 100 },
    size: { width: 200, height: 100 },
    z: -1,
    attrs: {
        body: {
            stroke: '#999',
            fill: '#f5f5f5'
        }
    }
});

r1.addTo(graph);

const r2 = r1.clone().set({
    position: { x: 400, y: 400 }
});

r2.addTo(graph);

const c1 = new shapes.standard.Circle({
    position: { x: 100, y: 400 },
    size: { width: 50, height: 50 }
});

c1.addTo(graph);

const c2 = c1.clone().set({
    position: { x: 400, y: 100 }
});

c2.addTo(graph);

const c3 = c1.clone().set({
    position: { x: 450, y: 150 }
});

c3.addTo(graph);

// Events

paper.on('element:pointermove', function(elementView, evt, x, y) {
    const element = elementView.model;
    if (!isContainer(element)) return;

    // The elementView is a container.

    const elementsUnder = getElementsUnderElement(paper, element);
    let found = false;
    if (!elementsUnder.find((el) => isContainer(el))) {
        // There is no other container under the elementView
        found = getNewEmbeds(elementsUnder, element).length > 0;
    }

    elementView.el.style.opacity = 0.7;

    if (found) {
        // and position it over elements that could be
        // embedded into the elementView
        highlighters.mask.add(
            elementView,
            'body',
            highlighterId,
            highlighterOptions
        );
    } else {
        // There is no element under the elementView
        // that could be embedded to it
        highlighters.mask.remove(elementView, highlighterId);
    }
});

paper.on('element:pointerup', function(elementView, evt, x, y) {
    const element = elementView.model;
    const elementsUnder = getElementsUnderElement(paper, element);
    const parent = elementsUnder.findLast((el) => isContainer(el));

    if (!isContainer(element)) {
        // The elementView is not a container
        if (parent) {
            // If an element is embedded into another we make sure
            // the container is large enough to contain all the embeds
            resizeContainer(graph, parent);
        }
        return;
    }

    // The elementView is a container

    element.set('z', -1);
    elementView.el.style.opacity = '';
    highlighters.mask.remove(elementView, highlighterId);

    if (parent) {
        // The elementView was embedded into another container
        if (elementsUnder.length > 1) {
            // The container has already children and some of them
            // are located under the elementView.
            // Let's make sure none of the children stays under
            // elementView
            layoutEmbeds(graph, parent);
        }
        // If an element is embedded into another we make sure
        // the container is large enough to contain all the embeds
        resizeContainer(graph, parent);
        return;
    }

    // The elementView has not been embedded
    // We check the elements under the elementView which are not
    // containers and embed them into elementView.
    const newEmbeds = getNewEmbeds(elementsUnder, element);
    if (newEmbeds.length > 0) {
        element.embed(newEmbeds);
        resizeContainer(graph, element);
    }
});

paper.on('element:pointerdblclick', (elementView) => {
    const element = elementView.model;
    if (!isContainer(element)) return;
    resizeContainer(graph, element, false);
});

// Functions

function isContainer(element) {
    return element.get('type') === 'standard.Rectangle';
}

function resizeContainer(graph, container, increaseOnly = true, padding = 20) {
    const embeds = container.getEmbeddedCells();
    const currentBBox = container.getBBox();
    let bbox;
    if (embeds.length === 0) {
        bbox = new g.Rect(currentBBox.x, currentBBox.y, 200, 100);
    } else {
        bbox = graph.getCellsBBox(embeds).inflate(padding);
        if (increaseOnly) {
            bbox = bbox.union(currentBBox);
        }
    }
    container.position(bbox.x, bbox.y);
    container.resize(bbox.width, bbox.height);
    const parent = container.getParentCell();
    if (parent) {
        resizeContainer(graph, parent, increaseOnly, padding);
    }
}

function layoutEmbeds(graph, container, gap = 10) {
    let x = gap;
    container.getEmbeddedCells().forEach((el) => {
        el.position(x, gap, { deep: true, parentRelative: true });
        x += el.size().width + gap;
    });
}

function getElementsUnderElement(paper, element) {
    const { model: graph } = paper;
    return graph.findModelsUnderElement(element, {
        searchBy: paper.options.findParentBy
    });
}

function getNewEmbeds(elementsUnder, element) {
    if (element.isEmbedded()) return [];
    return elementsUnder.filter((el) => {
        if (el.isEmbedded()) return false;
        return true;
    });
}
