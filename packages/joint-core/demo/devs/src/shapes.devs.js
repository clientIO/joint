const { util, dia, shapes: defaultShapes, linkTools } = joint;
const { uniq, difference, assign, toArray, without, isObject } = util;

const Model = dia.Element.define('devs.Model', {
    inPorts: [],
    outPorts: [],
    attrs: {
        root: {
            magnet: false
        },
        body: {
            width: 'calc(w)',
            height: 'calc(h)',
            stroke: '#000'
        },
        label: {
            text: '',
            x: 'calc(w/2)',
            y: 20,
            fontSize: 18,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fill: '#000'
        },
    },
    ports: {
        groups: {
            in: {
                position: {
                    name: 'left'
                },
                attrs: {
                    portLabel: {
                        fill: '#000'
                    },
                    portBody: {
                        fill: '#fff',
                        stroke: '#000',
                        r: 10,
                        magnet: true
                    }
                },
                label: {
                    position: {
                        name: 'left',
                        args: {
                            y: 10
                        }
                    }
                }
            },
            out: {
                position: {
                    name: 'right'
                },
                attrs: {
                    portLabel: {
                        fill: '#000'
                    },
                    portBody: {
                        fill: '#fff',
                        stroke: '#000',
                        r: 10,
                        magnet: true
                    }
                },
                label: {
                    position: {
                        name: 'right',
                        args: {
                            y: 10
                        }
                    }
                }
            }
        }
    }
}, {

    markup: [{
        tagName: 'rect',
        selector: 'body',
        className: 'body'
    }, {
        tagName: 'text',
        selector: 'label',
        className: 'label'
    }],

    portMarkup: [{
        tagName: 'circle',
        selector: 'portBody',
        className: 'port-body'
    }],

    portLabelMarkup: [{
        tagName: 'text',
        selector: 'portLabel',
        className: 'port-label'
    }],

    initialize: function() {

        dia.Element.prototype.initialize.apply(this, arguments);

        this.on('change:inPorts change:outPorts', this.updatePortItems, this);
        this.updatePortItems();
    },

    updatePortItems: function(model, changed, opt) {

        // Make sure all ports are unique.
        const inPorts = uniq(this.get('inPorts'));
        const outPorts = difference(uniq(this.get('outPorts')), inPorts);

        const inPortItems = this.createPortItems('in', inPorts);
        const outPortItems = this.createPortItems('out', outPorts);

        this.prop('ports/items', inPortItems.concat(outPortItems), assign({ rewrite: true }, opt));
    },

    createPortItem: function(group, port) {

        return {
            id: port,
            group: group,
            attrs: {
                portLabel: {
                    text: port
                }
            }
        };
    },

    createPortItems: function(group, ports) {

        return toArray(ports).map(this.createPortItem.bind(this, group));
    },

    _addGroupPort: function(port, group, opt) {

        const ports = this.get(group);
        return this.set(group, Array.isArray(ports) ? ports.concat(port) : [port], opt);
    },

    addOutPort: function(port, opt) {

        return this._addGroupPort(port, 'outPorts', opt);
    },

    addInPort: function(port, opt) {

        return this._addGroupPort(port, 'inPorts', opt);
    },

    _removeGroupPort: function(port, group, opt) {

        return this.set(group, without(this.get(group), port), opt);
    },

    removeOutPort: function(port, opt) {

        return this._removeGroupPort(port, 'outPorts', opt);
    },

    removeInPort: function(port, opt) {

        return this._removeGroupPort(port, 'inPorts', opt);
    },

    _changeGroup: function(group, properties, opt) {

        return this.prop('ports/groups/' + group, isObject(properties) ? properties : {}, opt);
    },

    changeInGroup: function(properties, opt) {

        return this._changeGroup('in', properties, opt);
    },

    changeOutGroup: function(properties, opt) {

        return this._changeGroup('out', properties, opt);
    }
});

