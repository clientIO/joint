(function() {

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper-gradients'), width: 650, height: 280, gridSize: 1, model: graph });

var el = new joint.shapes.basic.Rect({
    position: { x: 0, y: 0 },
    size: { width: 200, height: 100 },
    attrs: {
        rect: { rx: 2, ry: 2, fill: '#2ECC71', stroke: 'black', 'stroke-width': 20 },
        text: { 'font-size': 15, fill: '#333' }
    }
});

var el1 = el.clone();
el1.translate(20, 20);
el1.attr('text/text', 'linear gradient\n(both fill and stroke)');
el1.attr('rect/fill', {
    type: 'linearGradient',
    stops: [
        { offset: '0%', color: '#E67E22' },
        { offset: '20%', color: '#D35400' },
        { offset: '40%', color: '#E74C3C' },
        { offset: '60%', color: '#C0392B' },
        { offset: '80%', color: '#F39C12' }
    ]
});
el1.attr('rect/stroke', {
    type: 'linearGradient',
    stops: [
        { offset: '0%', color: '#3498DB' },
        { offset: '50%', color: '#9B59B6' }
    ]
});
graph.addCell(el1);


var el2 = el.clone();
el2.translate(300, 20);
el2.attr('text/text', 'radial gradient\n(both fill and stroke)');
el2.attr('rect/fill', {
    type: 'radialGradient',
    stops: [
        { offset: '0%', color: '#E67E22' },
        { offset: '20%', color: '#D35400' },
        { offset: '40%', color: '#E74C3C' },
        { offset: '60%', color: '#C0392B' },
        { offset: '80%', color: '#F39C12' }
    ]
});
el2.attr('rect/stroke', {
    type: 'radialGradient',
    stops: [
        { offset: '95%', color: '#3498DB' },
        { offset: '98%', color: '#9B59B6' }
    ]
});
graph.addCell(el2);

// Note the use of the x1, y1, x2 and y2 attributes that allows you to define the direction
// of the gradient.
var el3 = el1.clone();
el3.translate(0, 135);
el3.attr('text/text', 'linear gradient\n(top-down)');
el3.attr('rect/fill/attrs', { x1: '0%', y1: '0%', x2: '0%', y2: '100%' });
graph.addCell(el3);
    
}())
