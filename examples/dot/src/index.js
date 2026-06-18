import { dia, elementTools, shapes as defaultShapes, util, V, g } from '@joint/core';
import { Graphviz } from "@hpcc-js/wasm/graphviz";

 import '../css/dot.css'

const graph = new dia.Graph({}, { cellNamespace: defaultShapes });

const paper = new dia.Paper({
    width: '100%',
    height: '100%',
    model: graph,
    // defaultConnectionPoint: { name: 'boundary', args: { offset: 20 }},
    // defaultConnector: {
    //     name: 'straight',
    //     args: { cornerType: 'line', cornerRadius: 10 },
    // },
    // defaultRouter: { name: 'orthogonal' },
    defaultConnector: { name: 'curve' },
    defaultConnectionPoint: { name: 'anchor' },
    async: true,
    // interactive: false,
    frozen: true,
    cellViewNamespace: defaultShapes,
    background: { color: '#131e29' }
});

document.getElementById('paper-container').appendChild(paper.el);

const diagram = {
    'objects': [
        {
            'id': 'pm',
            'data': {
                'nodes': [
                    {
                        'node_id': 0,
                    },
                    {
                        'node_id': 6,
                    },
                    {
                        'node_id': 8,
                    },
                    {
                        'node_id': 5,
                    },
                    {
                        'node_id': 3,
                    },
                    {
                        'node_id': 9,
                    },
                    {
                        'node_id': 1,
                    },
                    {
                        'node_id': 4,
                    },
                    {
                        'node_id': 7,
                    },
                    {
                        'node_id': 11,
                    },
                    {
                        'node_id': 10,
                    },
                    {
                        'node_id': 2,
                    },
                    {
                        'node_id': 12,
                    }
                ],
                'edges': [
                    {
                        'node_id_from': 5,
                        'node_id_to': 1,
                    },
                    {
                        'node_id_from': 5,
                        'node_id_to': 3,
                    },
                    {
                        'node_id_from': 5,
                        'node_id_to': 5,
                    },
                    {
                        'node_id_from': 5,
                        'node_id_to': 9,
                    },
                    {
                        'node_id_from': 9,
                        'node_id_to': 3,
                    },
                    {
                        'node_id_from': 9,
                        'node_id_to': 4,
                    },
                    {
                        'node_id_from': 10,
                        'node_id_to': 2,
                    },
                    {
                        'node_id_from': 8,
                        'node_id_to': 5,
                    },
                    {
                        'node_id_from': 8,
                        'node_id_to': 8,
                    },
                    {
                        'node_id_from': 1,
                        'node_id_to': 2,
                    },
                    {
                        'node_id_from': 3,
                        'node_id_to': 4,
                    },
                    {
                        'node_id_from': 3,
                        'node_id_to': 9,
                    },
                    {
                        'node_id_from': 6,
                        'node_id_to': 8,
                    },
                    {
                        'node_id_from': 11,
                        'node_id_to': 12,
                    },
                    {
                        'node_id_from': 11,
                        'node_id_to': 7,
                    },
                    {
                        'node_id_from': 11,
                        'node_id_to': 10,
                    },
                    {
                        'node_id_from': 0,
                        'node_id_to': 6,
                    },
                    {
                        'node_id_from': 2,
                        'node_id_to': 12,
                    },
                    {
                        'node_id_from': 7,
                        'node_id_to': 10,
                    },
                    {
                        'node_id_from': 7,
                        'node_id_to': 11,
                    },
                    {
                        'node_id_from': 4,
                        'node_id_to': 7,
                    },
                    {
                        'node_id_from': 4,
                        'node_id_to': 11,
                    }
                ]
            }
        }
    ]
};

const cells = [];
diagram.objects[0].data.nodes.forEach((node) => {
    cells.push({
        id: `${node.node_id}`,
        type: 'standard.Ellipse',
        size: { width: 32, height: 32 },
        // position: { x: Math.random() * 800, y: Math.random() * 800 },
        attrs: {
            // label: { text: node.node_name },
            label: { text: `${node.node_id}` },
            body: { fill: '#3498db', stroke: '#2980b9' }
        },
        z: 2
    });
});

