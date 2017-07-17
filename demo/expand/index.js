var EXPANDED_COLOR = '#8CC152';
var COLLAPSED_COLOR = '#FCBB42';
var BASE_COLOR = '#434A54';

var appLink = joint.shapes.toggable.Link.define('app.Link',
    {
        markup: [
            '<path class="connection" stroke="#434A54" d="M 0 0 0 0"/>',
            '<path class="marker-source" fill="#434A54" stroke="#434A54" d="M 0 0 0 0"/>',
            '<path class="marker-target" fill="#434A54" stroke="#434A54" d="M 0 0 0 0"/>',
            '<path class="connection-wrap" d="M 0 0 0 0"/>',
            '<g class="marker-vertices"/>',
            '<g class="marker-arrowheads"/>'
        ].join(''),
        attrs: {
            '.marker-target': { fill: BASE_COLOR, d: 'M 10 0 L 0 5 L 10 10 z' },
            '.marker-source': { fill: BASE_COLOR, d: 'M 10 0 L 0 5 L 10 10 z' }
        }
    });

var appModel = joint.shapes.toggable.Element.define('app.Model',
    {
        ports: {
            groups: {
                'in': {
                    attrs: {
                        circle: {
                            stroke: BASE_COLOR,
                            magnet: true,
                            fill: EXPANDED_COLOR
                        }
                    },
                    position: {
                        name: 'left'
                    }
                },
                'out': {
                    attrs: {
                        circle: {
                            stroke: BASE_COLOR,
                            magnet: true,
                            fill: EXPANDED_COLOR
                        }
                    },
                    position: 'right'
                }
            }
        },
        attrs: {
            text: {
                refX: '50%',
                refY: '50%',
                'font-weight': 'bold',
                'font-size': 24,
                xAlignment: 'middle',
                yAlignment: 'middle',
                fill: '#F5F7FA'
            },
            '.body': {
                refWidth: 1,
                refHeight: 1,
                fill: '#AAB2BD'
            }
        }

    }, {
        markup: '<g class="rotatable"><rect class="body"/><text class="label"/></g>',
        options: {
            onPortExpand: function(cell, portId, expand) {

                var color = expand ? EXPANDED_COLOR : COLLAPSED_COLOR;
                var className = expand ? 'expanded' : 'collapsed';

                cell.portProp(portId, 'attrs/circle/fill', color);
                cell.portProp(portId, 'attrs/circle/class', className);
            }
        }
    }
);

var graph = new joint.dia.Graph();

var paper = new joint.dia.ExpandPaper({
    el: document.getElementById('paper'),
    width: 800,
    height: 600,
    gridSize: 1,
    model: graph,
    defaultLink: new appLink(),
    validateMagnet: function(cellView, magnet) {

        var cell = cellView.model;
        var portId = V(magnet).attr('port');
        return !cell.isPortCollapsed(portId);
    }
});

var a = new appModel({
    id: 'a',
    attrs: { '.label': { text: 'a' } },
    ports: {
        items: [
            { group: 'in', id: 'in1', type: 'a' },
            { group: 'in', id: 'in2', type: 'o' },
            { group: 'out', id: 'out1' },
            { group: 'out', id: 'out2' }
        ]
    }
}).size(100, 100).position(200, 10).addTo(graph);

var aa = new appModel({
    hidden: false,
    id: 'aa',
    attrs: { '.label': { text: 'aa' } },
    ports: {
        items: [
            { group: 'in', id: 'in1' },
            { group: 'in', id: 'in2' },
            { group: 'out', id: 'out1' },
            { group: 'out', id: 'out2' }
        ]
    }
}).size(100, 100).position(400, 10).addTo(graph);

var aaa = new appModel({
    id: 'aaa',
    attrs: { '.label': { text: 'aaa' } },
    ports: {
        items: [
            { group: 'in', id: 'in1' },
            { group: 'out', id: 'out1' }
        ]
    }
}).size(100, 100).position(550, 100).addTo(graph);

var b = new appModel({
    id: 'b',
    attrs: { '.label': { text: 'b' } },
    ports: {
        items: [
            { group: 'in', id: 'in1' },
            { group: 'in', id: 'in2' },
            { group: 'out', id: 'out1' },
            { group: 'out', id: 'out2' }
        ]
    }
}).size(100, 100).position(200, 200).addTo(graph);

var bb = new appModel({
    id: 'bb',
    attrs: { '.label': { text: 'bb' } },
    ports: {
        items: [
            { group: 'in', id: 'in1' },
            { group: 'in', id: 'in2' },
            { group: 'out', id: 'out1' },
            { group: 'out', id: 'out2' }
        ]
    }
}).size(100, 100).position(400, 200).addTo(graph);

var bbb = new appModel({
    id: 'bbb', attrs: { '.label': { text: 'bbb' } },
    ports: {
        items: [
            { group: 'in', id: 'in1' },
            { group: 'in', id: 'in2' },
            { group: 'out', id: 'out1' },
            { group: 'out', id: 'out2' }
        ]
    }
}).size(100, 100).position(400, 350).addTo(graph);

