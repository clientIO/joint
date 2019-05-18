// https://www.soundonsound.com/sound-advice/q-aux-and-bus-explained

var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 1000,
    height: 1000,
    model: graph,
    async: true,
    sorting: joint.dia.Paper.sorting.APPROX,
    defaultConnectionPoint: { name: 'boundary', args: { selector: 'body' }},
    defaultLinkAnchor: { name: 'connectionPerpendicular' },
    defaultAnchor: { name: 'perpendicular' },
    interactive: { linkMove: false, labelMove: false },
    highlighting: {
        default: {
            name: 'addClass',
            options: {
                className: 'active'
            }
        }
    }
});

var Bus = joint.shapes.standard.Link.define('Bus', {
    attrs: {
        line: {
            strokeWidth: 5,
            sourceMarker: null,
            targetMarker: null
        }
    }
}, {
    defaultLabel: {
        markup: [{
            tagName: 'text',
            selector: 'labelText'
        }],
        position: {
            distance: 10,
            offset: -20,
            args: {
                keepGradient: true,
                ensureLegibility: true
            }
        }
    }
});

var Component = joint.shapes.standard.Rectangle.define('Component', {
    z: 1,
    attrs: {
        label: {
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: 15,
            textWrap: {
                width: -20
            }
        },
        body: {
            strokeWidth: 2,
            stroke: '#cccccc'
        }
    },
    portMarkup: [{
        tagName: 'rect',
        selector: 'portBody',
        attributes: {
            'fill': '#ffffff',
            'stroke': '#333333',
            'stroke-width': 2,
            'x': -10,
            'y': -5,
            'width': 20,
            'height': 10
        }
    }],
    ports: {
        groups: {
            'in': {
                z: -1,
                position: 'left'
            },
            'out': {
                z: -1,
                position: 'right',
            }
        }
    }
});

var Connector = joint.shapes.standard.Link.define('Connector', {
    z: 0,
    attrs: {
        line: {
            sourceMarker: {
                'type': 'circle',
                'r': 4,
                'stroke': '#333333'
            },
            targetMarker: {
                'type': 'circle',
                'r': 4,
                'stroke': '#333333'
            }
        }
    }
});

var Fader = joint.dia.Element.define('Fader', {
    z: 2,
    size: {
        width: 15,
        height: 80
    },
    attrs: {
        label: {
            fontFamily: 'monospace',
            fontSize: 12,
            text: 'Fader',
            textVerticalAnchor: 'bottom',
            textAnchor: 'middle',
            refX: '50%',
            stroke: '#333333'
        },
        arrow: {
            d: 'M -10 70 L 20 10',
            stroke: '#333333',
            strokeWidth: 3,
            targetMarker: {
                'type': 'path',
                'd': 'M 13 -8 0 0 13 8 z'
            }
        },
        body: {
            strokeWidth: 2,
            refWidth: '100%',
            refHeight: '100%',
            fill: '#ffffff',
            stroke: '#cccccc'
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'path',
        selector: 'arrow'
    }, {
        tagName: 'text',
        selector: 'label'
    }]
});

var Aux = joint.dia.Element.define('Aux', {
    z: 2,
    size: {
        width: 30,
        height: 30
    },
    attrs: {
        label: {
            fontFamily: 'monospace',
            fontSize: 12,
            textVerticalAnchor: 'top',
            textAnchor: 'start',
            refDx: 5,
            stroke: '#333333'
        },
        auxCircle: {
            r: 10,
            refCx: '50%',
            refCy: '50%',
            stroke: '#333333',
            fill: 'none',
            strokeWidth: 2,
        },
        auxLine: {
            d: 'M 15 15 L 21 6',
            stroke: '#333333',
            strokeWidth: 3,
        },
        body: {
            strokeWidth: 2,
            refWidth: '100%',
            refHeight: '100%',
            fill: '#ffffff',
            stroke: '#cccccc'
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'circle',
        selector: 'auxCircle'
    }, {
        tagName: 'path',
        selector: 'auxLine'
    }, {
        tagName: 'text',
        selector: 'label'
    }]
});

function createBus(x, label, color) {
    return new Bus({
        source: { x: x, y: 800 },
        target: { x: x, y: 100 },
        attrs: {
            line: {
                stroke: color
            }
        },
        labels: [{
            attrs: {
                labelText: {
                    text: label,
                    fontFamily: 'monospace'
                }
            }
        }]
    });
}

function createComponent(x, y, width, height, label) {
    return new Component({
        position: { x: x, y: y },
        size: { width: width, height: height },
        attrs: {
            label: {
                textWrap: {
                    text: label,
                }
            }
        }
    });
}

function createFader(x, y) {
    return new Fader({
        position: { x: x, y: y },
    });
}

function createConnector(source, target) {
    var connector = new Connector();
    if (Array.isArray(source)) {
        connector.source(source[0], {
            priority: true,
            anchor: {
                name: 'center',
                args: {
                    dy: source[1]
                }
            }
        });
    } else {
        connector.source(source, { selector: source.isLink() ? null : 'body' });
    }
    if (Array.isArray(target)) {
        connector.target(target[0], {
            priority: true,
            anchor: {
                name: 'center',
                args: {
                    dy: target[1]
                }
            }
        });
    } else {
        connector.target(target, { selector: target.isLink() ? null : 'body' });
    }
    return connector;
}

