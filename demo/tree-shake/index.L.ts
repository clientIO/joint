import * as joint from '../../';

console.log('Point', new joint.g.Point());
console.log('PolyLine', new joint.g.Polyline('10,10 20,20 30,30').bbox());
console.log('Path', new joint.g.Path('M 0 -5 L -10 0 L 0 5 Z').bbox());
console.log(new joint.dia.Graph());
