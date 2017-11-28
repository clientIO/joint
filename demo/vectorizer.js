var svg = V('svg');
svg.attr('width', 600);
svg.attr('height', 800);
document.body.appendChild(svg.node);

// Display all the SVG shapes and convert them to paths.

// Line:
var line = V('line', { x1: 20, y1: 20, x2: 80, y2: 40, stroke: 'blue', 'stroke-width': 2 });
svg.append(line);

console.log(line.convertToPathData());
var linePath = line.convertToPath();
linePath.translate(100);
svg.append(linePath);

// Circle:
var circle = V('circle', { cx: 50, cy: 120, r: 20, stroke: 'green', fill: 'none' });
svg.append(circle);

console.log(circle.convertToPathData());
var circlePath = circle.convertToPath();
circlePath.translate(100);
svg.append(circlePath);

// Ellipse:
var ellipse = V('ellipse', { cx: 50, cy: 200, rx: 30, ry: 15, stroke: 'green', fill: 'none' });
svg.append(ellipse);

console.log(ellipse.convertToPathData());
var ellipsePath = ellipse.convertToPath();
ellipsePath.translate(100);
svg.append(ellipsePath);

// Rounded rectangle:
var rect = V('rect', { x: 25, y: 260, width: 50, height: 30, rx: 10, ry: 5, stroke: 'green', fill: 'none' });
svg.append(rect);

console.log(rect.convertToPathData());
var rectPath = rect.convertToPath();
rectPath.translate(100);
svg.append(rectPath);

// Sharp rectangle:
var rectSharp = V('rect', { x: 25, y: 320, width: 50, height: 30, stroke: 'green', fill: 'none' });
svg.append(rectSharp);

console.log(rectSharp.convertToPathData());
var rectSharpPath = rectSharp.convertToPath();
rectSharpPath.translate(100);
svg.append(rectSharpPath);

// Polygon:
var polygon = V('polygon', { points: '25,390 30,400 50,380 75,410', stroke: 'green', fill: 'none' });
svg.append(polygon);

console.log(polygon.convertToPathData());
var polygonPath = polygon.convertToPath();
polygonPath.translate(100);
svg.append(polygonPath);

// Polyline:
var polyline = V('polyline', { points: '25,450 30,460 50,440 75,470', stroke: 'green', fill: 'none' });
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
var gPath = new g.Path('M 25 500 C 25 540 75 540 75 500');
n = 100;
for (i = 0; i < n; i++) {
    t = i / (n - 1);
    var pathPoint = gPath.pointAt(t);
    svg.append(V('circle', { cx: pathPoint.x, cy: pathPoint.y, r: 1, fill: getColor(t) }));
}

var path = V('path', { d: gPath.serialize(), stroke: 'green', fill: 'none' });
console.log(path.convertToPathData());
path.translate(100);
svg.append(path);

// Curve:
var gCurve = new g.Curve('25 590', '37.5 610', '62.5 570', '75 590');
var curvePoints = gCurve.toPoints({ precision: 4 });
n = curvePoints.length;
for (i = 0; i < n; i++) {
    t = i / (n - 1);
    var curvePoint = curvePoints[i];
    svg.append(V('circle', { cx: curvePoint.x, cy: curvePoint.y, r: 1, fill: getColor(t) }));
}

var curvePolyline = V('polyline', { points: gCurve.toPolyline({ precision: 4 }).serialize(), stroke: 'green', fill: 'none' });
console.log(curvePolyline.convertToPathData());
curvePolyline.translate(100);
svg.append(curvePolyline);

// Text
var text = V('text', { x: 250, y: 150, fill: 'black' });

text.text('This is a rich text.\nThis text goes to multiple lines.', { lineHeight: 'auto', annotations: [
    { start: 5, end: 10, attrs: { fill: 'red', 'font-size': 30, rotate: '20' } },
    { start: 7, end: 15, attrs: { fill: 'blue' } },
    { start: 20, end: 30, attrs: { fill: 'blue', 'class': 'text-link', style: 'text-decoration: underline' } }
], includeAnnotationIndices: true });

svg.append(text);
