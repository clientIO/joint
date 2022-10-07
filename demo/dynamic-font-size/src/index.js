// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
const paper = new joint.dia.Paper({
    model: graph,
    cellViewNamespace: joint.shapes,
    width: '100%',
    height: '100%',
    gridSize: 20,
    drawGrid: { name: 'mesh' },
    async: true,
    sorting: joint.dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' }
});

paperContainer.appendChild(paper.el);

const ResizeTool = joint.elementTools.Control.extend({
    getPosition: function(view) {
        const model = view.model;
        const { width, height } = model.size();
        return { x: width, y: height };
    },
    setPosition: function(view, coordinates) {
        const model = view.model;
        model.resize(Math.max(coordinates.x, 1), Math.max(coordinates.y, 1));
    }
});

const rectangle1 = new joint.shapes.standard.Rectangle();
rectangle1.resize(300, 100);
rectangle1.position(100, 100);
rectangle1.addTo(graph);

const rectangle2 = rectangle1.clone();
rectangle2.position(500, 100);
rectangle2.attr('label/text', 'strokeWidth');
rectangle2.attr('body/strokeWidth', 'calc(0.1 * s)');
rectangle2.addTo(graph);
rectangle2.findView(paper).addTools(
    new joint.dia.ToolsView({
        tools: [
            new ResizeTool({
                selector: 'body',
                handleAttributes: {
                    fill: '#4666E5'
                }
            })
        ]
    })
);

rectangle1.attr('label', {
    text: 'fontSize',
    fontSize: 'calc(0.8 * h)',
    textWrap: {
        width: -10,
        height: '100%',
        ellipsis: true
    }
});

rectangle1.findView(paper).addTools(
    new joint.dia.ToolsView({
        tools: [
            new ResizeTool({
                selector: 'body',
                handleAttributes: {
                    fill: '#4666E5'
                }
            })
        ]
    })
);