diagram.objects[0].data.edges.forEach((edge) => {
    cells.push({
        type: 'standard.Link',
        source: { id: `${edge.node_id_from}` },
        target: { id: `${edge.node_id_to}` },
        z: -1,

        attrs: {
            line: {
                stroke: 'white',
                targetMarker: {
                    'type': 'path',
                    'd': 'M 6 -3 -2 0 6 3 z'
                }
            }
        }
    });
});

const variants = ['0', '6', '8', '5', '9', '4', '11'];

graph.fromJSON({ cells: cells });

Graphviz.load().then(graphviz => {
    const links = graph.getLinks().map(link => {
        const source = link.source().id.replace(/-/g, '_');
        const target = link.target().id.replace(/-/g, '_');
        console.log(source, target);
        return `${source} -> ${target};`;
    });

    const elements = graph.getElements().map(element => element.id.replace(/-/g, '_'));
    const elementAttributes = '' &&  elements.map(v => `${v} [width=2 height=2];`).join(' ');
    const dot = `digraph G { rankdir=LR; node [fixedsize=true width=0.5 height=0.5] edge [arrowhead=none] ${links.join(' ')} { rank=same; ${variants.join(', ')} } }`;
    console.log(dot)

    // const dot = `digraph G { rankdir=TB; ordering="in"; ${variants.map(v => `${v} [group=1];`).join(' ')} ${links.join(' ')} }`;

    const result = JSON.parse(graphviz.layout(dot, 'json', 'dot', { yInvert: true }));

    result.objects.forEach(obj => {
        const id = obj.name.replace(/_/g, '-');
        const element = graph.getCell(id);
        if (!element) {
            return;
        }
        if (variants.includes(id)) {
            element.attr('body/stroke', '#e74c3c');
        }
        const [x,y] = obj.pos.split(',').map(Number);
        const { width, height } = element.size();
        element.position(x - width / 2, y - height / 2);
    });

    graph.getLinks().forEach((link, index) => {


        const rawPoints = result.edges[index]._draw_[1].points.map(([x,y]) => { return { x, y } });

        let points = rawPoints.slice();

        function showPoints(points) {
            points.forEach((point, index) => {
                V('circle').attr({ r: 3, fill: 'red', cx: point.x, cy: point.y }).appendTo(paper.viewport);
            });
        }

        // points = points.filter((_, index) => index === 0 || ((index + 1) % 3 === 0));

        // points = points.filter((_, index) => index === 0);

        // showPoints(points);

        // x1,c1, c2a, x2, c2b, c3, x3
        // 0  1    2    3   0    1   2   3
        // find first point, the last point and points in between
        // const first = points[0];
        // const last = points[points.length - 1];
            // const middle = points.slice(1, points.length - 1);

        // showPoints([first]);

        const [first, second] = rawPoints;
        const [beforeLast, last] = rawPoints.slice(-2);

        const sourceCenter = link.getSourceCell().getBBox().center();
        const targetCenter = link.getTargetCell().getBBox().center();

        const sourceVector = new g.Point(second).difference(first);
        const targetVector = new g.Point(beforeLast).difference(last);

        const { x: dx1, y: dy1 } = new g.Point(first).difference(link.getSourceCell().getBBox().center());
        const { x: dx2, y: dy2 } = new g.Point(last).difference(link.getTargetCell().getBBox().center());

        link.prop({
            source: { anchor: { name: 'modelCenter', args: { dx: dx1, dy: dy1 }}},
            target: { anchor: { name: 'modelCenter', args: { dx: dx2, dy: dy2 }}}
        });

        link.connector('curve', {
            sourceTangent: sourceVector,
            targetTangent: targetVector,
        });

        // showPoints([beforeLast, last]);
        // showPoints([rawPoints[0], rawPoints[1]]);

        const vertices = rawPoints.filter((_, index) => ((index + 1) % 3 === 0));
        if (link.hasLoop()) {
            // showPoints(rawPoints);
            link.vertices([rawPoints[3]])
        }
        // link.set('vertices', vertices.slice(0, -1));
        // console.log(vertices.slice(0, -1))
    });

    // graph.getLinks()[1].attr('line/stroke', '#e74c3c');

    // console.log(result);

    paper.transformToFitContent({
        padding: 15,
        contentArea: graph.getBBox(),
        horizontalAlign: 'middle',
    });

    paper.unfreeze();

});
