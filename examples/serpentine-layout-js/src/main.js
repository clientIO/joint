import { dia, shapes as defaultShapes, util, connectors } from '@joint/core';
import './styles.css';

const shapes = { ...defaultShapes };

// Paper

const paperContainer = document.getElementById("paper-container");

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: "100%",
    gridSize: 20,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    defaultConnector: { name: 'curve' },
    defaultConnectionPoint: {
        name: 'anchor'
    },
    background: {
        color: '#fff'
    }

});

paperContainer.appendChild(paper.el);

function serpentineLayout(graph, elements, options = {}) {
    const {
        gap = 20,
        width = 1000,
        rowHeight = 100,
        x = 0,
        y = 0,
        alignRowLastElement = false
    } = options;
    const linkProps = [];
    const elementProps = [];
    let currentX = x;
    let currentY = y + rowHeight / 2;
    let leftToRight = true;
    let index = 0;
    // Find the links that connect the elements in the order they are in the array.
    const links = [];
    elements.forEach((el, i) => {
        const nextEl = elements[i + 1];
        if (!nextEl) return;
        const link = graph.getConnectedLinks(el, { outbound: true }).find(l => l.target().id === nextEl.id);
        if (link) links.push(link);
    });
    // Calculate the positions of the elements and the links.
    while (index < elements.length) {
        const item = elements[index];
        const size = item.size();
        if (leftToRight) {
            if (currentX + size.width > x + width) {
                // Not enough space on the right. Move to the next row.
                // The current element will be processed in the next iteration.
                currentX = x + width;
                currentY += rowHeight;
                leftToRight = false;
                if (index > 0) {
                    linkProps[index - 1] = {
                        source: { anchor: { name: 'right' } },
                        target: { anchor: { name: 'right' } },
                    };
                    if (alignRowLastElement) {
                        // Adjust the position of the previous element to make sure
                        // it is aligned with the right edge of the result.
                        elementProps[elementProps.length - 1].position.x = Math.max(
                            x + width - elements[elementProps.length - 1].size().width,
                            x
                        );
                    }
                }
            }
        } else {
            if (currentX - size.width < x) {
                // Not enough space on the left. Move to the next row.
                // The current element will be processed in the next iteration.
                currentX = x;
                currentY += rowHeight;
                leftToRight = true;
                if (index > 0) {
                    linkProps[index - 1] = {
                        source: { anchor: { name: 'left' } },
                        target: { anchor: { name: 'left' } },
                    };
                    if (alignRowLastElement) {
                        // Adjust the position of the previous element to make sure
                        // it is aligned with the left side of the result.
                        elementProps[elementProps.length - 1].position.x = x;
                    }
                }
            }
        }
        elementProps[index] = {
            position: { y: currentY - size.height / 2 },
            leftToRight
        };
        if (leftToRight) {
            elementProps[index].position.x = currentX;
            currentX += size.width + gap;
        } else {
            elementProps[index].position.x = Math.max(currentX - size.width, x);
            currentX -= size.width + gap;
        }
        // Adjust the link between the current element and the next one.
        if (index < links.length) {
            if (leftToRight) {
                linkProps[index] = {
                    source: { anchor: { name: 'right' } },
                    target: { anchor: { name: 'left' } },
                };
            } else {
                linkProps[index] = {
                    source: { anchor: { name: 'left' } },
                    target: { anchor: { name: 'right' } },
                };
            }
        }
        index++;
    }
    // Set the positions of the elements and the links.
    elementProps.forEach((props, i) => {
        elements[i].prop(props);
    });
    linkProps.forEach((props, i) => {
        if (links[i]) {
            links[i].prop(props);
        }
    });
    return currentY;
}

function createElement(text) {
    return new shapes.standard.Rectangle({
        size: { width: 150, height: 40 },
        attrs: {
            body: {
                fill: '#fffae2',
                stroke: '#ffc7b0',
                rx: 5,
                ry: 5
            },
            label: {
                text,
                fill: '#ff9580',
                fontSize: 14,
                fontWeight: 'bold'
            }
        }
    });
}

function createLink(source, target) {
    const link = new shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
        attrs: {
            line: {
                stroke: '#80eaff',
                strokeWidth: 2,
                targetMarker: {
                    'type': 'path',
                    'd': 'M 10 -5 0 0 10 5 z',
                    'fill': '#b6ffff',
                    'stroke-width': 2
                }
            }
        }
    });
    return link;
}

// Create an array with 30 elements and 29 links. The names of the elements are historical figures in chronological order.
const elements = [];
const links = [];
const names = [
    'Louis XIV', 'Peter the Great', 'Louis XV', 'Frederick the Great', 'Charles III of Spain', 'Joseph II', 'George III', 'Catherine the Great',
    'Maria Theresa', 'Charles IV of Spain', 'Maria I', 'Charles VI', 'Maria II', 'Joseph I', 'George IV', 'William I', 'Louis I', 'Guillaume I',
    'Louis II', 'Louis-Philippe I', 'Louis III', 'Napoleon I', 'Louis-Philippe II', 'Louis Napoleon', 'Napoleon III', 'Louis XVIII', 'Charles X',
    'Louis-Philippe III', 'Louis-Charles'
];
for (let i = 0; i < names.length; i++) {
    elements.push(createElement(names[i]));
    if (i > 0) {
        links.push(createLink(elements[i - 1], elements[i]));
    }
}

graph.addCells([...elements, ...links]);

function layout() {
    const x0 = 100;
    const y0 = 50;
    const yMax = serpentineLayout(graph, elements, {
        gap: 20,
        rowHeight: 60,
        x: x0,
        y: y0,
        width: window.innerWidth - 2 * x0,
    });
    // resize the paper to fit the content
    // enable the horizontal scrollbar if the content is wider than the paper
    paper.setDimensions('100%', yMax + y0 + 50);
}

// layout the graph initially and on window resize
layout();
window.addEventListener('resize', util.debounce(layout, 100));
