(function linkLabelsStyling() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-link-labels-styling'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        },
        interactive: false
    });

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(100, 50));
    link.target(new g.Point(500, 50));
    link.appendLabel({
        markup: [
            {
                tagName: 'circle',
                selector: 'body'
            }, {
                tagName: 'text',
                selector: 'label'
            }, {
                tagName: 'circle',
                selector: 'asteriskBody'
            }, {
                tagName: 'text',
                selector: 'asterisk'
            }
        ],
        attrs: {
            label: {
                text: '½',
                fill: '#000000',
                fontSize: 14,
                textAnchor: 'middle',
                yAlignment: 'middle',
                pointerEvents: 'none'
            },
            body: {
                ref: 'label',
                fill: '#ffffff',
                stroke: '#000000',
                strokeWidth: 1,
                refR: 1,
                refCx: 0,
                refCy: 0
            },
            asterisk: {
                ref: 'label',
                text: '＊',
                fill: '#ff0000',
                fontSize: 8,
                textAnchor: 'middle',
                yAlignment: 'middle',
                pointerEvents: 'none',
                refX: 16.5,
                refY: -2
            },
            asteriskBody: {
                ref: 'asterisk',
                fill: '#ffffff',
                stroke: '#000000',
                strokeWidth: 1,
                refR: 1,
                refCx: '50%',
                refCy: '50%',
                refX: 0,
                refY: 0
            }
        }
    });
    link.addTo(graph);
}());
