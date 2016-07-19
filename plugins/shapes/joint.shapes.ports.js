
joint.shapes.ports = {};

joint.shapes.ports.Model = joint.shapes.basic.Generic.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><text/></g>',
    
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
                        fill: 'black',
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
                        fill: 'blue',
                        r: '7',
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
    },

    updatePortItems: function (model, changed, opt) {
        var group = 'out';
        var filter = 'in';
        if (this.changed.inPorts) {
            group = 'in';
            filter = 'out';
        }

        var portsItems = _.filter(model.prop('ports/items'), function(element) {
              return (element.group === filter );
        });

        model.prop('ports/items', _.map(changed, function (p) {
            return {id: p, group: group, attrs: {text: {text: p}}};
        }), _.extend({rewrite: true}, opt));

        model.prop('ports/items', model.prop('ports/items').concat(portsItems));
    }
});

joint.shapes.ports.Atomic = joint.shapes.ports.Model.extend({

    defaults: joint.util.deepSupplement({
        type: 'ports.Atomic',
        position: { x: 250, y: 250 },
        size: { width: 180, height: 80 },
        attrs: {
            text: {
                text: 'Atomic'
            },
            rect: { stroke: '#31d0c6', 'stroke-width': 6, fill: '#ffffff',  width: 180, height: 80 }
        }
    }, joint.shapes.ports.Model.prototype.defaults)
});