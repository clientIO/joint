(function() {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 700,
        height: 700,
        model: graph
    });

    // [[fill, text], ...]
    var colors = [
        ['#feb663', '#3c4260'],
        ['#4b4a67', '#f6f6f6'],
        ['#dcd7d7', '#3c4260'],
        ['#b75d32', '#f6f6f6'],
        ['#30d0c6', '#ffffff']
    ];
    var text = ['oops', 'yes', 'oh', 'no', 'ah', 'whoaa', 'aloha', 'ciao'];
    var radii = [23, 30, 25, 27];

    function randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    var Ellipse = joint.dia.Element.define('Ellipse', {
        attrs: {
            ellipse: {
                refRx: '50%',
                refRy: '50%',
                refCx: '50%',
                refCy: '50%',
                stroke: '#333'
            },
            text: {
                fontSize: 8,
                refX: '50%',
                refY: '50%',
                textAnchor: 'middle',
                y: '.3em'
            }
        }
    }, {
        markup: '<ellipse/><text/>'
    });

    function addNode(graph, opt) {
        var radius = randomItem(radii);
        var color = randomItem(colors);
        var label = randomItem(text);
        var node = new Ellipse({
            size: { width: radius, height: radius },
            attrs: {
                text: {
                    text: label,
                    fill: color[1]
                },
                ellipse: {
                    fill: color[0]
                }
            }
        });
        graph.addCell(node, opt);
        return node;
    }

    function addLink(graph, a, b, opt) {
        var link = new joint.dia.Link({
            source: { id: a.id },
            target: { id: b.id },
            markup: '<path class="connection" stroke="black" d="M 0 0 0 0"/>'
        });
        graph.addCell(link, opt);
    }

    function generateRandomChainGraph(graph, n, opt) {
        var a = addNode(graph, opt);
        for (var i = 0; i < n - 1; i++) {
            var b = addNode(graph, opt);
            addLink(graph, a, b, opt);
            a = b;
        }
    }

    function getChainElements(graph) {
        var sources = graph.getSources();
        var source = sources[0];
        var successors = graph.getSuccessors(source);
        successors.unshift(source);
        return successors;
    }

    function diameter(el) {
        if (!el) return 0;
        var size = el.size();
        return Math.max(size.width, size.height) + 20;
    }

    function spiralLayout(graph, opt) {

        opt = opt || {};
        var chain = getChainElements(graph);
        var angle = Math.PI;
        chain.forEach(function(el, i) {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            var x = opt.radius * (cos + angle * sin);
            var y = opt.radius * (sin - angle * cos);
            el.set('position', { x: opt.center.x + x, y: opt.center.y + y });
            var dia = diameter(el) / 2 + diameter(chain[i + 1]) / 2;
            angle += 1 * Math.atan((dia + opt.spacing) / Math.sqrt(x * x + y * y));
        });
    }

    var layoutGraph = new joint.dia.Graph;
    generateRandomChainGraph(layoutGraph, 50, { dry: true });
    spiralLayout(layoutGraph, {
        radius: 10,
        center: { x: 350, y: 350 },
        spacing: 10
    });

    graph.resetCells(layoutGraph.getCells());

})(joint);
