import { g, dia, shapes } from '@joint/core';
import './styles.css';
const { Point } = g;

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

const Link = dia.Link.define(
    'Link',
    {
        attrs: {
            line: {
                connection: true,
                fill: 'none',
                targetMarker: {
                    'stroke-width': 1,
                    markerUnits: 'strokeWidth', // the default is `userSpaceOnUse`
                    d: 'M 1,-1 0,0 1,1 Z'
                    // fill: 'blue',  if not defined, we use 'stroke' of the line`
                    // stroke: 'blue',  if not defined, we use 'stroke' of the line`
                }
            }
        }
    },
    {
        markup: [
            {
                tagName: 'path',
                selector: 'line'
            }
        ]
    }
);

const link1 = new Link({
    attrs: {
        line: {
            stroke: 'red',
            strokeWidth: 2
        }
    }
});
link1.source(new Point(50, 50));
link1.target(new Point(300, 50));
link1.addTo(graph);

const link2 = new Link({
    attrs: {
        line: {
            stroke: 'blue',
            strokeWidth: 4
        }
    }
});
link2.source(new Point(50, 150));
link2.target(new Point(300, 150));
link2.addTo(graph);

const link3 = new Link({
    attrs: {
        line: {
            stroke: 'green',
            strokeWidth: 6
        }
    }
});
link3.source(new Point(50, 250));
link3.target(new Point(300, 250));
link3.addTo(graph);
