//      JointJS library.
//      (c) 2011-2013 client IO

joint.shapes.devs = {};

joint.shapes.devs.Model = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><rect class="body"/><text class="label"/></g>',
    defaults: joint.util.deepSupplement({

        type: 'ports.Model',
        size: { width: 1, height: 1 },
        attrs: {
            '.label': {
                'pointer-events': 'none',
                text: 'Model',
                'ref-x': .5,
                'ref-y': 10,
                ref: '.body',
                'font-size': 18,
                'text-anchor': 'middle',
                fill: '#000'
            },
            '.body': {
                'ref-width': '100%',
                'ref-height': '100%'
            }
        },
        ports: {
            groups: {
                'in': {
                    position: {
                        name: 'left',
                        args: {}
                    },
                    markup: '<circle class="input-port"/>',
                    attrs: {
                        text: {
                            fill: 'black'
                        },
                        circle: {
                            fill: 'PaleGreen',
                            r: '10'
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
                'out': {
                    position: {
                        name: 'right',
                        args: {}
                    },
                    markup: '<circle class="output-port"/>',
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
                            name: 'right',
                            args: {
                                y: 10
                            }
                        }
                    }
                }
            }
        }
    }, joint.shapes.basic.Generic.prototype.defaults),
    initialize: function() {

        joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);

        this.on('change:inPorts change:outPorts', this.updatePortItems, this);
        this.updatePortItems();
    },
    updatePortItems: function(model, changed, opt) {

        var inPortItems = this.createPortItems('in', this.get('inPorts'));
        var outPortItems = this.createPortItems('out', this.get('outPorts'));

        this.prop('ports/items', inPortItems.concat(outPortItems), _.extend({ rewrite: true }, opt));
    },
    createPortItem: function(group, port) {

        return { id: port, group: group, attrs: { text: { text: port }}};
    },
    createPortItems: function(group, ports) {

        return _.map(ports, _.bind(this.createPortItem, this, group));
    }
});

joint.shapes.devs.Atomic = joint.shapes.devs.Model.extend({

    defaults: joint.util.deepSupplement({

        type: 'devs.Atomic',
        size: { width: 80, height: 80 },
        attrs: {
            '.label': {
                text: 'Atomic'
            }
        }
    }, joint.shapes.devs.Model.prototype.defaults)
});

joint.shapes.devs.Coupled = joint.shapes.devs.Model.extend({

    defaults: joint.util.deepSupplement({

        type: 'devs.Coupled',
        size: { width: 200, height: 300 },
        attrs: {
            '.label': {
                text: 'Coupled'
            }
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
