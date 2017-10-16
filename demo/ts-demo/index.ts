import * as joint from "../../build/joint";
import './custom';
import {V, g} from "../../build/joint";
import * as $ from "jquery";

const $body = $('body');
const svg = joint.V('svg');
const svgRect = V('rect').attr({fill: 'red', width: 80, height: 50});
const svgEllipse = V('ellipse').attr({fill: 'green', rx: 100, ry: 50, cx: 200, cy: 80, x: 20, y: 30});

svg.append(svgRect);
svg.append(svgEllipse.node);

$body.append($('<h3/>').text('Example SVG created by Vectorizer'));
$body.append(svg.node);

const graph = new joint.dia.Graph;
const paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph,
    markAvailable: true,
    defaultLink: new joint.shapes.app.Link()
});

let rect = new joint.shapes.basic.Rect()
    .position(10, 10)
    .size(100, 100)
    .addTo(graph)


// declare a new shape using the `define`
var Circle = joint.shapes.basic.Circle.define('CustomCircle', {
    attrs: {
        circle: {fill: 'purple'}
    }
});

let circle = new Circle()
    .position(150, 50)
    .size(50, 50)
    .addTo(graph);

// create the CustomRect - it's defined in the custom.ts
let customRect = new joint.shapes.app.CustomRect()
    .position(50, 50)
    .size(100, 100)
    .addTo(graph);


customRect.test();
joint.shapes.app.CustomRect.staticTest()


