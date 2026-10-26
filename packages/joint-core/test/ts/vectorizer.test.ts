import { V, Vectorizer } from '../../';

//** V */

// Object
const rect1 = V('rect');
rect1.attr('fill', 'red');
V.prototype.removeAttr.call(rect1, 'fill');

// Static
if (V.isV(rect1)) {
    const matrix = V.createSVGMatrix({ a: 2, d: 2 });
    const point = V.transformPoint({ x: 10, y: 10 }, matrix);
    point.offset(10, 10);
}

const rect2: V = rect1 as V;
rect2.attr({ fill: 'yellow' });
V.ensureId(rect2.node);
V.createSVGMatrix({});

//** Vectorizer */

// Object
const rect3 = Vectorizer('rect');
rect3.attr('fill', 'red');
Vectorizer.prototype.removeAttr.call(rect3, 'fill');

// Static
if (Vectorizer.isV(rect3)) {
    const matrix = Vectorizer.createSVGMatrix({ a: 2, d: 2 });
    const point = Vectorizer.transformPoint({ x: 10, y: 10 }, matrix);
    point.offset(10, 10);
}

const rect4: Vectorizer = rect3 as Vectorizer;
rect4.attr({ fill: 'yellow' });
Vectorizer.ensureId(rect4.node);

//** Conversion to paths */

const vEllipse = V('ellipse', { cx: 50, cy: 160, rx: 25, ry: 15 });
const ellipsePath: V = vEllipse.convertToPath();
ellipsePath.translate(100);

const vPolyline = V('polyline', { points: '25,395 30,405 50,385 75,415' });
vPolyline.convertToPath().translate(100);

//** Rich text */

const vText = V('text', { x: 250, y: 30 });
vText.text('This is a rich text.\nThis text goes to multiple lines.', {
    lineHeight: 'auto',
    annotations: [
        { start: 5, end: 10, attrs: { fill: 'red', 'font-size': 30, rotate: '20' }},
        { start: 20, end: 30, attrs: { 'class': 'text-link' }}
    ],
    includeAnnotationIndices: true
});
