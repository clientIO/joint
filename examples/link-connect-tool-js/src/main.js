const { dia, shapes, linkTools, connectionStrategies } = joint;

// Paper

const paperContainer = document.getElementById("paper-container");

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: "100%",
    height: "100%",
    gridSize: 20,
    drawGrid: { name: "mesh" },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: "#F3F7F6" },
    defaultLink: () => new shapes.standard.Link(),
    connectionStrategy: connectionStrategies.pinAbsolute
});

paperContainer.appendChild(paper.el);

const rectangle = new shapes.standard.Rectangle();
rectangle.resize(100, 100);
rectangle.position(300, 100);
rectangle.addTo(graph);

const link = new shapes.standard.Link();
link.source({ x: 100, y: 100 });
link.target({ x: 400, y: 50 });
link.addTo(graph);

function getMarkup(angle = 0) {
    return [
        {
            tagName: "circle",
            selector: "button",
            attributes: {
                r: 7,
                fill: "#4666E5",
                cursor: "pointer"
            }
        },
        {
            tagName: "path",
            selector: "icon",
            attributes: {
                transform: `rotate(${angle})`,
                d: "M -4 -1 L 0 -1 L 0 -4 L 4 0 L 0 4 0 1 -4 1 z",
                fill: "#FFFFFF",
                stroke: "none",
                "stroke-width": 2,
                "pointer-events": "none"
            }
        }
    ];
}

const connect1 = new linkTools.Connect({
    distance: "20%",
    markup: getMarkup(0)
});

const connect2 = new linkTools.Connect({
    distance: "50%",
    markup: getMarkup(0)
});

const connect3 = new linkTools.Connect({
    distance: "80%",
    markup: getMarkup(0)
});

const tools = new dia.ToolsView({
    tools: [connect1, connect2, connect3]
});

link.findView(paper).addTools(tools);
