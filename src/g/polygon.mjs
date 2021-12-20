import { Point } from './point.mjs';
import { Polyline } from './polyline.mjs';
import { extend } from './extend.mjs';
import { types } from './types.mjs';

export const Polygon = function(points) {

    if (!(this instanceof Polygon)) {
        return new Polygon(points);
    }

    if (points instanceof Polyline) {
        return new Polygon(points.points);
    }

    if (typeof points === 'string') {
        return new Polygon.parse(points);
    }

    this.points = (Array.isArray(points) ? points.map(Point) : []);
};

Polygon.parse = Polyline.parse;
Polygon.fromRect = Polyline.fromRect;

Polygon.prototype = extend(Polyline.prototype, {

    type: types.Polygon,

    clone: function() {
        return new Polygon(Polyline.prototype.clone.call(this));
    },

    convexHull: function() {
        return new Polygon(Polyline.prototype.convexHull.call(this));
    },

    lengthPoints: function() {
        const { start, end, points } = this;
        if (points.length <= 1 || start.equals(end)) return points;
        return [...points, start.clone()];
    }

});
