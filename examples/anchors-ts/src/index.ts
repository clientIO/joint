import { dia, shapes, util } from '@joint/core';

const cellNamespace = {
    ...shapes,
};

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
    async: true,
    defaultConnectionPoint: {
        name: 'anchor'
    }
});


let y = 100;

function createPair(graph,{
    sourceAnchor = null,
    targetAnchor = null,
    sourceLabel = '',
    targetLabel = '',
    sourceAttributes = {},
    targetAttributes = {},
    sourcePort = null,
    targetPort = null
} = {}) {
    const portMarkup = util.svg`<rect x="-10" y="-10" width="20" height="20" fill="white" stroke="black" stroke-width="2" />`;

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
                    size: { width: 20, height: 20 },
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
                    size: { width: 20, height: 20 },
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
            anchor: sourceAnchor
        },
        target: {
            id: targetEl.id,
            port: targetPort,
            anchor: targetAnchor
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
    sourceAnchor: {
        name: 'midSide',
        args: {
            useModelGeometry: true,
            rotate: false
        }
    },
    sourceLabel: 'midSide',
    targetAnchor: {
        name: 'midSide',
        args: {
            useModelGeometry: true,
            rotate: true
        }
    },
    targetLabel: 'midSide\nrotate=true',
});

createPair(graph, {
    sourceAnchor: {
        name: 'midSide',
        args: {
            useModelGeometry: true,
            mode: 'vertical'
        }
    },
    sourceLabel: 'midSide\nmode=vertical',
    targetAnchor: {
        name: 'midSide',
        args: {
            useModelGeometry: true,
            mode: 'horizontal'
        }
    },
    targetLabel: 'midSide\nmode=horizontal',
});

createPair(graph, {
    sourceAttributes: {
        angle: 45
    },
    sourceAnchor: {
        name: 'midSide',
        args: {
            useModelGeometry: true,
            rotate: false
        }
    },
    sourceLabel: 'midSide',
    targetAttributes: {
        angle: 45
    },
    targetAnchor: {
        name: 'midSide',
        args: {
            useModelGeometry: true,
            rotate: true
        }
    },
    targetLabel: 'midSide\nrotate=true',
});

createPair(graph, {
    sourceAnchor: {
        name: 'top',
        args: {
            useModelGeometry: true,
        }
    },
    sourceLabel: 'top',
    targetAnchor: {
        name: 'bottomLeft',
        args: {
            useModelGeometry: true,
        }
    },
    targetLabel: 'bottomLeft'
});

createPair(graph, {
    sourceAttributes: {
        angle: 45
    },
    sourceAnchor: {
        name: 'top',
        args: {
            useModelGeometry: true,
        }
    },
    sourceLabel: 'top',
    targetAttributes: {
        angle: 45
    },
    targetAnchor: {
        name: 'bottomLeft',
        args: {
            useModelGeometry: true,
        }
    },
    targetLabel: 'bottomLeft'
});

createPair(graph, {
    sourceAttributes: {
        angle: 45
    },
    sourceAnchor: {
        name: 'top',
        args: {
            useModelGeometry: true,
            rotate: true
        }
    },
    sourceLabel: 'top\nrotate=true',
    targetAttributes: {
        angle: 45
    },
    targetAnchor: {
        name: 'bottomLeft',
        args: {
            useModelGeometry: true,
            rotate: true
        }
    },
    targetLabel: 'bottomLeft\nrotate=true'
});

createPair(graph, {
    sourceAnchor: {
        name: 'right',
        args: {
            useModelGeometry: true,
            rotate: true
        }
    },
    targetAttributes: {
        angle: 45
    },
    targetAnchor: {
        name: 'perpendicular',
        args: {
            useModelGeometry: true,
            rotate: true
        }
    },
    targetLabel: 'perpendicular'
});

createPair(graph, {
    sourceAttributes: {
        angle: 45
    },
    sourceAnchor: {
        name: 'midSide',
        args: {
            useModelGeometry: true,
            rotate: false
        }
    },
    sourcePort: 'port1',
    sourceLabel: 'midSide',
    targetAttributes: {
        angle: 45,
    },
    targetPort: 'port1',
    targetAnchor: {
        name: 'midSide',
        args: {
            useModelGeometry: true,
            rotate: true
        }
    },
    targetLabel: 'midSide\nrotate=true'
});

createPair(graph, {
    sourceAttributes: {
        angle: 45
    },
    sourceAnchor: {
        name: 'topLeft',
        args: {
            useModelGeometry: true,
            rotate: false
        }
    },
    sourcePort: 'port1',
    sourceLabel: 'topLeft',
    targetAttributes: {
        angle: 45,
    },
    targetPort: 'port1',
    targetAnchor: {
        name: 'topLeft',
        args: {
            useModelGeometry: true,
            rotate: true
        }
    },
    targetLabel: 'topLeft\nrotate=true'
});



paper.fitToContent({ useModelGeometry: true, padding: 20 });
