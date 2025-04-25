import { dia, shapes, util, g, linkTools } from "@joint/core";
import { Bezier } from "bezier-js";

import "../css/bezier.css";

class BezierLinkView extends dia.LinkView {
    updateDOMSubtreeAttributes() {
        const method = this.model.get("outline") ? outlinePath : offsetPath;

        const thickness1 = 20;
        const thickness2 = 30;
        const thickness3 = 10;
        const fillOpacity = 0.3;
        const roundDecimals = 0;
        const strokeWidth = 2;
        const useFill = method !== offsetPath;

        const { line1, line2, line3 } = this.selectors;

        const path1 = this.getConnection();
        path1.round(roundDecimals);
        line1.setAttribute("stroke", "red");
        line1.setAttribute("stroke-width", strokeWidth);
        line1.setAttribute("fill", useFill ? "red" : "none");
        line1.setAttribute("fill-opacity", fillOpacity);
        line1.setAttribute("fill-rule", "nonzero");
        line1.setAttribute("d", method(path1, thickness1));

        const path2 = new g.Path(offsetPath(path1, thickness1 + thickness2));
        path2.round(roundDecimals);
        line2.setAttribute("stroke", "blue");
        line2.setAttribute("stroke-width", strokeWidth);
        line2.setAttribute("fill", useFill ? "blue" : "none");
        line2.setAttribute("fill-opacity", fillOpacity);
        line2.setAttribute("fill-rule", "nonzero");
        line2.setAttribute("d", method(path2, thickness2));

        const path3 = new g.Path(offsetPath(path1, -(thickness1 + thickness3)));
        path3.round(roundDecimals);
        line3.setAttribute("stroke", "green");
        line3.setAttribute("stroke-width", strokeWidth);
        line3.setAttribute("fill", useFill ? "green" : "none");
        line3.setAttribute("fill-opacity", fillOpacity);
        line3.setAttribute("fill-rule", "nonzero");
        line3.setAttribute("d", method(path3, thickness3));
    }
}

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    width: "100%",
    height: "100%",
    model: graph,
    overflow: true,
    cellViewNamespace: shapes,
    linkView: BezierLinkView,
});

document.getElementById("paper-container").appendChild(paper.el);

const link1 = new dia.Link({
    type: "bezier",
    source: { x: 40, y: 100 },
    target: { x: 740, y: 100 },
    vertices: [{ x: 401, y: 208 }],
    // vertices: [{ x: 422, y: 417 }], // rounding issues
    // vertices: [{ x: 204, y: 63 }], // can not create offset
    connector: { name: "smooth" },
    markup: util.svg`
        <path @selector="line1" />
        <path @selector="line2" />
        <path @selector="line3" />
    `,
});

const link2 = link1.clone().translate(0, 300).set("outline", true);
graph.resetCells([link1, link2]);

function offsetPath(path, offset) {
    const offsetBezierCurves = pathToBezierCurves(path)
        .map((bezier) => {
            const polyBezier = bezier.offset(offset);
            return polyBezier.map((b) => {
                if (isNaN(b.points[0].x)) {
                    console.warn("Unable to create offset", bezier);
                    return bezier;
                }
                return b;
            });
        })
        .flat();
    let d = "";
    for (let i = 0; i < offsetBezierCurves.length; i++) {
        d += offsetBezierCurves[i].toSVG();
    }
    return d;
}

function outlinePath(path, o) {
    const outlines = pathToBezierCurves(path).map((curve1) => {
        let curves;
        try {
            curves = curve1.outline(o).curves;
        } catch (e) {
            console.warn("Caught exception in bezier-js", curve1);
            return curve1;
        }
        return curves.map((curve2) => {
            if (isNaN(curve2.points[0].x)) {
                console.warn("Unable to create outline", curve1);
                return curve1;
            }
            return curve2;
        });
    });
    let d = "M 0 0";
    for (let i = 0; i < outlines.length; i++) {
        const outline = outlines[i];
        for (let j = 0; j < outline.length; j++) {
            let segmentPath = outline[j].toSVG();
            if (j > 0) {
                // Remove the first moveTo command
                let index = segmentPath.search(/[CQ]/);
                if (index > 0) {
                    segmentPath = segmentPath.slice(index);
                }
            }
            d += segmentPath;
        }
    }
    d += "Z";
    return d;
}

function pathToBezierCurves(path) {
    const segments = path.segments;
    const bezierCurves = [];
    for (let i = 0; i < segments.length; i++) {
        const curve = segments[i];
        // Note: JointJS path use only absolute commands
        // it's safe to ignore all
        if (curve.type === "M") continue;
        const {
            start,
            end,
            controlPoint1 = start,
            controlPoint2 = end,
        } = curve;
        const bezier = new Bezier(
            start.x,
            start.y,
            controlPoint1.x,
            controlPoint1.y,
            controlPoint2.x,
            controlPoint2.y,
            end.x,
            end.y
        );
        bezierCurves.push(bezier);
    }
    return bezierCurves;
}

// Interactions

graph.getLinks().forEach((link) => {
    const tools = [
        new linkTools.Vertices({
            vertexAdding: true,
            redundancyRemoval: false,
        }),
        new linkTools.SourceArrowhead(),
        new linkTools.TargetArrowhead(),
    ];

    link.findView(paper).addTools(
        new dia.ToolsView({
            tools: tools,
        })
    );
});

// Failing examples from bezier-js

// const b1 = new Bezier(40, 100, 159, 323, 277, 545, 394, 545);
// console.log(b1.outline(50));
// console.log(b1.outlineshapes(50));

// const b2 = new Bezier(100, 100, 100, 100, 200, 200, 200, 200);
// console.log(b2.outline(50).curves);
