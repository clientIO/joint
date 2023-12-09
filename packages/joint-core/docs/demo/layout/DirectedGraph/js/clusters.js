'use strict';

(function() {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
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
        var el = new joint.shapes.standard.Rectangle({
            size: { width: 30, height: 30 },
            attrs: {
                body: {
                    rx: 2,
                    ry: 2,
                    fill: '#31D0C6',
                    stroke: '#4B4A67',
                    strokeWidth: 2,
                },
                label: { text: 'rect', fill: 'white' },
            },
        });
        el.attr(attrs);
        return el;
    }

    var topGroup = makeElement({ label: { text: 'TopGroup', 'ref-y': 15 }});
    var bottomGroup = makeElement({ label: { text: 'Bottom Group', 'ref-y': 15 }});
    var group = makeElement({ label: { text: 'Group', 'ref-y': 15 }});

    var ea = makeElement({ label: { text: 'a' }, body: { fill: '#FE854F' }});
    var eb = makeElement({ label: { text: 'b' }, body: { fill: '#FE854F' }});
    var ec = makeElement({ label: { text: 'c' }, body: { fill: '#FE854F' }});
    var ed = makeElement({ label: { text: 'd' }, body: { fill: '#FE854F' }});
    var ee = makeElement({ label: { text: 'e' }, body: { fill: '#FE854F' }});
    var ef = makeElement({ label: { text: 'f' }, body: { fill: '#FE854F' }});
    var eg = makeElement({ label: { text: 'g' }, body: { fill: '#FE854F' }});
    var eh = makeElement({ label: { text: 'h' }, body: { fill: '#FE854F' }});

    var lab = makeLink(ea, eb);
    var lbc = makeLink(eb, ec);
    var lbd = makeLink(eb, ed);
    var lbe = makeLink(eb, ee);
    var lbf = makeLink(eb, ef);
    var lbg = makeLink(eb, eg);
    var lhg = makeLink(eh, eg);

    group.embed([topGroup, bottomGroup]);
    topGroup.embed([eb, eh]);
    bottomGroup.embed([ec, ed, ee, ef]);

    graph.addCell([group, topGroup, bottomGroup, ea, eb, ec, ed, ed, ee, ef, eg, eh, lab, lbc, lbd, lbe, lbf, lbg, lhg]);

    joint.layout.DirectedGraph.layout(graph, {
        setLinkVertices: false,
        rankDir: 'TB',
        marginX: 50,
        marginY: 50,
        clusterPadding: { top: 30, left: 10, right: 10, bottom: 10 }
    });

})();
