const { dia, shapes, elementTools } = joint;

const paperContainer = document.getElementById("paper-container");

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    frozen: true,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: "#ffffff" },
    linkPinning: false,
    clickThreshold: 10,
    defaultLink: () => new shapes.standard.Link(),
    el: document.getElementById("paper"),
    highlighting: {
        connecting: {
            name: "mask",
            options: {
                attrs: {
                    stroke: "#80aaff",
                    "stroke-width": 4,
                    "stroke-linecap": "butt",
                    "stroke-linejoin": "miter"
                }
            }
        }
    },
    validateConnection: (sv, _, tv) => {
        const s = sv.model;
        const t = tv.model;
        return s.isElement() && t.isElement() && s !== t;
    },
    defaultConnectionPoint: {
        name: "boundary"
    }
});

paperContainer.appendChild(paper.el);

const Hex = Honeycomb.extendHex({
    size: 50,
    orientation: "flat"
});

const Grid = Honeycomb.defineGrid(Hex);

const size = 9;
const grid = Grid.rectangle({ width: size, height: size });

const hex = Hex();

// get the corners of a hex (they're the same for all hexes created with the same Hex factory)
const corners = Hex().corners();
const points = corners.map(({ x, y }) => `${x},${y}`).join(" ");

// an SVG symbol can be reused

const { node: gridEl } = V("g").addClass("hexagon-grid");

grid.forEach((hex) => {
    const { x, y } = hex.toPoint();
    const { node: polygonEl } = V("polygon")
        .addClass("hexagon")
        .attr("points", points)
        .attr("transform", `translate(${x}, ${y})`);
    gridEl.append(polygonEl);
});

paper.getLayerNode(joint.dia.Paper.Layers.BACK).prepend(gridEl);

paper.setDimensions(grid.pointWidth(), grid.pointHeight());

paper.options.restrictTranslate = function (elementView, px, py) {
    const { x: x0, y: y0 } = elementView.model.position();
    const dx = x0 - px;
    const dy = y0 - py;
    return (x, y) => {
        const hex = Grid.pointToHex(x - dx, y - dy);
        return Hex(
            Math.max(0, Math.min(grid.width - 1, hex.x)),
            Math.max(0, Math.min(grid.height - 1, hex.y))
        ).toPoint();
    };
};

const hexagon = new shapes.standard.Polygon({
    position: Hex(5, 3).toPoint(),
    size: { width: hex.width(), height: hex.height() },
    attrs: {
        root: {
            highlighterSelector: "body",
            magnetSelector: "root"
        },
        body: {
            refPoints: points
        }
    }
});

const createHexagon = (u, v) => {
    const { x, y } = Hex(u, v).toPoint();
    return hexagon.clone().position(x, y);
};

const createLink = (s, t) => {
    return new shapes.standard.Link({
        source: { id: s.id },
        target: { id: t.id }
    });
};

const hexagon1 = createHexagon(4, 3);
const hexagon2 = createHexagon(3, 5);
const hexagon3 = createHexagon(5, 5);
const link1 = createLink(hexagon1, hexagon2);
const link2 = createLink(hexagon1, hexagon3);

graph.on("add", (cell) => {
    if (cell.isLink()) return;
    const tools = new dia.ToolsView({
        tools: [
            new elementTools.Connect({
                useModelGeometry: true,
                x: "50%",
                y: "100%",
                offset: { x: -10 }
            }),
            new elementTools.Button({
                useModelGeometry: true,
                x: "50%",
                y: "100%",
                offset: { x: 10 },
                action: function (evt, elementView) {
                    const sourceHexagon = elementView.model;
                    const { x, y } = sourceHexagon.getBBox().center();
                    const hex = Grid.pointToHex(x, y);
                    hex.y += 2;
                    if (!grid.includes(hex)) return;
                    const targetHexagon = createHexagon(hex.x, hex.y);
                    graph.addCells([
                        targetHexagon,
                        createLink(sourceHexagon, targetHexagon)
                    ]);
                },
                markup: [
                    {
                        tagName: "circle",
                        selector: "button",
                        attributes: {
                            r: 7,
                            fill: "#333333",
                            cursor: "pointer"
                        }
                    },
                    {
                        tagName: "path",
                        selector: "icon",
                        attributes: {
                            d: "M -4 0 4 0 M 0 -4 0 4",
                            fill: "none",
                            stroke: "#FFFFFF",
                            "stroke-width": 2,
                            "pointer-events": "none"
                        }
                    }
                ]
            })
        ]
    });
    cell.findView(paper).addTools(tools);
});

graph.addCells([hexagon1, hexagon2, hexagon3, link1, link2]);

paper.unfreeze();

paper.on("blank:pointerclick", (evt, x, y) => {
    const hex = Grid.pointToHex(x, y);
    const hexagon = createHexagon(hex.x, hex.y);
    graph.addCell(hexagon);
});

paper.on({
    "cell:pointerdown": () => gridEl.classList.add("disabled"),
    "cell:pointerup": () => gridEl.classList.remove("disabled")
});
