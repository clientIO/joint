var Shape = joint.shapes.standard.Rectangle.define('example', {
    attrs: {
        root: {
            magnet: false
        },
        body: {
            fill: 'lightgray'
        }
    },
    ports: {
        items: [{ group: 'out' }],
        groups: {
            in: {
                position: { name: 'top' },
                attrs: {
                    portBody: {
                        magnet: 'passive',
                        r: 12,
                        cy: -4,
                        fill: 'darkblue',
                        stroke: 'black'
                    }
                },
                z: 0
            },
            out: {
                position: { name: 'bottom' },
                attrs: {
                    portBody: {
                        magnet: 'active',
                        r: 12,
                        cy: 4,
                        fill: 'lightblue',
                        stroke: 'black'
                    }
                },
                z: 0
            }
        }
    }
}, {

    portMarkup: [{ tagName: 'circle', selector: 'portBody' }],

    MINIMUM_NUMBER_OF_PORTS: 2,

    getGroupPorts: function(group) {
        return this.getPorts().filter(function(port) {
            return port.group === group;
        });
    },

    getInPorts: function() {
        return this.getGroupPorts('in');
    },

    getOutPorts: function() {
        return this.getGroupPorts('out');
    },

    getUsedInPorts: function() {
        var graph = this.graph;
        if (!graph) return [];
        var connectedLinks = graph.getConnectedLinks(this, { inbound: true });
        return connectedLinks.map(function(link) {
            return this.getPort(link.target().port);
        }, this);
    },

    getNewInPorts: function(number) {
        return Array.from({ length: number }, function() {
            return { group: 'in' };
        });
    },

    updateInPorts: function() {
        var minNumberOfPorts = this.MINIMUM_NUMBER_OF_PORTS;
        var ports = this.getInPorts();
        var usedPorts = this.getUsedInPorts();
        var newPorts = this.getNewInPorts(Math.max(minNumberOfPorts - usedPorts.length, 1));
        if (ports.length === minNumberOfPorts && ports.length - usedPorts.length > 0) {
            // noop
        } else if (ports.length === usedPorts.length) {
            this.addPorts(newPorts);
        } else if (ports.length + 1 > usedPorts.length) {
            this.prop(['ports', 'items'], this.getOutPorts().concat(usedPorts).concat(newPorts), { rewrite: true });
        }
    }
});

var magnetAvailabilityHighlighter = {
    name: 'stroke',
    options: {
        padding: 6,
        attrs: {
            'stroke-width': 3,
            'stroke': 'red'
        }
    }
};

var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    width: 800,
    height: 800,
    gridSize: 1,
    linkPinning: false,
    snapLinks: true,
    defaultLink: new joint.shapes.standard.Link({ z: - 1 }),
    defaultConnector: { name: 'smooth' },
    defaultConnectionPoint: { name: 'boundary' },
    markAvailable: true,
    validateConnection: function(vS, mS, vT, mT, end, lV) {
        if (!mT) return false;
        if (vS === vT) return false;
        if (mT.getAttribute('port-group') !== 'in') return false;
        if (vT.model instanceof Shape) {
            var portId = mT.getAttribute('port');
            if (lV.model.target().port === portId) return true;
            var usedInPorts = vT.model.getUsedInPorts();
            if (usedInPorts.find(function(port) { return port.id === portId; })) return false;
        }
        return true;
    },
    highlighting: {
        magnetAvailability: magnetAvailabilityHighlighter
    }
});

paper.on('link:mouseenter', function(linkView) {
    var tools = new joint.dia.ToolsView({
        tools: [
            new joint.linkTools.TargetArrowhead(),
            new joint.linkTools.Remove({ distance: -30 })
        ]
    });
    linkView.addTools(tools);
});

paper.on('link:mouseleave', function(linkView) {
    linkView.removeTools();
});

paper.on('link:connect link:disconnect', function(linkView, evt, elementView) {
    var element = elementView.model;
    if (element instanceof Shape) {
        element.getInPorts().forEach(function(port) {
            var portNode = elementView.findPortNode(port.id, 'portBody');
            elementView.unhighlight(portNode, { highlighter: magnetAvailabilityHighlighter });
        });
        element.updateInPorts();
    }
});

graph.on('remove', function(cell, collection, opt) {
    if (!cell.isLink() || !opt.ui) return;
    var target = this.getCell(cell.target().id);
    if (target instanceof Shape) target.updateInPorts();
});

var shape1 = new Shape();
shape1.resize(120, 100);
shape1.position(200, 100);
shape1.updateInPorts();
shape1.addTo(graph);

var shape2 = new Shape();
shape2.resize(120, 100);
shape2.position(400, 100);
shape2.updateInPorts();
shape2.addTo(graph);

var shape3 = new Shape();
shape3.resize(120, 100);
shape3.position(300, 400);
shape3.updateInPorts();
shape3.addTo(graph);

