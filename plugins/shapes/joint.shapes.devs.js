//      JointJS library.
//      (c) 2011-2013 client IO

joint.shapes.devs = {};

joint.shapes.devs.Model = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><text class="label"/></g>',

    defaults: joint.util.deepSupplement({
    type: 'ports.Model',
    size: { width: 1, height: 1 },
    attrs: {
        text: {
            'pointer-events': 'none',
            text: 'Model',
            'ref-x': .5,
            'ref-y': 10,
            ref: '.body',
            'font-size': 18,
            'text-anchor': 'middle',
            fill: '#000'
        }
    },
    ports: {
        groups: {
            'in': {
                position: {
                    name: 'left',
                    args: {}
                },
                markup: '<circle class="input-port" />',
                attrs: {
                    text: {
                        fill: 'black'
                    },
                    circle: {
                        fill: 'PaleGreen',
                        r: '10',
                        magnet: false
                    }
                }
            },
            'out': {
                position: {
                    name: 'right',
                    args: {}
                },
                markup: '<circle class="output-port" />',
                attrs: {
                    text: {
                        fill: 'blue'
                    },
                    circle: {
                        fill: 'Tomato',
                        r: '10',
                        magnet: true
                    }
                },
                label: {
                    position: {
                        name : 'right'
                    }
                }
            }
        }
    }}, joint.shapes.basic.Generic.prototype.defaults),

    initialize: function () {
            joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
            this.on('change:inPorts change:outPorts', this.updatePortItems, this);
            this.updatePortItems(this);
    },

    updatePortItems: function (model, changed, opt) {
        var getPorts = function(portNameGroup) {
            var ports = model.get(portNameGroup);
            var group = portNameGroup === 'inPorts' ? 'in' : 'out';
            return _.map(ports, function (p) {
                return {id: p, group: group, attrs: {text: {text: p}}};
            });
        };
        model.prop('ports/items', getPorts('inPorts').concat(getPorts('outPorts')), _.extend({rewrite: true}, opt));
    }
});

joint.shapes.devs.Atomic = joint.shapes.devs.Model.extend({

    defaults: joint.util.deepSupplement({
        type: 'devs.Atomic',
        size: { width: 80, height: 80 },
        attrs: {
            '.body': {
                fill: 'salmon'
            },
            text: {
                text: 'Atomic'
            },
            rect: { stroke: '#31d0c6', 'stroke-width': 6, fill: '#ffffff',  width: 800, height: 800 }
        }
    }, joint.shapes.devs.Model.prototype.defaults)
});

joint.shapes.devs.Coupled = joint.shapes.devs.Model.extend({

    defaults: joint.util.deepSupplement({
        type: 'devs.Coupled',
        size: { width: 200, height: 300 },
        attrs: {
            '.body': {
                fill: 'seaGreen'
            },
            text: {
                text: 'Coupled'
            },
            rect: { stroke: '#31d0c6', 'stroke-width': 6, fill: '#ffffff',  width: 800, height: 800 }
        }
    }, joint.shapes.devs.Model.prototype.defaults)
});

joint.shapes.devs.Link = joint.dia.Link.extend({

    defaults: {
        type: 'devs.Link',
        attrs: {
            '.connection': {
                'stroke-width': 2
            }
        }
    }
});

joint.shapes.devs.ModelView = joint.dia.ElementView.extend(joint.shapes.basic.PortsViewInterface);
joint.shapes.devs.AtomicView = joint.shapes.devs.ModelView;
joint.shapes.devs.CoupledView = joint.shapes.devs.ModelView;
