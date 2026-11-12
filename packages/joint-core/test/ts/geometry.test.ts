import { g, util, V } from '../../';

const getColor = util.interpolate.hexColor('#FF0000', '#008000');
const color: string = getColor(0.5);

// Path
const path = new g.Path();
path.appendSegment(g.Path.createSegment('M', 25, 445));
path.appendSegment(g.Path.createSegment('C', 25, 475, 75, 475, 75, 445));
const pathPoint = path.pointAt(0.5);
V('circle', { cx: pathPoint?.x, cy: pathPoint?.y, r: 1, fill: color });
V('path', { d: path.serialize() });

// Curve
const curve = new g.Curve('25 505', '37.5 490', '62.5 520', '75 505');
const curvePoints: g.Point[] = curve.toPoints({ precision: 2 });
const curvePath = new g.Path(curve);
V('path', { d: curvePath.serialize() });

// transform(matrix)
const matrix: g.PlainMatrix = { a: 0, b: 1, c: -1, d: 0, e: 100, f: 50 };
const transformedPoint: g.Point = new g.Point(10, 20).transform(matrix);
const transformedLine: g.Line = new g.Line().transform(matrix);
const transformedCurve: g.Curve = new g.Curve('0 0', '10 0', '10 10', '0 10').transform(matrix);
const transformedPolyline: g.Polyline = new g.Polyline(['0 0', '10 0']).transform(matrix);
const transformedPolygon: g.Polygon = new g.Polygon(['0 0', '10 0', '10 10']).transform(matrix);
const transformedPath: g.Path = new g.Path('M 0 0 L 10 0').transform(matrix);
const transformedSegment: g.Segment = new g.Path('M 0 0 L 10 0').getSegment(1).transform(matrix);
const rectBBoxes: g.Rect[] = [
    new g.Rect(0, 0, 10, 20).bbox(),
    new g.Rect(0, 0, 10, 20).bbox(45),
    new g.Rect(0, 0, 10, 20).bbox(matrix),
    new g.Ellipse(new g.Point(0, 0), 10, 5).bbox(),
    new g.Ellipse(new g.Point(0, 0), 10, 5).bbox(45),
    new g.Ellipse(new g.Point(0, 0), 10, 5).bbox(matrix)
];
// the fields of the matrix are optional
new g.Point(10, 20).transform({ e: 10, f: 20 });
new g.Rect(0, 0, 10, 20).bbox({ a: 2, d: 3 });
V.transformPoint({ x: 10, y: 20 }, { e: 10 });
// a matrix of the DOM is a matrix too
declare const svgMatrix: SVGMatrix;
new g.Point(10, 20).transform(svgMatrix);
V.transformPoint({ x: 10, y: 20 }, matrix);
V.transformRect({ x: 0, y: 0, width: 10, height: 20 }, svgMatrix);
