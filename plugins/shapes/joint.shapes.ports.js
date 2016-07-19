
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
        var that = this;
        this.listenTo(this, 'change:inPorts', function (cell, changed, opt) {
            that.changePorts(cell, opt, 'inPorts');
        });
        this.listenTo(this, 'change:outPorts', function (cell, changed, opt) {
            that.changePorts(cell, opt, 'outPorts');
        });
    },

    changePorts: function (model, opt, type) {
        var ports = model.get(type);
        var group = 'out';
        var filter = 'in';
        var groupFilter = function(array, groupName) {
            return _.filter(array, function(element) {
              return (element.group === groupName );
            });
        };

        if (type === 'inPorts') {
            group = 'in';
            filter = 'out';
        }

        var portsItems = groupFilter(model.prop('ports/items'), filter);

        model.prop('ports/items', _.map(ports, function (p) {
            return {id: p, group: group, attrs: {text: {text: p}}};
        }), _.extend({rewrite: true}, opt));

        model.prop('ports/items', model.prop('ports/items').concat(portsItems));
    },
    portData: {
            getPorts: function() {
                return [];
            }
    }
});

joint.shapes.ports.Atomic = joint.shapes.ports.Model.extend({

    defaults: joint.util.deepSupplement({
        type: 'ports.Atomic',
        position: { x: 250, y: 250 },
        size: { width: 180, height: 80 },
        markup: '<rect width="180" height="80" stroke="red"/>',
        attrs: {
            '.body': {
                fill: 'salmon'
            },
            '.label': {
                text: 'Atomic'
            }
        }
    }, joint.shapes.ports.Model.prototype.defaults)
});