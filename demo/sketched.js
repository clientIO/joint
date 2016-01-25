var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({ el: $('#paper'), width: 650, height: 400, model: graph });

var rb = new joint.shapes.basic.Rect({
    position: { x: 50, y: 50 },
    size: { width: 120, height: 40 },
    attrs: {
        text: { text: 'My Rectangle' },
        rect: {
            'stroke-width': 3,
            stroke: '#7C68FC',
            fill: '#FEB663',
            'fill-opacity': .8,
            filter: 'url(#sketched-filter)'
        }
    }
});
graph.addCell(rb);

var cb = new joint.shapes.basic.Circle({
    position: { x: 300, y: 70 },
    size: { width: 100, height: 100 },
    attrs: {
        text: { text: 'My Circle' },
        circle: {
            'stroke-width': 3,
            stroke: '#31D0C6',
            fill: '#FEB663',
            'fill-opacity': .8,
            filter: 'url(#sketched-filter)'
        }
    }
});
graph.addCell(cb);

var l1 = new joint.dia.Link({
    source: { id: rb.id },
    target: { id: cb.id },
    router: { name: 'manhattan' },
    attrs: {
        '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z',
            filter: 'url(#sketched-filter)'
        },
        '.connection': {
            filter: 'url(#sketched-filter)',
            'stroke-width': 3
        }
    }
});
graph.addCell(l1);

var cb2 = cb.clone().attr('text/text', 'My Circle 2').addTo(graph);
cb2.translate(0, 150);
var l2 = l1.clone().set({ source: { id: rb.id }, target: { id: cb2.id } }).addTo(graph);

var sketchedFilter = V('<filter filterUnits="userSpaceOnUse" id="sketched-filter" color-interpolation-filters="sRGB"><feTurbulence result="result91" id="feTurbulence3810" type="turbulence" stitchTiles="noStitch" numOctaves="3" baseFrequency="0.04" seed="0"></feTurbulence><feDisplacementMap scale="6.6" in="SourceGraphic" in2="result91" id="feDisplacementMap3812" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap></filter>');
V(paper.svg).defs().append(sketchedFilter);
