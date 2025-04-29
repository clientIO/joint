import { dia, shapes, util } from '@joint/core';

const cellNamespace = {
    ...shapes,
}

const graph = new dia.Graph({}, {
    cellNamespace: cellNamespace
});

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 800,
    overflow: true,
    model: graph,
    cellViewNamespace: cellNamespace,
    gridSize: 1,
    // async: true,
    defaultAnchor: {
        name: 'center',
        args: {
            useModelGeometry: true,
        }
    }
});

paper.el.style.display = 'none'

let y = 100;

function createPair(graph,{
    sourceConnectionPoint = null,
    targetConnectionPoint = null,
    sourceLabel = '',
    targetLabel = '',
    sourceAttributes = {},
    targetAttributes = {},
    sourcePort = null,
    targetPort = null
} = {}) {
    const portMarkup = util.svg`<rect x="-20" y="-10" width="40" height="20" fill="white" stroke="black" stroke-width="2" />`;

    const sourceEl = new shapes.standard.Rectangle({
        ...sourceAttributes,
        position: {
            x: 100,
            y
        },
        size: {
            width: 140,
            height: 100
        },
        attrs: {
            label: {
                fontFamily: 'sans-serif',
                text: sourceLabel,
            }
        },
        ports: {
            groups: {
                portGroup1: {
                    position: 'top',
                    size: { width: 40, height: 20 },
                }
            }
        },
        portMarkup,
    });
    const targetEl = new shapes.standard.Rectangle({
        ...targetAttributes,
        position: {
            x: 400,
            y
        },
        size: {
            width: 150,
            height: 100
        },
        attrs: {
            label: {
                fontFamily: 'sans-serif',
                text: targetLabel,
            }
        },
        ports: {
            groups: {
                portGroup1: {
                    position: 'top',
                    size: { width: 40, height: 20 },
                    attrs: {
                        portBody: {
                            width: 'calc(w)',
                            height: 'calc(h)',

                        }
                    }
                }
            }
        },
        portMarkup,
    });
    if (sourcePort) {
        sourceEl.addPort({
            id: sourcePort,
            group: 'portGroup1',
        });
    }
    if (targetPort) {
        targetEl.addPort({
            id: targetPort,
            group: 'portGroup1',
        });
    }
    const link = new shapes.standard.Link({
        source: {
            id: sourceEl.id,
            port: sourcePort,
            connectionPoint: sourceConnectionPoint,
        },
        target: {
            id: targetEl.id,
            port: targetPort,
            connectionPoint: targetConnectionPoint,
        },
        attrs: {
            line: {
                stroke: 'red',
                strokeWidth: 3
            }
        }
    });
    graph.addCells([sourceEl, targetEl, link]);
    y += 200;
    return [sourceEl, targetEl, link];
}

createPair(graph, {
    sourceConnectionPoint: {
        name: 'bbox',
        args: {
            useModelGeometry: true,
        }
    },
    sourceAttributes: {
        angle: 45
    },
    sourceLabel: 'bbox',
    targetConnectionPoint: {
        name: 'bbox',
        args: {
            useModelGeometry: true,
        }
    },
    targetLabel: 'bbox',
});

createPair(graph, {
    sourceAttributes: {
        angle: 45
    },
    sourceConnectionPoint: {
        name: 'rectangle',
        args: {
            useModelGeometry: true,
        }
    },
    sourceLabel: 'rectangle',
    targetConnectionPoint: {
        name: 'rectangle',
        args: {
            useModelGeometry: true,
        }
    },
    targetLabel: 'rectangle',
});

createPair(graph, {
    sourceConnectionPoint: {
        name: 'bbox',
        args: {
            useModelGeometry: true,
        }
    },
    sourcePort: 'port1',
    sourceLabel: 'bbox',
    targetAttributes: {
        angle: 45
    },
    targetConnectionPoint: {
        name: 'bbox',
        args: {
            useModelGeometry: true,
        }
    },
    targetPort: 'port1',
    targetLabel: 'bbox',
});

createPair(graph, {
    sourceConnectionPoint: {
        name: 'rectangle',
        args: {
            useModelGeometry: true,
        }
    },
    sourcePort: 'port1',
    sourceLabel: 'rectangle',
    targetAttributes: {
        angle: 45
    },
    targetConnectionPoint: {
        name: 'rectangle',
        args: {
            useModelGeometry: true,
        }
    },
    targetLabel: 'rectangle',
    targetPort: 'port1',
});

paper.el.style.display = 'block';

paper.fitToContent({ useModelGeometry: true, padding: 20 });
