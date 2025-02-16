import { dia, shapes } from '@joint/core';
import * as customShapes from './shapes';

const cellNamespace = {
    ...shapes,
    custom: customShapes
}

const graph = new dia.Graph({}, {
    cellNamespace: cellNamespace
});

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 1000,
    overflow: true,
    model: graph,
    cellViewNamespace: cellNamespace,
    gridSize: 10,
    async: true,
});

const el1 = new customShapes.Shape1({
    position: {
        x: 100,
        y: 270
    },
    size: {
        width: 250,
        height: 120
    },
    attrs: {
        extra: {
            y: 'calc(h)',
        }
    }
});
const el2 = new customShapes.Shape1({
    position: {
        x: 600,
        y: 170
    },
    size: {
        width: 180,
        height: 350
    },
});

const l1 = new shapes.standard.Link({
    source: {
        id: el1.id,
        anchor: {
            name: 'midSide',
            args: {
                useModelGeometry: true
            }
        }
    },
    target: {
        id: el2.id,
        anchor: {
            name: 'perpendicular',
            args: {
                useModelGeometry: true
            }
        }
    },
    router: {
        name: 'rightAngle'
    },
    attrs: {
        line: {
            strokeWidth: 3
        }
    }
});

graph.addCells([el1, el2, l1]);
