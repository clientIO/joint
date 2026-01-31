import { dia, shapes } from '@joint/core';
import './styles.scss';

// Paper

const paperContainer = document.getElementById("paper-container");

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: "100%",
    height: "100%",
    gridSize: 1,
    drawGrid: { name: "mesh" },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: "#F3F7F6" }
});

paperContainer.appendChild(paper.el);

const Tool = {
    Pointer: 0,
    Line: 1,
    Rectangle: 2,
    Ellipse: 3,
    FreeDraw: 4
};

let tool = Tool.Pointer;

function dragStart(evt, x, y) {
    const data = (evt.data = {
        tool,
        ox: x,
        oy: y
    });
    switch (tool) {
        case Tool.Line: {
            evt.data.x1 = x;
            evt.data.y1 = y;
            evt.data.x2 = x;
            evt.data.y2 = y;
            data.vel = V("line", { x1: x, y1: y, x2: x, y2: y });
            break;
        }
        case Tool.Rectangle: {
            data.vel = V("rect", {
                x: x,
                y: y,
                width: 1,
                height: 1
            });
            break;
        }
        case Tool.Ellipse: {
            data.vel = V("ellipse", {
                cx: x,
                cy: y,
                rx: 1,
                ry: 1
            });
            break;
        }
        case Tool.FreeDraw: {
            data.vel = V("polyline");
            evt.data.points = [[x, y]];
            break;
        }
        default:
        case Tool.Pointer: {
            return;
        }
    }
    data.vel.appendTo(paper.viewport);
    data.vel.addClass("preview-shape");
}

function drag(evt, x, y) {
    const { ox, oy, vel, tool } = evt.data;
    if (!tool) return;
    const bbox = new g.Rect(ox, oy, x - ox, y - oy);
    if (bbox.width === 0) bbox.width = 1;
    if (bbox.height === 0) bbox.height = 1;
    bbox.normalize();
    evt.data.bbox = bbox;
    switch (tool) {
        case Tool.Line: {
            evt.data.x2 = x;
            evt.data.y2 = y;
            vel.attr({ x2: x, y2: y });
            break;
        }
        case Tool.Rectangle: {
            vel.attr(bbox.toJSON());
            break;
        }
        case Tool.Ellipse: {
            vel.attr({
                rx: bbox.width / 2,
                ry: bbox.height / 2,
                cx: bbox.x + bbox.width / 2,
                cy: bbox.y + bbox.height / 2
            });
            break;
        }
        case Tool.FreeDraw: {
            const { points } = evt.data;
            points.push([x, y]);
            vel.attr("points", points.join(" "));
            break;
        }
    }
}

function dragEnd(evt) {
    const { vel, bbox, tool } = evt.data;
    if (!tool) return;
    vel.remove();
    if (!bbox) return;
    const { x, y, width, height } = bbox;
    switch (tool) {
        case Tool.Line: {
            const { x1, x2, y1, y2 } = evt.data;
            const line = new g.Line({ x: x1, y: y1 }, { x: x2, y: y2 });
            const angle = line.angle();
            const { start } = line.clone().rotate(line.midpoint(), angle);
            graph.addCell({
                type: "standard.Path",
                angle,
                position: {
                    x: start.x,
                    y: start.y
                },
                size: {
                    width: line.length(),
                    height: 1
                },
                attrs: {
                    body: {
                        d: "M 0 calc(0.5 * h) H calc(w)"
                    }
                }
            });
            break;
        }
        case Tool.Rectangle: {
            graph.addCell({
                type: "standard.Rectangle",
                position: {
                    x,
                    y
                },
                size: {
                    width,
                    height
                }
            });
            break;
        }
        case Tool.Ellipse: {
            graph.addCell({
                type: "standard.Ellipse",
                position: {
                    x,
                    y
                },
                size: {
                    width,
                    height
                }
            });
            break;
        }
        case Tool.FreeDraw: {
            const { points } = evt.data;
            const geometry = new g.Polyline(points.join(" "));
            geometry.simplify({ threshold: 0.8 });
            const geometryBBox = geometry.bbox();
            graph.addCell({
                type: "standard.Polyline",
                position: {
                    x: geometryBBox.x,
                    y: geometryBBox.y
                },
                size: {
                    width: geometryBBox.width,
                    height: geometryBBox.height
                },
                attrs: {
                    body: {
                        refPoints: geometry.serialize()
                    }
                }
            });
            break;
        }
    }
}

paper.on("blank:pointerdown", (evt, x, y) => dragStart(evt, x, y));
paper.on("element:pointerdown", (_, evt, x, y) => dragStart(evt, x, y));

paper.on("blank:pointermove", (evt, x, y) => drag(evt, x, y));
paper.on("element:pointermove", (_, evt, x, y) => drag(evt, x, y));

paper.on("blank:pointerup", (evt) => dragEnd(evt));
paper.on("element:pointerup", (_, evt) => dragEnd(evt));

setTool(document.querySelector("[checked]")?.id ?? "Pointer");

document
    .getElementById("tools")
    .addEventListener("change", (evt) => setTool(evt.target.id));

function setTool(toolId) {
    tool = Tool[toolId];
    paper.setInteractivity(tool === Tool.Pointer);
    paper.el.classList.toggle("paper-active-tools", tool !== Tool.Pointer);
}
