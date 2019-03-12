import {V} from '../../../src/vectorizer.js';

const svg = V('svg');
svg.attr('width', 500);
svg.attr('height', 550);
svg.attr('style', 'border: 1px dashed #ddd');

document.body.appendChild(svg.node);

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
