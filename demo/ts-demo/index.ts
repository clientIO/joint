import * as joint from './vendor/joint';
import './custom';
import {V, g} from './vendor/joint';
import * as $ from 'jquery';
import { MyShape } from './shape';
import * as dagre from 'dagre';
import * as graphlib from 'graphlib';

const $body = $('body');

// Paper:
$body.append($('<h3 />').text('Example Paper'));
let $paper = $('<div id="paper" style="border: 1px dashed #ddd" />');
$body.append($paper);

// Define cellNamespace so graph.fromJSON() can find the custom shape constructor
const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

const paper = new joint.dia.Paper({
    el: $paper,
    width: 500,
    height: 200,
    gridSize: 20,
    model: graph,
    markAvailable: true,
    frozen: true,
    async: true,
    defaultLink: new joint.shapes.app.Link(),
    connectionStrategy: joint.connectionStrategies.pinAbsolute,
    sorting: joint.dia.Paper.sorting.APPROX,
    cellViewNamespace: joint.shapes
});


let rect = new joint.shapes.standard.Rectangle()
    .position(40, 20)
    .size(100, 100)
    .addTo(graph);

// declare a new shape using the `define`
const Circle = joint.shapes.standard.Circle.define('CustomCircle', {
    attrs: {
        body: {
            fill: 'purple'
        }
    }
});

let circle = new Circle()
    .position(180, 60)
    .size(60, 60);

circle.addTo(graph);

// create the CustomRect - it's defined in the custom.ts
let customRect = new joint.shapes.app.CustomRect()
    .position(80, 60)
    .size(100, 100)
    .addTo(graph);

customRect.test();
joint.shapes.app.CustomRect.staticTest();

const myShape1 = new MyShape({ attrs: { label: { text: 'My Shape' }}});
myShape1.position(300, 50);
myShape1.addTo(graph);
myShape1.test();
MyShape.staticTest(2);

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
    .connector('rounded', { radius: 20 });

link.addTo(graph);

paper.unfreeze();

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

vText.text('This is a rich text.\nThis text goes to multiple lines.', {
    lineHeight: 'auto', annotations: [
        { start: 5, end: 10, attrs: { fill: 'red', 'font-size': 30, rotate: '20' } },
        { start: 7, end: 15, attrs: { fill: 'blue' } },
        { start: 20, end: 30, attrs: { fill: 'blue', 'class': 'text-link', style: 'text-decoration: underline' } }
    ], includeAnnotationIndices: true
});

svg.append(vText);

(<any>window).joint = joint;


// Highlighters
const h1 = joint.dia.HighlighterView.add(circle.findView(paper), 'body', 'my-id1');
h1.remove();

const { mask } = joint.highlighters;
const m1 = mask.add(
    circle.findView(paper),
    { selector: 'body' },
    'my-id2',
    <joint.highlighters.MaskHighlighterArguments>{
        layer: joint.dia.Paper.Layers.FRONT,
        maskClip: 10,
        padding: 5
    }
);

const m2 = mask.get(circle.findView(paper), 'my-id2');
console.log(m2.getMaskId() === 'my-id2');
console.log(m1 === m2);

mask.add(circle.findView(paper), 'root', 'my-id3');
joint.highlighters.mask.remove(circle.findView(paper), 'my-id3');

const gl: graphlib.Graph = graph.toGraphLib({ graphlib });
console.log('Is graph acyclic?', graphlib.alg.isAcyclic(gl));

joint.layout.DirectedGraph.layout(graph.getSubgraph([rect, customRect]), {
    dagre,
    graphlib,
    marginX: 20,
    marginY: 20,
    rankSep: 5
});
