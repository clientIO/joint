joint.shapes.atlas = {};

joint.shapes.atlas.Mark = joint.shapes.basic.Path.extend({

    defaults: joint.util.deepSupplement({

        type: 'atlas.Mark',
        attrs: {
            'path': { d: 'M 0 30 30 0 h 60 a 3 3 0 0 1 3 60 h -60 z' },
            'text': { 'ref-y': .5 }
        }

    }, joint.shapes.basic.Path.prototype.defaults)
});

joint.shapes.atlas.Select = joint.shapes.basic.Generic.extend(_.extend({}, joint.shapes.basic.PortsModelInterface, {

    markup: '<g class="rotatable"><g class="scalable"><path/></g><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
    portMarkup: '<g class="port-<%= port.label %>"><circle/><text/></g>',

    defaults: joint.util.deepSupplement({

        type: 'atlas.Select',
        size: { width: 1, height: 1 },

        inPorts: [],
        outPorts: ['yes', 'no'],

        attrs: {
            '.': { magnet: true },
            path: {
                d: 'M 30 0 L 60 30 30 60 0 30 z',
                stroke: 'black'
            },
            circle: {
                r: 10,
                magnet: true,
                stroke: 'black'
            },
            text: {
                fill: 'black',
                'pointer-events': 'none'
            },
            '.label': { text: 'Select', 'ref-x': .5, 'ref-y': .5, ref: 'path', 'x-alignment': 'middle', 'y-alignment': 'middle', 'text-anchor': 'start' },
            '.inPorts': { display: 'none' },
            '.outPorts>.port-yes>text': { x: -15, dy: -30 },
            '.outPorts>.port-no>text': { x: 0, dy: -30 },
            '.outPorts>.port-yes>circle': {  },
            '.outPorts>.port-no>circle': {  }
        }

    }, joint.shapes.basic.Generic.prototype.defaults),

    getPortAttrs: function(portName, index, total, selector, type) {

        var attrs = {};

        var portClass = 'port-' + portName;
        var portSelector = selector + '>.' + portClass;
        var portTextSelector = portSelector + '>text';
        var portCircleSelector = portSelector + '>circle';

        attrs[portTextSelector] = { text: portName };
        attrs[portCircleSelector] = { port: { id: index, type: type, label: portName } };
        attrs[portSelector] = { ref: 'path', 'ref-y': .5 };

        if (portName === 'no') { attrs[portSelector]['ref-dx'] = 0; }

        return attrs;
    }
}));

joint.shapes.atlas.SelectView = joint.dia.ElementView.extend(joint.shapes.basic.PortsViewInterface);

joint.shapes.atlas.MultiSelect = joint.shapes.basic.Generic.extend(_.extend({}, joint.shapes.basic.PortsModelInterface, {

    markup: '<g class="rotatable"><g class="scalable"><rect/></g><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
    portMarkup: '<g class="port<%= port.id %>"><circle/><text/></g>',

    defaults: joint.util.deepSupplement({

        type: 'atlas.MultiSelect',
        size: { width: 1, height: 1 },

        inPorts: [],
        outPorts: [],

        attrs: {
            '.': { magnet: true },
            rect: {
                width: 150, height: 250,
                stroke: 'black'
            },
            circle: {
                r: 10,
                magnet: true,
                stroke: 'black'
            },
            text: {
                fill: 'black',
                'pointer-events': 'none'
            },
            '.label': { text: 'MultiSelect', 'ref-x': .5, 'ref-y': .2, 'x-alignment': 'middle' },
            '.inPorts text': { x: -15, dy: 4, 'text-anchor': 'end' },
            '.outPorts text': { x: 0, dy: 12, 'text-anchor': 'middle' }
        }

    }, joint.shapes.basic.Generic.prototype.defaults),

    getPortAttrs: function(port, index, total, selector, type) {

        var attrs = {};

        var portClass = 'port' + index;
        var portSelector = selector + '>.' + portClass;
        var portTextSelector = portSelector + '>text';
        var portCircleSelector = portSelector + '>circle';

        attrs[portTextSelector] = { text: port.label };
        attrs[portCircleSelector] = { port: { id: index, type: type, label: port.label } };
        attrs[portSelector] = { ref: 'rect', 'ref-x': (index + 0.5) * (1 / total) };

        if (selector === '.outPorts') { attrs[portSelector]['ref-dy'] = 0; }

        return attrs;
    }
}));

joint.shapes.atlas.MultiSelectView = joint.dia.ElementView.extend(joint.shapes.basic.PortsViewInterface);
