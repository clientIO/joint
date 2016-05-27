'use strict';

(function() {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: $('#paper'),
        width: 600,
        height: 400,
        gridSize: 1,
        model: graph
    });

    function makeLink(el1, el2) {
        var l = new joint.dia.Link({
            source: { id: el1.id },
            target: { id: el2.id },
            attrs: {
                '.connection': { stroke: 'gray' }
            }
        });
        return l;
    }

    function makeElement(attrs) {
        var el = new joint.shapes.basic.Rect({
            size: { width: 30, height: 30 },
            attrs: { rect: { rx: 2, ry: 2, fill: '#31D0C6', stroke: '#4B4A67', 'stroke-width': 2 }, text: { text: 'rect', fill: 'white' } }
        });
        el.attr(attrs);
        return el;
    }

    var topGroup = makeElement({ text: { text: 'TopGroup', 'ref-y': 15 }});
    var bottomGroup = makeElement({ text: { text: 'Bottom Group', 'ref-y': 15 }});
    var group = makeElement({ text: { text: 'Group', 'ref-y': 15 }});

    var ea = makeElement({ text: { text: 'a' }, rect: { fill: '#FE854F' }});
    var eb = makeElement({ text: { text: 'b' }, rect: { fill: '#FE854F' }});
    var ec = makeElement({ text: { text: 'c' }, rect: { fill: '#FE854F' }});
    var ed = makeElement({ text: { text: 'd' }, rect: { fill: '#FE854F' }});
    var ee = makeElement({ text: { text: 'e' }, rect: { fill: '#FE854F' }});
    var ef = makeElement({ text: { text: 'f' }, rect: { fill: '#FE854F' }});
    var eg = makeElement({ text: { text: 'g' }, rect: { fill: '#FE854F' }});
    var eh = makeElement({ text: { text: 'h' }, rect: { fill: '#FE854F' }});

    var lab = makeLink(ea, eb);
    var lbc = makeLink(eb, ec);
    var lbd = makeLink(eb, ed);
    var lbe = makeLink(eb, ee);
    var lbf = makeLink(eb, ef);
    var lbg = makeLink(eb, eg);
    var lhg = makeLink(eh, eg);

    group.embed(topGroup).embed(bottomGroup);
    topGroup.embed(eb).embed(eh);
    bottomGroup.embed(ec).embed(ed).embed(ee).embed(ef);

    graph.addCell([group, topGroup, bottomGroup, ea, eb, ec, ed, ed, ee, ef, eg, eh, lab, lbc, lbd, lbe, lbf, lbg, lhg]);

    joint.layout.DirectedGraph.layout(graph, {
        setLinkVertices: false,
        rankDir: 'TB',
        marginX: 50,
        marginY: 50,
        clusterPadding: { top: 30, left: 10, right: 10, bottom: 10 }
    });

})();