function createAux(x, y, label) {
    return new Aux({
        position: { x: x, y: y },
        attrs: {
            label: {
                text: label
            }
        }
    });
}

var bus1 = createBus(600, 'Sub-group 1', '#333333');
var bus2 = createBus(625, 'Sub-group 2', '#333333');
var bus3 = createBus(650, 'Sub-group 3', '#333333');
var bus4 = createBus(675, 'Sub-group 4', '#333333');
var bus5 = createBus(700, 'Mix Left', '#ff5964');
var bus6 = createBus(725, 'Mix Right', '#b5d99c');
var bus7 = createBus(750, 'Post-fade Aux', '#35a7ff');
var bus8 = createBus(775, 'Pre-fade Aux', '#6b2d5c');
var component1 = createComponent(850, 180, 80, 80, 'Stereo Mix').addPort({ group: 'out' });
var component2 = createComponent(840, 280, 100, 30, 'Pre Aux').addPort({ group: 'out' });
var component3 = createComponent(840, 330, 100, 30, 'Post Aux').addPort({ group: 'out' });
var component4 = createComponent(450, 200, 90, 100, 'Output Routing');
var component5 = createComponent(450, 450, 90, 100, 'Output Routing');
var component6 = createComponent(100, 230, 150, 40, 'Input Channel').addPort({ group: 'in' });
var component7 = createComponent(100, 480, 150, 40, 'Sub-group 1');
var fader1 = createFader(350, 210, 80, 100, 'Output Routing');
var fader2 = createFader(350, 460, 80, 100, 'Output Routing');
var aux1 = createAux(420, 320, 'Pre-fade Aux');
var aux2 = createAux(350, 360, 'Post-fade Aux');
var aux3 = createAux(420, 570, 'Post-fade Aux');
var aux4 = createAux(350, 610, 'Pre-fade Aux');
var connector1 = createConnector(bus1, component7).vertices([{ x: 175, y: 420 }]);
var connector2 = createConnector(fader2, component5);
var connector3 = createConnector(connector2, aux3).vertices([{ x: 400, y: 585 }]);
var connector4 = createConnector(fader1, component4);
var connector5 = createConnector(connector4, aux1).vertices([{ x: 400, y: 335 }]);
var connector6 = createConnector(component7, fader2);
var connector7 = createConnector(connector6, aux4).vertices([{ x: 310, y: 625 }]);
var connector8 = createConnector(component6, fader1);
var connector9 = createConnector(connector8, aux2).vertices([{ x: 310, y: 375 }]);
var connector10 = createConnector(bus5, [component1, -10]);
var connector11 = createConnector(bus6, [component1, 10]);
var connector12 = createConnector(bus7, component2);
var connector13 = createConnector(bus8, component3);
var connector14 = createConnector([component4, -40], bus1);
var connector15 = createConnector([component4, -24], bus2);
var connector16 = createConnector([component4, -8], bus3);
var connector17 = createConnector([component4, 8], bus4);
var connector18 = createConnector([component4, 24], bus5);
var connector19 = createConnector([component4, 40], bus6);
var connector20 = createConnector([component5, -20], bus5);
var connector21 = createConnector([component5, 20], bus6);
var connector22 = createConnector(aux1, bus7);
var connector23 = createConnector(aux2, bus8);
var connector24 = createConnector(aux3, bus7);
var connector25 = createConnector(aux4, bus8);

connector1.attr('line', {
    sourceMarker: {
        'type': 'path',
        'd': 'M 0 -8 15 0 0 8 z'
    }
});

graph.resetCells([
    bus1,
    bus2,
    bus3,
    bus4,
    bus5,
    bus6,
    bus7,
    bus8,
    component1,
    component2,
    component3,
    component4,
    component5,
    component6,
    component7,
    fader1,
    fader2,
    aux1,
    aux2,
    aux3,
    aux4,
    connector1,
    connector2,
    connector3,
    connector4,
    connector5,
    connector6,
    connector7,
    connector8,
    connector9,
    connector10,
    connector11,
    connector12,
    connector13,
    connector14,
    connector15,
    connector16,
    connector17,
    connector18,
    connector19,
    connector20,
    connector21,
    connector22,
    connector23,
    connector24,
    connector25
]);

component7.embed(connector1);
aux3.embed(connector3);
aux1.embed(connector5);
aux4.embed(connector7);
aux2.embed(connector9);

paper.on('cell:mouseenter', function(cellView) {
    getElementSubgraph(this.model, cellView.model).forEach(function(cell) {
        cell.findView(paper).highlight();
    }, this);
});

paper.on('cell:mouseleave', function(cellView) {
    getElementSubgraph(this.model, cellView.model).forEach(function(cell) {
        cell.findView(paper).unhighlight();
    }, this);
});

function getElementSubgraph(graph, element) {
    var neighbors = graph.getNeighbors(element, { outbound: true });
    var outboundLinks = graph.getConnectedLinks(element, { outbound: true });
    return graph.getSubgraph([element].concat(neighbors).concat(outboundLinks));
}
