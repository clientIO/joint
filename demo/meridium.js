var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph
});


joint.shapes.devs.StartFinish = joint.shapes.devs.Model.extend({
    markup: '<g class="rotatable"><g class="scalable"><rect/></g><image/><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
    defaults: _.defaultsDeep({
       type: 'devs.StartFinish',
       attrs: {
           rect: {
               rx: '70', ry: '70', 'stroke-width': 1,
               stroke: 'blue', fill: '#DCE6F2'
           },
           circle: { stroke: 'gray' },
           '.label': { text: 'Start/Finish', 'ref-x': .5, 'ref-y': .99, 'x-alignment': 'middle', 'y-alignment': 5, ref: 'rect' },
           '.inPorts circle': { fill: '#262626', r: '4', magnet: 'active' },
           '.outPorts circle': { fill: '#262626', r: '4', type: 'StartFinish', magnet: 'active' },
           '.inPorts text': { visibility: 'hidden' },
           '.outPorts text': { visibility: 'hidden' }
       }
   }, joint.shapes.devs.Model.prototype.defaults),

    getPortAttrs: function(portName, index, total, selector, type) {

        var attrs = {};
        
        var portClass = 'port' + index;
        var portSelector = selector + '>.' + portClass;
        var portTextSelector = portSelector + '>text';
        var portCircleSelector = portSelector + '>circle';

        attrs[portTextSelector] = { text: '' };
        attrs[portCircleSelector] = { port: { id: portName || _.uniqueId(type) , type: type } };
        attrs[portSelector] = { ref: 'rect', 'ref-y': (index + 0.5) * (1 / total) };
        
        if (selector === '.outPorts') { attrs[portSelector]['ref-dx'] = 0; }

        return attrs;
    }
});

joint.shapes.devs.StartFinishView = joint.shapes.devs.ModelView;

joint.shapes.devs.Operation = joint.shapes.devs.Model.extend({
   markup: '<g class="rotatable"><g class="scalable"><path/></g><image/><text class="label"/><g class="inPorts"/><g class="outPorts"/></g>',
   defaults: _.defaultsDeep({

       type: 'devs.Operation',
       size: { width: 50, height: 25 },
       attrs: {
           path: {
               d: 'M 10 0 L 50 0 L 40 25 L 0 25 z',
               stroke: 'blue', fill: '#DCE6F2'
           },
           circle: { stroke: 'gray' },
           '.label': { text: 'Operation', 'ref-x': .5, 'ref-y': .99, 'x-alignment': 'middle', 'y-alignment': 5, ref: 'path' },
           '.inPorts circle': { fill: '#262626', r: '4', magnet: 'active', type: 'Operation', 'ref-x': 14 },
           '.outPorts circle': { fill: '#262626', r: '4', type: 'Operation', magnet: 'active' },
           '.inPorts text': { visibility: 'hidden' },
           '.outPorts text': { visibility: 'hidden' }
       }
   }, joint.shapes.devs.Model.prototype.defaults),

    getPortAttrs: function(portName, index, total, selector, type) {

        var attrs = {};
        
        var portClass = 'port' + index;
        var portSelector = selector + '>.' + portClass;
        var portTextSelector = portSelector + '>text';
        var portCircleSelector = portSelector + '>circle';

        attrs[portTextSelector] = { text: '' };
        attrs[portCircleSelector] = { port: { id: portName || _.uniqueId(type) , type: type } };
        attrs[portSelector] = { ref: 'path', 'ref-y': (index + 0.5) * (1 / total) };
        
        if (selector === '.outPorts') { attrs[portSelector]['ref-dx'] = -10; }

        return attrs;
    }
    
});

joint.shapes.devs.OperationView = joint.shapes.devs.ModelView;


var sf = new joint.shapes.devs.StartFinish({
    position: { x: 50, y: 50 },
    size: { width: 100, height: 50 },
    inPorts: ['in'],
    outPorts: ['out']
});

graph.addCell(sf);

var op = new joint.shapes.devs.Operation({
    position: { x: 250, y: 100 },
    size: { width: 100, height: 50 },
    inPorts: ['in'],
    outPorts: ['out']
});

graph.addCell(op);




sf.on('change:attrs', function(element) {

    var text = rb.attr('.label/text');
    var fontSize = parseInt(rb.attr('.label/font-size'), 10);

    var svgDocument = V('svg').node;
    var textElement = V('<text><tspan></tspan></text>').node;
    var textSpan = textElement.firstChild;
    var textNode = document.createTextNode('');

    textSpan.appendChild(textNode);
    svgDocument.appendChild(textElement);
    document.body.appendChild(svgDocument);

    var lines = text.split('\n');
    var width = 0;

    // Find the longest line width.
    _.each(lines, function(line) {

        textNode.data = line;
        var lineWidth = textSpan.getComputedTextLength();

        width = Math.max(width, lineWidth);
    });

    var height = lines.length * (fontSize * 1.2);

    V(svgDocument).remove();
    
    element.resize(width + 10, height);
});


