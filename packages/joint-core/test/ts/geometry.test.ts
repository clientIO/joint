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

// Polyline, Polygon: the closest point methods accept a point given as an object or a string
const polyline = new g.Polyline(['0 0', '10 10', '20 0']);
const polygon = new g.Polygon(['0 0', '10 10', '20 0']);
const closestPoints: Array<g.Point | null> = [
    polyline.closestPoint(new g.Point(3, 4)),
    polyline.closestPoint({ x: 3, y: 4 }),
    polyline.closestPoint('3 4'),
    polygon.closestPoint('3 4')
];
const closestPointLengths: number[] = [
    polyline.closestPointLength('3 4'),
    polyline.closestPointNormalizedLength('3 4'),
    polygon.closestPointLength('3 4')
];
const closestPointTangent: g.Line | null = polyline.closestPointTangent('3 4');
