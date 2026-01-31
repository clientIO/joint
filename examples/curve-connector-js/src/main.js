const { dia, shapes, connectors } = joint;

const paperWidth = 780;
const paperHeight = 490;
const gap = 10;

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    el: document.getElementById("paper"),
    model: graph,
    cellViewNamespace: shapes,
    width: paperWidth,
    height: paperHeight,
    gridSize: 1,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: "#F3F7F6" },
    defaultConnectionPoint: { name: "anchor" },
    defaultConnector: {
        name: "curve",
        args: {
            sourceTangent: { x: 0, y: 100 },
            targetTangent: { x: 0, y: -120 }
        }
    }
});

paper.svg.style.overflow = "visible";
paper.el.style.border = "1px solid #E5E5E5";

const commonBodyAttrs = {
    body: {
        rx: 5,
        ry: 5
    }
};

const r0width = 100;
const childCount = 13;

const r0 = new shapes.standard.Rectangle({
    size: { width: r0width, height: 50 },
    position: { x: (paperWidth - r0width) / 2, y: gap },
    attrs: {
        ...commonBodyAttrs,
        label: {
            text: "Curves",
            fontFamily: "sans-serif",
            fontSize: 20
        }
    }
});

graph.addCells([r0]);

Array.from({ length: childCount }).forEach((_, index) => {
    const size = 50;
    const rN = new shapes.standard.Rectangle({
        size: { width: size, height: size },
        position: { x: 5 + index * (gap + size), y: paperHeight - gap - size },
        attrs: {
            ...commonBodyAttrs,
            label: {
                text: String.fromCharCode(65 + index),
                fontFamily: "sans-serif",
                fontSize: 20
            }
        }
    });

    const lN = new shapes.standard.Link({
        source: {
            id: r0.id,
            anchor: {
                name: "bottom",
                args: {
                    dx: ((index + 0.5) / childCount) * r0width - r0width / 2
                }
            }
        },
        target: {
            id: rN.id,
            anchor: { name: "top" }
        }
    });

    graph.addCell([rN, lN]);
});
