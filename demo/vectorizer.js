var svg = V('svg');
svg.attr('width', 600);
svg.attr('height', 800);
document.body.appendChild(svg.node);

// Display all the SVG shapes and convert them to paths.

var line = V('line', { x1: 20, y1: 20, x2: 80, y2: 40, stroke: 'blue', 'stroke-width': 2 });
svg.append(line);
console.log(line.convertToPathData());
var linePath = line.convertToPath();
linePath.translate(100);
svg.append(linePath);

var circle = V('circle', { cx: 50, cy: 120, r: 20, stroke: 'green', fill: 'none' });
svg.append(circle);
console.log(circle.convertToPathData());
var circlePath = circle.convertToPath();
circlePath.translate(100);
svg.append(circlePath);

var ellipse = V('ellipse', { cx: 50, cy: 200, rx: 30, ry: 15, stroke: 'green', fill: 'none' });
svg.append(ellipse);
console.log(ellipse.convertToPathData());
var ellipsePath = ellipse.convertToPath();
ellipsePath.translate(100);
svg.append(ellipsePath);

var rect = V('rect', { x: 25, y: 260, width: 50, height: 30, rx: 10, ry: 5, stroke: 'green', fill: 'none' });
svg.append(rect);
console.log(rect.convertToPathData());
var rectPath = rect.convertToPath();
rectPath.translate(100);
svg.append(rectPath);

var rectSharp = V('rect', { x: 25, y: 320, width: 50, height: 30, stroke: 'green', fill: 'none' });
svg.append(rectSharp);
console.log(rectSharp.convertToPathData());
var rectSharpPath = rectSharp.convertToPath();
rectSharpPath.translate(100);
svg.append(rectSharpPath);

var polygon = V('polygon', { points: '25,390 30,400 50,380 80,410', stroke: 'green', fill: 'none' });
svg.append(polygon);
console.log(polygon.convertToPathData());
var polygonPath = polygon.convertToPath();
polygonPath.translate(100);
svg.append(polygonPath);

var polyline = V('polyline', { points: '25,440 30,450 50,430 80,460', stroke: 'green', fill: 'none' });
svg.append(polyline);
console.log(polyline.convertToPathData());
var polylinePath = polyline.convertToPath();
polylinePath.translate(100);
svg.append(polylinePath);

var text = V('text', { x: 250, y: 150, fill: 'black' });

text.text('This is a rich text.\nThis text goes to multiple lines.', { lineHeight: 'auto', annotations: [
    { start: 5, end: 10, attrs: { fill: 'red', 'font-size': 30, rotate: '20' } },
    { start: 7, end: 15, attrs: { fill: 'blue' } },
    { start: 20, end: 30, attrs: { fill: 'blue', 'class': 'text-link', style: 'text-decoration: underline' } }
], includeAnnotationIndices: true });

svg.append(text);
