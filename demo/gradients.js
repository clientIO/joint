var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper'), width: 650, height: 400, gridSize: 1, model: graph });

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
el1.attr('text/text', 'linearGradient\n(both fill and stroke)');
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
el1.attr('rect/filter', { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } });
graph.addCell(el1);


var el2 = el.clone();
el2.translate(300, 20);
el2.attr('text/text', 'radialGradient\n(both fill and stroke)');
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
