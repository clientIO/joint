import { dia, shapes } from '@joint/core';
import './styles.css';

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
    background: { color: "#F3F7F6" }
});

paperContainer.appendChild(paper.el);

const ResizeTool = elementTools.Control.extend({
    getPosition: function (view) {
        const model = view.model;
        const { width, height } = model.size();
        return { x: width, y: height };
    },
    setPosition: function (view, coordinates) {
        const model = view.model;
        model.resize(Math.max(coordinates.x, 1), Math.max(coordinates.y, 1));
    }
});

const rect1 = new shapes.standard.Rectangle({
    size: { width: 100, height: 100 },
    position: { x: 100, y: 100 },
    attrs: {
        label: {
            fontFamily: "sans-serif",
            textWrap: {
                text: "         Not    preserving    spaces         "
            }
        }
    }
});

const rect2 = new shapes.standard.Rectangle({
    size: { width: 100, height: 100 },
    position: { x: 300, y: 100 },
    attrs: {
        label: {
            fontFamily: "sans-serif",
            textWrap: {
                text: "         Preserving    spaces         ",
                preserveSpaces: true
            }
        }
    }
});

graph.addCells([rect1, rect2]);

[rect1, rect2].forEach((element) => {
    element.findView(paper).addTools(
        new dia.ToolsView({
            tools: [
                new ResizeTool({
                    selector: "body",
                    handleAttributes: {
                        fill: "#4666E5"
                    }
                })
            ]
        })
    );
});
