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
