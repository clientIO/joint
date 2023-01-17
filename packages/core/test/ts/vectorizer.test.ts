import { V, Vectorizer } from '../../build/joint';

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

let rect2: V;
rect2 = rect1;
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

let rect4: Vectorizer;
rect4 = rect3;
rect4.attr({ fill: 'yellow' });
Vectorizer.ensureId(rect4.node);
