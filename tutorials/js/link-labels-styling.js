(function linkLabelsStyling() {

    var namespace = joint.shapes;

    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    new joint.dia.Paper({
        el: document.getElementById('paper-link-labels-styling'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        },
        interactive: false,
        cellViewNamespace: namespace
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
                r: 'calc(s)',
                cx: 0,
                cy: 0
            },
            asterisk: {
                ref: 'label',
                text: '＊',
                fill: '#ff0000',
                fontSize: 8,
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                pointerEvents: 'none',
                x: 'calc(x+16.5)',
                y: 'calc(y-2)'
            },
            asteriskBody: {
                ref: 'asterisk',
                fill: '#ffffff',
                stroke: '#000000',
                strokeWidth: 1,
                r: 'calc(s)',
                cx: 'calc(x+calc(0.5*w))',
                cy: 'calc(y+calc(0.5*h))'
            }
        }
    });
    link.addTo(graph);
}());
