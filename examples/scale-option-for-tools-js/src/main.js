const { dia, shapes } = joint;

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
    linkPinning: false,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: "#F3F7F6" },
    defaultLink: () => new joint.shapes.standard.Link()
});

paperContainer.appendChild(paper.el);

const buttonMarkup = [
    {
        tagName: "circle",
        selector: "button",
        attributes: {
            r: 7,
            fill: "#001DFF",
            cursor: "pointer"
        }
    },
    {
        tagName: "path",
        selector: "icon",
        attributes: {
            d: "M -2 4 2 4 M 0 3 0 0 M -2 -1 1 -1 M -1 -4 1 -4",
            fill: "none",
            stroke: "#FFFFFF",
            "stroke-width": 2,
            "pointer-events": "none"
        }
    }
];
const defaultScale = 1;
const scaleValueSpan = document.querySelector("#scale-value");
const scaleRange = document.querySelector("#scale-range");

scaleRange.addEventListener("input", ({ target: { value } }) =>
    setScaleValue(value)
);

const rect1 = new joint.shapes.standard.Rectangle({
    size: { width: 100, height: 100 },
    position: { x: 100, y: 100 }
});
const rect2 = rect1.clone().position(500, 100);
const link = new joint.shapes.standard.Link();
link.source(rect1);
link.target(rect2);

graph.addCells([rect1, rect2, link]);

function addElementTools(element, scale) {
    const removeTool = new joint.elementTools.Remove({ scale });
    const button = new joint.elementTools.Button({
        scale,
        action: () => alert("Button pressed"),
        x: "calc(w)",
        markup: buttonMarkup
    });
    const connectTool = new joint.elementTools.Connect({
        scale,
        x: "calc(w)",
        y: "calc(h)",
        magnet: "body"
    });

    element.findView(paper).addTools(
        new joint.dia.ToolsView({
            tools: [connectTool]
        })
    );
}

function addLinkTools(link, scale) {
    const verticesTool = new joint.linkTools.Vertices({ scale });
    const targetArrowheadTool = new joint.linkTools.TargetArrowhead({ scale });
    const targetAnchorTool = new joint.linkTools.TargetAnchor({ scale });
    const removeTool = new joint.linkTools.Remove({ scale });

    link.findView(paper).addTools(
        new joint.dia.ToolsView({
            tools: [verticesTool, targetArrowheadTool, targetAnchorTool, removeTool]
        })
    );
}

function setScaleValue(value) {
    scaleValueSpan.innerText = value;
    scaleRange.value = value;

    graph.getLinks().forEach((link) => addLinkTools(link, value));
    graph.getElements().forEach((element) => addElementTools(element, value));
}

paper.on('link:connect', (linkView) => {
    if (linkView.hasTools()) return;
    addLinkTools(linkView.model, scaleRange.value);
});

setScaleValue(defaultScale);
