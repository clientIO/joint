var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    model: graph
});

var rb = new joint.shapes.standard.Rectangle({
    position: { x: 50, y: 50 },
    size: { width: 120, height: 40 },
    attrs: {
        label: {
            text: 'My Rectangle'
        },
        body: {
            strokeWidth: 3,
            stroke: '#7C68FC',
            fill: '#FEB663',
            fillOpacity: .8,
            filter: 'url(#sketched-filter)'
        }
    }
});

var cb1 = new joint.shapes.standard.Circle({
    position: { x: 300, y: 70 },
    size: { width: 100, height: 100 },
    attrs: {
        label: {
            text: 'My Circle'
        },
        body: {
            strokeWidth: 3,
            stroke: '#31D0C6',
            fill: '#FEB663',
            fillOpacity: .8,
            filter: 'url(#sketched-filter)'
        }
    }
});

var cb2 = cb1.clone().attr('label/text', 'My Circle 2').translate(0, 150);

var l1 = new joint.shapes.standard.Link({
    source: { id: rb.id },
    target: { id: cb1.id },
    router: { name: 'manhattan' },
    attrs: {
        line: {
            filter: 'url(#sketched-filter)',
            strokeWidth: 3
        }
    }
});

var l2 = l1.clone().set({
    source: { id: rb.id },
    target: { id: cb2.id }
});

graph.addCells([rb, cb1, cb2, l1, l2]);

var filterXML = '<filter filterUnits="userSpaceOnUse" id="sketched-filter" color-interpolation-filters="sRGB"><feTurbulence result="result91" id="feTurbulence3810" type="turbulence" stitchTiles="noStitch" numOctaves="3" baseFrequency="0.04" seed="0"></feTurbulence><feDisplacementMap scale="6.6" in="SourceGraphic" in2="result91" id="feDisplacementMap3812" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap></filter>';
V(filterXML).appendTo(paper.defs);
