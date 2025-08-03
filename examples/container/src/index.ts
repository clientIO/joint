import { shapes, dia, util, elementTools } from '@joint/core';
import { Child, Container, Link, HEADER_HEIGHT } from './shapes';

import '../index.css';

const cellNamespace = {
    ...shapes,
    container: {
        Child,
        Container,
        Link
    }
};

const graph = new dia.Graph({}, { cellNamespace });
const paper = new dia.Paper({
    width: 800,
    height: 600,
    model: graph,
    cellViewNamespace: cellNamespace,
    async: true,
    background: {
        color: '#F3F7F6'
    },
    interactive: { linkMove: false },
    viewport: (view: dia.CellView) => {
        const cell = view.model;
        // Hide any element or link which is embedded inside a collapsed parent (or parent of the parent).
        const hidden = cell.getAncestors().some((ancestor) => {
            if ((ancestor as Container).isCollapsed()) return true;
        });
        return !hidden;
    }
});

document.getElementById('paper')!.appendChild(paper.el);

const highlighterMarkup = util.svg/* xml */`
    <rect @selector="button" fill="#000000" fill-opacity="0.2" stroke="#FFFFFF" stroke-width="0.5" x="-7" y="-7" width="14" height="14" cursor="pointer"/>
    <path @selector="icon" fill="none" stroke="#FFFFFF" stroke-width="1" pointer-events="none"/>
`

// Custom highlighter to render the expand/collapse button.
class ExpandButtonHighlighter extends dia.HighlighterView {

    preinitialize() {
        this.UPDATE_ATTRIBUTES = ['collapsed'];
        this.tagName = 'g';
        this.children = highlighterMarkup;
        this.events = <any>{
            click: 'onClick'
        };
    }

    onClick() {
        (this.cellView.model as Container).toggle();
    }

    // Method called to highlight a CellView
    protected highlight(cellView: dia.CellView) {
        if (this.el.childNodes.length === 0) {
            this.renderChildren();
        }

        const size = (cellView.model as dia.Element).size();
        this.el.setAttribute(
            'transform',
            `translate(${size.width - HEADER_HEIGHT / 2}, ${HEADER_HEIGHT / 2})`
        );

        let d: string;
        if (cellView.model.get('collapsed')) {
            d = 'M -4 0 4 0 M 0 -4 0 4';
        } else {
            d = 'M -4 0 4 0';
        }
        this.childNodes.icon.setAttribute('d', d);
    }
}

const updateContainerSize = (container: dia.Cell) => {
    if (!Container.isContainer(container)) return;
    if (container.isCollapsed()) {
        container.resize(140, 30);
    } else {
        container.fitToChildElements();
    }
}

graph.on({
    'add': (cell: dia.Cell) => {
        if (Container.isContainer(cell)) {
            // Add the expand button highlighter.
            ExpandButtonHighlighter.add(cell.findView(paper), 'root', 'expand-button');
        }
    },

    'remove': (cell: dia.Cell) => {
        if (cell.isLink()) return;
        updateContainerSize(cell.getParentCell());
    },

    'change:position': (cell: dia.Cell) => {
        if (cell.isLink()) return;
        updateContainerSize(cell.getParentCell());
    },

    'change:size': (cell: dia.Cell) => {
        if (cell.isLink()) return;
        updateContainerSize(cell.getParentCell());
    },

    'change:embeds': (cell: dia.Cell) => {
        if (cell.isLink()) return;
        updateContainerSize(cell);
    },

    'change:collapsed': (cell: dia.Cell) => {
        updateContainerSize(cell);
    }
});

// Show element tools on hover
paper.on({
    'element:mouseenter': (elementView) => {
        elementView.removeTools();
        if (Container.isContainer(elementView.model)) {
            // Silently remove the children elements, then remove the container
            elementView.addTools(
                new dia.ToolsView({
                    tools: [
                        new elementTools.Remove({
                            useModelGeometry: true,
                            y: 0,
                            x: 0,
                            action: (_evt, view) => {
                                graph.removeCells(view.model.getEmbeddedCells());
                                view.model.remove();
                            }
                        })
                    ]
                })
            );
        } else if (Child.isChild(elementView.model)) {
            // Remove the element from the graph
            elementView.addTools(
                new dia.ToolsView({
                    tools: [
                        new elementTools.Remove({
                            useModelGeometry: true,
                            y: 0,
                            x: 0
                        })
                    ]
                })
            );
        }
    },

    'element:mouseleave': (elementView) => {
        elementView.removeTools();
    }
});

// Example diagram
const container_a = new Container({
    z: 1,
    position: { x: 0, y: 0 },
    size: {width: 10, height: 10 },
    attrs: { headerText: { text: 'Container A' }}
});

const container_b = new Container({
    z: 3,
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
    attrs: { headerText: { text: 'Container B' }}
});

const child_1 = new Child({
    z: 2,
    position: { x: 150, y: 50 },
    attrs: { label: { text: '1' }}
});

const child_2 = new Child({
    z: 2,
    position: { x: 100, y: 150 },
    attrs: { label: { text: '2' }}
});

const child_3 = new Child({
    z: 2,
    position: { x: 200, y: 150 },
    attrs: { label: { text: '3' }}
});

const child_4 = new Child({
    z: 4,
    position: { x: 300, y: 190 },
    attrs: { label: { text: '4' }}
});

const child_5 = new Child({
    z: 4,
    position: { x: 400, y: 260 },
    attrs: { label: { text: '5' }}
});

const link_1_2 = new Link({
    z: 2,
    source: { id: child_1.id },
    target: { id: child_2.id }
});

const link_1_3 = new Link({
    z: 2,
    source: { id: child_1.id },
    target: { id: child_3.id }
});

const link_4_5 = new Link({
    z: 4,
    source: { id: child_4.id },
    target: { id: child_5.id }
});

const link_1_b = new Link({
    z: 4,
    source: { id: child_1.id },
    target: { id: container_b.id }
});

graph.addCells([
    container_a, container_b,
    child_1, child_2, child_3, child_4, child_5,
    link_1_2, link_1_3, link_4_5, link_1_b
]);

container_a.embed([child_1, child_2, child_3, container_b]);
container_b.embed([child_4, child_5]);

link_1_2.reparent();
link_1_3.reparent();
link_4_5.reparent();
link_1_b.reparent();
