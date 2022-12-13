"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var joint_1 = require("../../build/joint");
var rect1 = (0, joint_1.V)('rect');
rect1.attr('fill', 'red');
joint_1.V.prototype.attr.call(rect1, 'fill', 'blue');
if (joint_1.V.isV(rect1)) {
    var matrix = joint_1.V.createSVGMatrix({ a: 2, d: 2 });
    var point = joint_1.V.transformPoint({ x: 10, y: 10 }, matrix);
    point.offset(10, 10);
}
var rect2;
rect2 = rect1;
rect2.attr({ fill: 'yellow' });
joint_1.V.ensureId(rect2.node);
joint_1.V.createSVGMatrix({});
var rect3 = (0, joint_1.Vectorizer)('rect');
rect3.attr('fill', 'red');
joint_1.Vectorizer.prototype.attr.call(rect3, 'fill', 'blue');
if (joint_1.Vectorizer.isV(rect3)) {
    var matrix = joint_1.Vectorizer.createSVGMatrix({ a: 2, d: 2 });
    var point = joint_1.Vectorizer.transformPoint({ x: 10, y: 10 }, matrix);
    point.offset(10, 10);
}
var rect4;
rect4 = rect3;
rect4.attr({ fill: 'yellow' });
joint_1.Vectorizer.ensureId(rect4.node);
//# sourceMappingURL=vectorizer.test.js.map