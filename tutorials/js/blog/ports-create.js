(function() {

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper-create'), width: 650, height: 200, gridSize: 1, model: graph });

var m1 = new joint.shapes.devs.Model({
    position: { x: 50, y: 50 },
    size: { width: 90, height: 90 },
    inPorts: ['in1','in2'],
    outPorts: ['out'],
    attrs: {
        '.label': { text: 'Model', 'ref-x': .4, 'ref-y': .2 },
        rect: { fill: '#2ECC71' },
        '.inPorts circle': { fill: '#16A085' },
        '.outPorts circle': { fill: '#E74C3C' }
    }
});
graph.addCell(m1);

}())
