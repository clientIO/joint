var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph
});

joint.shapes.fsa.MyState = joint.shapes.fsa.State.extend({

    markup: [
        '<g class="rotatable"><g class="scalable">',
        '<clipPath id="clip-top1"><rect x="-30" y="0" width="60" height="30"/></clipPath>',
        '<clipPath id="clip-top2"><rect x="-30" y="15" width="60" height="30"/></clipPath>',
        '<circle class="a"/><circle class="b"/><circle class="c"/>',
        '</g><text/></g>'
    ].join(''),

    defaults: _.defaultsDeep({
        type: 'fsa.MyState',
        size: { width: 60, height: 60 },
        attrs: {
            'circle': { fill: 'white' },
            '.b': { fill: 'red', 'clip-path': 'url(#clip-top1)' },
            '.c': { fill: 'blue', 'clip-path': 'url(#clip-top2)' }
        }
    }, joint.shapes.fsa.State.prototype.defaults)
});

var mystate1 = new joint.shapes.fsa.MyState({
    position: { x: 50, y: 50 },
    size: { width: 100, height: 100 },
    attrs: { text: { text: 'my state 1' } }
});

graph.addCell(mystate1);

var mystate2 = new joint.shapes.fsa.MyState({
    position: { x: 50, y: 160 },
    size: { width: 50, height: 50 }
});

graph.addCell(mystate2);
