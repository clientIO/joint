import { connectionPoints, dia, shapes } from '@joint/core';

const cellNamespace = {
    ...shapes,
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
    gridSize: 1,
    async: true,
    defaultConnectionPoint: {
        name: 'anchor'
    }
});

const el1 = new shapes.standard.Rectangle({
    position: {
        x: 400,
        y: 270
    },
    size: {
        width: 250,
        height: 120
    },
    angle: 45,
    attrs: {
        extra: {
            y: 'calc(h)',
        }
    },
    ports: {
        items: [{
            id: 'port',
            group: 'left',
            size: {
                width: 20,
                height: 20
            }
        }],
        groups: {
            left: {
                markup: [{
                    tagName: 'rect',
                    selector: 'portBody'
                }],
                attrs: {
                    portBody: {
                        x: 'calc(w / -2)',
                        y: 'calc(h / -2)',
                        width: 'calc(w)',
                        height: 'calc(h)',
                    }
                },
                size: {
                    width: 20,
                    height: 20
                }
            }
        }
    }
});
const el2 = new shapes.standard.Rectangle({
    position: {
        x: 100,
        y: 170
    },
    size: {
        width: 180,
        height: 350
    },
    // angle: 30
});

const l1 = new shapes.standard.Link({
    source: {
        id: el1.id,
        port: 'port',
        anchor: {
            name: 'topLeft',
            args: {
                useModelGeometry: true,
                // rotate: tru  e
            }
        }
    },
    target: {
        id: el2.id,
        anchor: {
            name: 'center',
            args: {
                // useModelGeometry: true,
                // rotate: true
            }
        }
    },
    // router: {
    //     name: 'rightAngle'
    // },
    attrs: {
        line: {
            stroke: 'red',
            strokeWidth: 3
        }
    }
});

graph.addCells([el1, el2, l1]);

// @ts-ignore
window.el1 = el1;
