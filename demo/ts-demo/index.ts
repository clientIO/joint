import * as joint from "../../build/joint";
import {V, g} from "../../build/joint";
import * as $ from "jquery";

const body = $('body');
const svg = joint.V('svg');
const rect = V('rect').attr({fill: 'red', width: 80, height: 50});
const ellipse = V('ellipse').attr({fill: 'green', rx: 100, ry: 50, cx: 200, cy: 80, x: 20, y: 30 });

svg.append(rect);
svg.append(ellipse.node);

body.append($('<h3/>').text('Example SVG created by Vectorizer'));
body.append(svg.node);

const graph = new joint.dia.Graph;
const paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph,
    markAvailable: true,
    linkConnectionPoint: joint.util.shapePerimeterConnectionPoint
});

const a = new joint.shapes.basic.Rect({
    position: {x: 50, y: 50},
    size: {width: 100, height: 40},
    attrs: {text: {text: 'basic.Rect'}}
});
graph.addCell(a);


