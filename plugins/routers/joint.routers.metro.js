joint.routers.metro = (function(util) {

    var config = {

        maxAllowedDirectionChange: 45,

        // cost of a diagonal step
        diagonalCost: function() {

            var step = this.step;
            return Math.ceil(Math.sqrt(step * step << 1));
        },

        // an array of directions to find next points on the route
        // different from start/end directions
        directions: function() {

            var step = this.step;
            var cost = this.cost();
            var diagonalCost = this.diagonalCost();

            return [
                { offsetX: step  , offsetY: 0     , cost: cost },
                { offsetX: step  , offsetY: step  , cost: diagonalCost },
                { offsetX: 0     , offsetY: step  , cost: cost },
                { offsetX: -step , offsetY: step  , cost: diagonalCost },
                { offsetX: -step , offsetY: 0     , cost: cost },
                { offsetX: -step , offsetY: -step , cost: diagonalCost },
                { offsetX: 0     , offsetY: -step , cost: cost },
                { offsetX: step  , offsetY: -step , cost: diagonalCost }
            ];
        },

        // a router to use when the metro router fails
        // (one of the partial routes returns null)
        fallbackRouter: function(vertices, opt, linkView) {

            if (!util.isFunction(joint.routers.orthogonal)) {
                throw new Error('Metro requires the orthogonal router as default fallback.');
            }

            return joint.routers.orthogonal(vertices, util.assign({}, config, opt), linkView);
        },

        /* Deprecated */
        // a simple route used in situations when main routing method fails
        // (exceed max number of loop iterations, inaccessible)
        fallbackRoute: function(from, to, opt) {

            return null; // null result will trigger the fallbackRouter

            // left for reference:
            /*// Find a route which breaks by 45 degrees ignoring all obstacles.

            var theta = from.theta(to);

            var a = { x: to.x, y: from.y };
            var b = { x: from.x, y: to.y };

            if (theta % 180 > 90) {
                var t = a;
                a = b;
                b = t;
            }

            var p1 = (theta % 90) < 45 ? a : b;
            var l1 = new g.Line(from, p1);

            var alpha = 90 * Math.ceil(theta / 90);

            var p2 = g.Point.fromPolar(l1.squaredLength(), g.toRad(alpha + 135), p1);
            var l2 = new g.Line(to, p2);

            var point = l1.intersection(l2);
            return point ? [point.round()] : [];*/
        }
    };

    // public function
    return function(vertices, opt, linkView) {

        if (!util.isFunction(joint.routers.manhattan)) {
            throw new Error('Metro requires the manhattan router.');
        }

        return joint.routers.manhattan(vertices, util.assign({}, config, opt), linkView);
    };

})(joint.util);
