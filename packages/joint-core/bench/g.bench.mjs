// Benchmark of the geometry library: line intersections, closest points, curves and paths.
// Run with `yarn bench` in `packages/joint-core`.
//
// A single call takes tens of nanoseconds, which is below what can be timed
// reliably, so every task runs a batch of calls over prepared inputs
// and the result is divided by the size of the batch.
import { Bench } from 'tinybench';
import * as g from '../src/g/index.mjs';
import { createSeededRandom } from '../src/util/util.mjs';

const BATCH_SIZE = 1000;

// A seeded generator, so that every run uses the same inputs.
const random = createSeededRandom(7);

const rect = new g.Rect(10, 20, 300, 200);
const center = rect.center();
const ellipse = g.Ellipse.fromRect(rect);
const polygon = new g.Polygon([rect.topLeft(), rect.topRight(), rect.bottomRight(), rect.bottomLeft()]);
const polyline = new g.Polyline([
    { x: 10, y: 20 }, { x: 110, y: 60 }, { x: 210, y: 20 }, { x: 310, y: 60 },
    { x: 310, y: 220 }, { x: 210, y: 180 }, { x: 110, y: 220 }, { x: 10, y: 180 }
]);

const curve = new g.Curve({ x: 10, y: 20 }, { x: 100, y: 200 }, { x: 200, y: -100 }, { x: 310, y: 220 });
// an ellipse in the rectangle, made of four curves
const path = new g.Path('M 160 20 C 242.77 20 310 64.82 310 120 C 310 175.18 242.77 220 160 220 C 77.23 220 10 175.18 10 120 C 10 64.82 77.23 20 160 20 Z');
const pathOpt = { segmentSubdivisions: path.getSegmentSubdivisions() };

const points = [];
const linesToCenter = [];
const linesThrough = [];
const linesAcross = [];
for (let i = 0; i < BATCH_SIZE; i++) {
    const point = new g.Point(random() * 600 - 150, random() * 400 - 100);
    points.push(point);
    linesToCenter.push(new g.Line(point, center));
    linesThrough.push(new g.Line(point, point.clone().reflection(center)));
    linesAcross.push(new g.Line(
        new g.Point(random() * 600 - 150, random() * 400 - 100),
        new g.Point(random() * 600 - 150, random() * 400 - 100)
    ));
}

function batch(fn) {
    return () => {
        for (let i = 0; i < BATCH_SIZE; i++) fn(i);
    };
}

const bench = new Bench({ time: 200, warmupTime: 50 });

bench
    .add('line.intersectionWithLine(line)', batch((i) => linesAcross[i].intersectionWithLine(linesThrough[i])))
    .add('rect.intersectionWithLine(line), line ends in the center', batch((i) => rect.intersectionWithLine(linesToCenter[i])))
    .add('rect.intersectionWithLine(line), line goes through', batch((i) => rect.intersectionWithLine(linesThrough[i])))
    .add('line.intersect(rect)', batch((i) => linesToCenter[i].intersect(rect)))
    .add('rect.intersectionWithLineFromCenterToPoint(point)', batch((i) => rect.intersectionWithLineFromCenterToPoint(points[i])))
    .add('rect.intersectionWithLineFromCenterToPoint(point, angle)', batch((i) => rect.intersectionWithLineFromCenterToPoint(points[i], 30)))
    .add('polygon.intersectionWithLine(line), 4 points', batch((i) => polygon.intersectionWithLine(linesToCenter[i])))
    .add('polyline.intersectionWithLine(line), 8 points', batch((i) => polyline.intersectionWithLine(linesToCenter[i])))
    .add('ellipse.intersectionWithLine(line)', batch((i) => ellipse.intersectionWithLine(linesToCenter[i])))
    .add('line.closestPoint(point)', batch((i) => linesAcross[i].closestPoint(points[i])))
    .add('polyline.closestPoint(point), 8 points', batch((i) => polyline.closestPoint(points[i])))
    .add('polygon.closestPoint(point), 4 points', batch((i) => polygon.closestPoint(points[i])))
    .add('curve.getSubdivisions()', batch(() => curve.getSubdivisions()))
    .add('curve.length()', batch(() => curve.length()))
    .add('path.intersectionWithLine(line), 4 curves', batch((i) => path.intersectionWithLine(linesToCenter[i])))
    .add('path.intersectionWithLine(line), 4 curves, subdivisions passed', batch((i) => path.intersectionWithLine(linesToCenter[i], pathOpt)))
    .add('path.containsPoint(point), 4 curves, subdivisions passed', batch((i) => path.containsPoint(points[i], pathOpt)));

await bench.run();

const rows = bench.tasks.map((task) => {
    const { result } = task;
    if (result.state !== 'completed') return [task.name, result.state, ''];
    // The latency is in milliseconds per batch.
    const nanoseconds = result.latency.mean * 1e6 / BATCH_SIZE;
    return [task.name, `${nanoseconds.toFixed(1)} ns`, `±${result.latency.rme.toFixed(1)}%`];
});

const nameWidth = Math.max(...rows.map(([name]) => name.length));
const timeWidth = Math.max(...rows.map(([, time]) => time.length));
const lines = rows.map(([name, time, margin]) => {
    return `${name.padEnd(nameWidth)}  ${time.padStart(timeWidth)}  ${margin}`;
});

process.stdout.write(`\ng: time per call\n\n${lines.join('\n')}\n\n`);