const Coupled = Model.define('devs.Coupled', {
    size: {
        width: 300,
        height: 300
    },
    attrs: {
        label: {
            text: 'Coupled',
        }
    }
});

const Atomic = Model.define('devs.Atomic', {
    size: {
        width: 80,
        height: 80
    },
    attrs: {
        label: {
            text: 'Atomic',
        }
    }
});

const Link = defaultShapes.standard.Link.define('devs.Link', {
    attrs: {
        line: {
            strokeWidth: 4,
            targetMarker: null
        }
    }
});

const shapes = {
    ...defaultShapes,
    devs: {
        Model,
        Coupled,
        Atomic,
        Link
    }
};

const graph = new dia.Graph({}, { cellNamespace: shapes });

const paper = new dia.Paper({

    el: document.getElementById('paper'),
    width: 800,
    height: 400,
    gridSize: 1,
    model: graph,
    snapLinks: { radius: 20 },
    linkPinning: false,
    embeddingMode: true,
    clickThreshold: 5,
    cellViewNamespace: shapes,
    overflow: true,
    highlighting: {
        'default': {
            name: 'stroke',
            options: {
                padding: 6
            }
        },
        'embedding': {
            name: 'addClass',
            options: {
                className: 'highlighted-parent'
            }
        }
    },
    defaultLink: () => new Link(),
    validateEmbedding: function(childView, parentView) {
        return parentView.model instanceof Coupled;
    },

    validateConnection: function(sourceView, sourceMagnet, targetView, targetMagnet) {
        return sourceMagnet != targetMagnet;
    }
});

const connect = function(source, sourcePort, target, targetPort) {

    const link = new Link({
        source: {
            id: source.id,
            port: sourcePort
        },
        target: {
            id: target.id,
            port: targetPort
        }
    });

    link.addTo(graph).reparent();
};

const c1 = new Coupled({
    position: {
        x: 230,
        y: 50
    }
});

c1.set('inPorts', ['in']);
c1.set('outPorts', ['out 1', 'out 2']);

const a1 = new Atomic({
    position: {
        x: 360,
        y: 260
    },
    inPorts: ['xy'],
    outPorts: ['x', 'y']
});

const a2 = new Atomic({
    position: {
        x: 50,
        y: 160
    },
    outPorts: ['out']
});

const a3 = new Atomic({
    position: {
        x: 650,
        y: 50
    },
    size: {
        width: 100,
        height: 300
    },
    inPorts: ['a', 'b']
});

[c1, a1, a2, a3].forEach(function(element) {
    element.attr({
        '.body': {
            'rx': 6,
            'ry': 6
        }
    });
});

graph.addCells([c1, a1, a2, a3]);

c1.embed(a1);

connect(a2, 'out', c1, 'in');
connect(c1, 'in', a1, 'xy');
connect(a1, 'x', c1, 'out 1');
connect(a1, 'y', c1, 'out 2');
connect(c1, 'out 1', a3, 'a');
connect(c1, 'out 2', a3, 'b');

// Interactions

const strokeDasharrayPath = '.body/strokeDasharray';

paper.on('element:pointerdblclick', function(elementView) {
    const element = elementView.model;
    if (element.get('type') === 'devs.Atomic') {
        toggleDelegation(element);
    }
});

paper.setInteractivity(function(elementView) {
    return {
        stopDelegation: !elementView.model.attr(strokeDasharrayPath)
    };
});

toggleDelegation(a1);

function toggleDelegation(element) {
    element.attr(strokeDasharrayPath, element.attr(strokeDasharrayPath) ? '' : '15,1');
}

// Link Tools

paper.on({
    'link:mouseenter': function(linkView) {
        const linkToolsView = new dia.ToolsView({
            tools: [
                new linkTools.Vertices(),
                new linkTools.Remove({ distance: -40 })
            ]
        });
        linkView.addTools(linkToolsView);
    },
    'link:mouseleave': function(linkView) {
        linkView.removeTools();
    }
});
