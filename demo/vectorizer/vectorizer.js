// Display all SVG shapes and convert them to paths.

var svg = V('svg');
svg.attr('width', 500);
svg.attr('height', 600);
document.body.appendChild(svg.node);

// Line:
var line = V('line', { x1: 25, y1: 25, x2: 75, y2: 55, stroke: 'blue', 'stroke-width': 2 });
svg.append(line);

console.log(line.convertToPathData());
var linePath = line.convertToPath();
linePath.translate(100);
svg.append(linePath);

// Circle:
var circle = V('circle', { cx: 50, cy: 100, r: 15, stroke: 'green', fill: 'none' });
svg.append(circle);

console.log(circle.convertToPathData());
var circlePath = circle.convertToPath();
circlePath.translate(100);
svg.append(circlePath);

// Ellipse:
var ellipse = V('ellipse', { cx: 50, cy: 160, rx: 25, ry: 15, stroke: 'green', fill: 'none' });
svg.append(ellipse);

console.log(ellipse.convertToPathData());
var ellipsePath = ellipse.convertToPath();
ellipsePath.translate(100);
svg.append(ellipsePath);

// Rounded rectangle:
var rect = V('rect', { x: 25, y: 205, width: 50, height: 30, rx: 10, ry: 6, stroke: 'green', fill: 'none' });
svg.append(rect);

console.log(rect.convertToPathData());
var rectPath = rect.convertToPath();
rectPath.translate(100);
svg.append(rectPath);

// Sharp rectangle:
var rectSharp = V('rect', { x: 25, y: 265, width: 50, height: 30, stroke: 'green', fill: 'none' });
svg.append(rectSharp);

console.log(rectSharp.convertToPathData());
var rectSharpPath = rectSharp.convertToPath();
rectSharpPath.translate(100);
svg.append(rectSharpPath);

// Polygon:
var polygon = V('polygon', { points: '25,335 30,345 50,325 75,355', stroke: 'green', fill: 'none' });
svg.append(polygon);

console.log(polygon.convertToPathData());
var polygonPath = polygon.convertToPath();
polygonPath.translate(100);
svg.append(polygonPath);

// Polyline:
var polyline = V('polyline', { points: '25,395 30,405 50,385 75,415', stroke: 'green', fill: 'none' });
svg.append(polyline);

console.log(polyline.convertToPathData());
var polylinePath = polyline.convertToPath();
polylinePath.translate(100);
svg.append(polylinePath);

var i;
var n;
var t;
var getColor = joint.util.interpolate.hexColor('#FF0000', '#008000');

// Path:
var gPath = new g.Path();
gPath.appendSegment(g.Path.createSegment('M', 25, 445));
gPath.appendSegment(g.Path.createSegment('C', 25, 475, 75, 475, 75, 445));

n = 17;
for (i = 0; i < n; i++) {

    t = i / (n - 1);
    var gPathPoint = gPath.pointAt(t);
    var pathPoint = V('circle', { cx: gPathPoint.x, cy: gPathPoint.y, r: 1, fill: getColor(t) });
    svg.append(pathPoint);
}

var path = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
console.log(path.convertToPathData());
path.translate(100);
svg.append(path);

// Curve:
var gCurve = new g.Curve('25 505', '37.5 490', '62.5 520', '75 505');

var curvePoints = gCurve.toPoints({ precision: 2 });
n = curvePoints.length;
for (i = 0; i < n; i++) {

    t = i / (n - 1);
    var gCurvePoint = curvePoints[i];
    var curvePoint = V('circle', { cx: gCurvePoint.x, cy: gCurvePoint.y, r: 1, fill: getColor(t) });
    svg.append(curvePoint);
}

var gCurvePath = new g.Path(gCurve);
var curvePath = V('path', { d: gCurvePath.serialize(), stroke: 'green', fill: 'none' });
console.log(curvePath.convertToPathData());
curvePath.translate(100);
svg.append(curvePath);

// Text
var text = V('text', { x: 250, y: 30, fill: 'black' });

text.text('This is a rich text.\nThis text goes to multiple lines.', { lineHeight: 'auto', annotations: [
    { start: 5, end: 10, attrs: { fill: 'red', 'font-size': 30, rotate: '20' } },
    { start: 7, end: 15, attrs: { fill: 'blue' } },
    { start: 20, end: 30, attrs: { fill: 'blue', 'class': 'text-link', style: 'text-decoration: underline' } }
], includeAnnotationIndices: true });

svg.append(text);
