
joint.shapes.ports = {};

joint.shapes.ports.Model = joint.shapes.basic.Generic.extend({

    defaults: joint.util.deepSupplement({
    type: 'ports.Model',
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
                    }
                }
            }
        }
    }, joint.shapes.basic.Generic.prototype.defaults),

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
        var groupFilter = function(array, groupName) {
            return _.filter(array, function(element) {
              return (element.group === groupName );
            });
        };

        var portsItems = groupFilter(model.prop('ports/items'), filter);

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
        markup: '<rect/>',
        attrs: {
            text: {
                text: 'Atomic'
            },
            rect: { stroke: '#31d0c6', 'stroke-width': 2, fill: '#ffffff' }
        }
    }, joint.shapes.ports.Model.prototype.defaults)
});