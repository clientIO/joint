var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper'), width: 650, height: 400, gridSize: 1, model: graph });

var m1 = new joint.shapes.devs.Atomic({
    position: { x: 50, y: 50 },
    size: { width: 90, height: 90 },
    inPorts: ['in1','in2'],
    outPorts: ['out']
});
graph.addCell(m1);

var m2 = m1.clone();
m2.translate(200, 100);
graph.addCell(m2);

// Manually create a link connecting ports.

var l1 = new joint.dia.Link({
    source: { id: m1.id, port: 'out' },
    target: { id: m2.id, port: 'in1' }
});

graph.addCell(l1);


joint.shapes.devs.MyImageModel = joint.shapes.devs.Model.extend({

    markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><image/><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',

    defaults: joint.util.deepSupplement({

        type: 'devs.MyImageModel',
        size: { width: 80, height: 80 },
        attrs: {
            rect: { stroke: '#d1d1d1', fill: { type: 'linearGradient', stops: [{offset: '0%', color: 'white'}, {offset: '50%', color: '#d1d1d1'}], attrs: { x1: '0%', y1: '0%', x2: '0%', y2: '100%' } } },
            circle: { stroke: 'gray' },
            '.label': { text: 'My Shape', 'ref-y': -20 },
            '.inPorts circle': { fill: '#c8c8c8' },
            '.outPorts circle': { fill: '#262626' },
            image: { 'xlink:href': 'http://jointjs.com/images/logo.png', width: 80, height: 50, 'ref-x': .5, 'ref-y': .5, ref: 'rect', 'x-alignment': 'middle', 'y-alignment': 'middle' }
        }

    }, joint.shapes.devs.Model.prototype.defaults)
});

joint.shapes.devs.MyImageModelView = joint.shapes.devs.ModelView;

// Usage:

var imageModel = new joint.shapes.devs.MyImageModel({
    position: { x: 450, y: 250 },
    size: { width: 90, height: 81 },
    inPorts: ['in1','in2'],
    outPorts: ['out']
});
graph.addCell(imageModel);


joint.shapes.devs.CircleModel = joint.shapes.devs.Model.extend({

    markup: '<g class="rotatable"><g class="scalable"><circle class="body"/></g><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
    portMarkup: '<g class="port port<%= id %>"><rect class="port-body"/><text class="port-label"/></g>',

    defaults: joint.util.deepSupplement({

        type: 'devs.CircleModel',
        attrs: {
            '.body': { r: 50, cx: 50, stroke: 'blue', fill: 'lightblue' },
            '.label': { text: 'Circle Model', 'ref-y': 0.5, 'y-alignment': 'middle' },
            '.port-body': { width: 10, height: 10, x: -5, stroke: 'gray', fill: 'lightgray', magnet: 'active' }
        }

    }, joint.shapes.devs.Model.prototype.defaults)
});

joint.shapes.devs.CircleModelView = joint.shapes.devs.ModelView;

var circleModel = new joint.shapes.devs.CircleModel({
    position: { x: 500, y: 100 },
    size: { width: 100, height: 100 },
    inPorts: ['a'],
    outPorts: ['b']
});
graph.addCell(circleModel);
