import * as joint from "./build/joint";
import './custom';
import {V, g} from "./build/joint";
import * as $ from "jquery";

const $body = $('body');

// Paper:
$body.append($('<h3 />').text('Example Paper'));
$body.append($('<div id="paper" style="border: 1px dashed #ddd" />'));

const graph = new joint.dia.Graph;
const paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 500,
    height: 200,
    gridSize: 20,
    model: graph,
    markAvailable: true,
    defaultLink: new joint.shapes.app.Link(),
    connectionStrategy: joint.connectionStrategies.pinAbsolute
});

let rect = new joint.shapes.basic.Rect()
    .position(40, 20)
    .size(100, 100)
    .addTo(graph)


// declare a new shape using the `define`
var Circle = joint.shapes.basic.Circle.define('CustomCircle', {
    attrs: {
        circle: {
            fill: 'purple'
        }
    }
});

let circle = new Circle()
    .position(180, 60)
    .size(60, 60)
    .addTo(graph);

// create the CustomRect - it's defined in the custom.ts
let customRect = new joint.shapes.app.CustomRect()
    .position(80, 60)
    .size(100, 100)
    .addTo(graph);

customRect.test();
joint.shapes.app.CustomRect.staticTest()

let link = new joint.shapes.standard.Link()
    .source(rect, {
        anchor: {
            name: 'bottomLeft'
        },
        connectionPoint: {
            name: 'boundary',
            args: {
                offset: 5
            }
        }
    })
    .target(customRect, {
        anchor: {
            name: 'bottomLeft'
        },
        connectionPoint: {
            name: 'boundary',
            args: {
                offset: 5
            }
        }
    })
    .router('manhattan', { step: 20 })
    .connector('rounded', { radius: 20 })
    .addTo(graph);

// VECTORIZER DEMO:
// Display all SVG shapes and convert them to paths.
$body.append($('<h3 />').text('Example SVG created by Vectorizer'));

const svg = joint.V('svg');
svg.attr('width', 500);
svg.attr('height', 550);
svg.attr('style', 'border: 1px dashed #ddd');

$body.append(svg.node);

// Line:
let vLine = V('line', { x1: 25, y1: 25, x2: 75, y2: 55, stroke: 'blue', 'stroke-width': 2 });
svg.append(vLine);

let linePath = vLine.convertToPath();
linePath.translate(100);
svg.append(linePath);

// Circle:
let vCircle = V('circle', { cx: 50, cy: 100, r: 15, stroke: 'green', fill: 'none' });
svg.append(vCircle);

let circlePath = vCircle.convertToPath();
circlePath.translate(100);
svg.append(circlePath);

// Ellipse:
let vEllipse = V('ellipse', { cx: 50, cy: 160, rx: 25, ry: 15, stroke: 'green', fill: 'none' });
svg.append(vEllipse);

let ellipsePath = vEllipse.convertToPath();
ellipsePath.translate(100);
svg.append(ellipsePath);

// Rounded rectangle:
let vRect = V('rect', { x: 25, y: 205, width: 50, height: 30, rx: 10, ry: 6, stroke: 'green', fill: 'none' });
svg.append(vRect);

let rectPath = vRect.convertToPath();
rectPath.translate(100);
svg.append(rectPath);

// Sharp rectangle:
let vRectSharp = V('rect', { x: 25, y: 265, width: 50, height: 30, stroke: 'green', fill: 'none' });
svg.append(vRectSharp);

let rectSharpPath = vRectSharp.convertToPath();
rectSharpPath.translate(100);
svg.append(rectSharpPath);

// Polygon:
let vPolygon = V('polygon', { points: '25,335 30,345 50,325 75,355', stroke: 'green', fill: 'none' });
svg.append(vPolygon);

let polygonPath = vPolygon.convertToPath();
polygonPath.translate(100);
svg.append(polygonPath);

// Polyline:
let vPolyline = V('polyline', { points: '25,395 30,405 50,385 75,415', stroke: 'green', fill: 'none' });
svg.append(vPolyline);

let polylinePath = vPolyline.convertToPath();
polylinePath.translate(100);
svg.append(polylinePath);

let i;
let n;
let t;
let getColor = joint.util.interpolate.hexColor('#FF0000', '#008000');

// Path:
let gPath = new g.Path();
gPath.appendSegment(g.Path.createSegment('M', 25, 445));
gPath.appendSegment(g.Path.createSegment('C', 25, 475, 75, 475, 75, 445));

n = 17;
for (i = 0; i < n; i++) {

    t = i / (n - 1);
    let gPathPoint = gPath.pointAt(t);
    let pathPoint = V('circle', { cx: gPathPoint.x, cy: gPathPoint.y, r: 1, fill: getColor(t) });
    svg.append(pathPoint);
}

let vPath = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
vPath.translate(100);
svg.append(vPath);

// Curve:
let gCurve = new g.Curve('25 505', '37.5 490', '62.5 520', '75 505');

let curvePoints = gCurve.toPoints({ precision: 2 });
n = curvePoints.length;
for (i = 0; i < n; i++) {

    t = i / (n - 1);
    let gCurvePoint = curvePoints[i];
    let curvePoint = V('circle', { cx: gCurvePoint.x, cy: gCurvePoint.y, r: 1, fill: getColor(t) });
    svg.append(curvePoint);
}

let gCurvePath = new g.Path(gCurve);
let curvePath = V('path', { d: gCurvePath.serialize(), stroke: 'green', fill: 'none' });
curvePath.translate(100);
svg.append(curvePath);

// Text
let vText = V('text', { x: 250, y: 30, fill: 'black' });

vText.text('This is a rich text.\nThis text goes to multiple lines.', { lineHeight: 'auto', annotations: [
    { start: 5, end: 10, attrs: { fill: 'red', 'font-size': 30, rotate: '20' } },
    { start: 7, end: 15, attrs: { fill: 'blue' } },
    { start: 20, end: 30, attrs: { fill: 'blue', 'class': 'text-link', style: 'text-decoration: underline' } }
], includeAnnotationIndices: true });

svg.append(vText);