var x = new appModel({
    id: 'x', attrs: { '.label': { text: 'x' } },
    ports: {
        items: [
            { group: 'out', id: 'out1' },
            { group: 'out', id: 'out2' }
        ]
    }
}).size(100, 100).position(60, 400).addTo(graph);

var y = new appModel({
    id: 'y', attrs: { '.label': { text: 'y' } },
    ports: {
        items: [
            { group: 'out', id: 'out1' },
            { group: 'out', id: 'out2' }
        ]
    }
}).size(100, 100).position(30, 80).addTo(graph);

var link = new appLink();

link.clone().set({ id: 'aToAa', source: { id: a.id, port: 'out1' }, target: { id: aa.id, port: 'in1' } }).addTo(graph);
link.clone().set({ source: { id: aa.id, port: 'out2' }, target: { id: aaa.id, port: 'in1' } }).addTo(graph);
link.clone().set({ source: { id: b.id, port: 'out1' }, target: { id: bb.id, port: 'in1' } }).addTo(graph);
link.clone().set({ source: { id: b.id, port: 'out2' }, target: { id: bbb.id, port: 'in1' } }).addTo(graph);
link.clone().set({ source: { id: b.id, port: 'out1' }, target: { id: aaa.id, port: 'in1' } }).addTo(graph);
link.clone().set({ source: { id: aaa.id, port: 'out1' }, target: { x: 700, y: 100 } }).addTo(graph);
link.clone().set({ source: { id: bbb.id, port: 'in1' }, target: { id: x.id, port: 'out2' } }).addTo(graph);
link.clone().set({ source: { id: b.id, port: 'in2' }, target: { id: x.id, port: 'out1' } }).addTo(graph);
link.clone().set({ source: { id: b.id, port: 'in1' }, target: { id: y.id, port: 'out2' } }).addTo(graph);
link.clone().set({ source: { id: a.id, port: 'in1' }, target: { id: y.id, port: 'out1' } }).addTo(graph);

// Simple unit testing
var isExpanded = function(cell, portId) {
    console.assert(cell.isVisible());
    console.assert(!cell.portProp(portId, 'collapsed'), 'port ' + portId + ' on ' + cell.id + ' should be  expanded');

};
var isCollapsed = function(cell, portId) {
    console.assert(cell.isVisible());
    console.assert(cell.portProp(portId, 'collapsed'), 'port ' + portId + ' on ' + cell.id + ' should be  collapsed');
};

var runTests = function() {

/////////////
    a.hide();
    console.assert(aa.portProp('in1', 'collapsed'), 'aa in1 is collapsed');

/////////////
    a.show();
    console.assert(!aa.portProp('in1', 'collapsed'), 'aa in1 is expanded');

/////////////
    bb.hide();
    aaa.hide();
    console.assert(b.portProp('out1', 'collapsed'), 'b out1 is collapsed');
    console.assert(aa.portProp('out2', 'collapsed'), 'aa out2 is collapsed');

    aaa.show();
    console.assert(!aa.portProp('out2', 'collapsed'), 'aa in1 is expanded');
    console.assert(b.portProp('out1', 'collapsed'), 'b out1 is collapsed');

    bb.show();
    console.assert(!b.portProp('out1', 'collapsed'), 'is expanded');
    console.assert(!aaa.portProp('in1', 'collapsed'), 'is expanded');

////////////
    aaa.hide();
    bb.hide();
    bbb.hide();
    console.assert(b.portProp('out1', 'collapsed'), 'b out1 is collapsed');
    console.assert(b.portProp('out2', 'collapsed'), 'b out2 is collapsed');
    console.assert(aa.portProp('out2', 'collapsed'), 'aa out2 is collapsed');

    aaa.show();
    bb.show();
    bbb.show();
    console.assert(!b.portProp('out1', 'collapsed'), 'is expanded');
    console.assert(!b.portProp('out2', 'collapsed'), 'is expanded');

////////////////
    aa.hide();
    a.hide();

    a.show();
    isExpanded(a, 'in1');
    isCollapsed(a, 'out1');
    isCollapsed(aaa, 'in1');

    aa.show();
    isExpanded(aaa, 'in1');
    isExpanded(a, 'out1');

/////////////
    x.hide();
    isCollapsed(b, 'in2');
    isCollapsed(bbb, 'in1');
    bbb.hide();
    isCollapsed(b, 'out2');

    bbb.show();
    isCollapsed(bbb, 'in1');
    isCollapsed(b, 'in2');
    x.show();
};

try {
    // run simple unit tests
    runTests();
    console.log('OK');
} catch (err) {
    console.log('FAIL', err);
}

paper.on('cell:pointerclick', function(cellView, evt) {

    var cell = cellView.model;
    if (cell.isLink()) {
        return;
    }
    var $el = $(evt.target);
    var portId = $el.attr('port');

    if (portId) {
        cell.expandPort(portId)
    } else {
        cell.hide();
    }
});

$('<button/>').text('Show All').on('click', function() {
    _.each(graph.getCells(), function(cell) {
        if (!cell.isVisible()) {
            cell.show();
        }
    });

}).appendTo('body');

