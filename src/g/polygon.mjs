import { Point } from './point.mjs';
import { Polyline } from './polyline.mjs';
import { extend } from './extend.mjs';
import { types } from './types.mjs';
import { clonePoints, parsePoints, convexHull } from './points.mjs';

export const Polygon = function(points) {

    if (!(this instanceof Polygon)) {
        return new Polygon(points);
    }

    if (typeof points === 'string') {
        return new Polygon.parse(points);
    }

    this.points = (Array.isArray(points) ? points.map(Point) : []);
};

Polygon.parse = function(svgString) {
    return new Polygon(parsePoints(svgString));
};

Polygon.fromRect = function(rect) {
    return new Polygon([
        rect.topLeft(),
        rect.topRight(),
        rect.bottomRight(),
        rect.bottomLeft()
    ]);
};

Polygon.prototype = extend(Polyline.prototype, {

    type: types.Polygon,

    clone: function() {
        return new Polygon(clonePoints(this.points));
    },

    convexHull: function() {
        return new Polygon(convexHull(this.points));
    },

    lengthPoints: function() {
        const { start, end, points } = this;
        if (points.length <= 1 || start.equals(end)) return points;
        return [...points, start.clone()];
    }

});
