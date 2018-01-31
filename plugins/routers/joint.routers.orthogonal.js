joint.routers.orthogonal = (function(util) {

    // bearing -> opposite bearing
    var opposite = {
        N: 'S',
        S: 'N',
        E: 'W',
        W: 'E'
    };

    // bearing -> radians
    var radians = {
        N: -Math.PI / 2 * 3,
        S: -Math.PI / 2,
        E: 0,
        W: Math.PI
    };

    // HELPERS //

    // simple bearing method (calculates only orthogonal cardinals)
    function bearing(from, to) {

        if (from.x === to.x) return (from.y > to.y) ? 'N' : 'S';
        if (from.y === to.y) return (from.x > to.x) ? 'W' : 'E';
        return null;
    }

    // returns either width or height of a bbox based on the given bearing
    function boxSize(bbox, brng) {

        return bbox[(brng === 'W' || brng === 'E') ? 'width' : 'height'];
    }

    // return source bbox
    function getSourceBBox(linkView, opt) {

        var padding = (opt && opt.elementPadding) || 20;
        return linkView.sourceBBox.clone().inflate(padding);
    }

    // return target bbox
    function getTargetBBox(linkView, opt) {

        var padding = (opt && opt.elementPadding) || 20;
        return linkView.targetBBox.clone().inflate(padding);
    }

    // return source anchor
    function getSourceAnchor(linkView, opt) {

        if (linkView.sourceAnchor) return linkView.sourceAnchor;

        // fallback: center of bbox
        var sourceBBox = getSourceBBox(linkView, opt);
        return sourceBBox.center();
    }

    // return target anchor
    function getTargetAnchor(linkView, opt) {

        if (linkView.targetAnchor) return linkView.targetAnchor;

        // fallback: center of bbox
        var targetBBox = getTargetBBox(linkView, opt);
        return targetBBox.center(); // default
    }

    // transform point to a rect
    function pointBox(p) {

        return new g.Rect(p.x, p.y, 0, 0);
    }

    // returns a minimal rect which covers the given boxes
    function boundary(bbox1, bbox2) {

        var x1 = Math.min(bbox1.x, bbox2.x);
        var y1 = Math.min(bbox1.y, bbox2.y);
        var x2 = Math.max(bbox1.x + bbox1.width, bbox2.x + bbox2.width);
        var y2 = Math.max(bbox1.y + bbox1.height, bbox2.y + bbox2.height);

        return new g.Rect(x1, y1, x2 - x1, y2 - y1);
    }

    // returns a point `p` where lines p,p1 and p,p2 are perpendicular and p is not contained
    // in the given box
    function freeJoin(p1, p2, bbox) {

        var p = new g.Point(p1.x, p2.y);
        if (bbox.containsPoint(p)) p = new g.Point(p2.x, p1.y);
        // kept for reference
        // if (bbox.containsPoint(p)) p = null;

        return p;
    }

    // PARTIAL ROUTERS //

    function vertexVertex(from, to, brng) {

        var p1 = new g.Point(from.x, to.y);
        var p2 = new g.Point(to.x, from.y);
        var d1 = bearing(from, p1);
        var d2 = bearing(from, p2);
        var xBrng = opposite[brng];

        var p = (d1 === brng || (d1 !== xBrng && (d2 === xBrng || d2 !== brng))) ? p1 : p2;

        return { points: [p], direction: bearing(p, to) };
    }

    function elementVertex(from, to, fromBBox) {

        var p = freeJoin(from, to, fromBBox);

        return { points: [p], direction: bearing(p, to) };
    }

    function vertexElement(from, to, toBBox, brng) {

        var route = {};

        var pts = [new g.Point(from.x, to.y), new g.Point(to.x, from.y)];
        var freePts = pts.filter(function(pt) { return !toBBox.containsPoint(pt); });
        var freeBrngPts = freePts.filter(function(pt) { return bearing(pt, from) !== brng; });

        var p;

        if (freeBrngPts.length > 0) {

            // try to pick a point which bears the same direction as the previous segment
            p = freeBrngPts.filter(function(pt) { return bearing(from, pt) === brng; }).pop();
            p = p || freeBrngPts[0];

            route.points = [p];
            route.direction = bearing(p, to);

        } else {

            // Here we found only points which are either contained in the element or they would create
            // a link segment going in opposite direction from the previous one.
            // We take the point inside element and move it outside the element in the direction the
            // route is going. Now we can join this point with the current end (using freeJoin).

            p = util.difference(pts, freePts)[0];

            var p2 = (new g.Point(to)).move(p, -boxSize(toBBox, brng) / 2);
            var p1 = freeJoin(p2, from, toBBox);

            route.points = [p1, p2];
            route.direction = bearing(p2, to);
        }

        return route;
    }

    function elementElement(from, to, fromBBox, toBBox) {

        var route = elementVertex(to, from, toBBox);
        var p1 = route.points[0];

        if (fromBBox.containsPoint(p1)) {

            route = elementVertex(from, to, fromBBox);
            var p2 = route.points[0];

            if (toBBox.containsPoint(p2)) {

                var fromBorder = (new g.Point(from)).move(p2, -boxSize(fromBBox, bearing(from, p2)) / 2);
                var toBorder = (new g.Point(to)).move(p1, -boxSize(toBBox, bearing(to, p1)) / 2);
                var mid = (new g.Line(fromBorder, toBorder)).midpoint();

                var startRoute = elementVertex(from, mid, fromBBox);
                var endRoute = vertexVertex(mid, to, startRoute.direction);

                route.points = [startRoute.points[0], endRoute.points[0]];
                route.direction = endRoute.direction;
            }
        }

        return route;
    }

    // Finds route for situations where one element is inside the other.
    // Typically the route is directed outside the outer element first and
    // then back towards the inner element.
    function insideElement(from, to, fromBBox, toBBox, brng) {

        var route = {};
        var bndry = boundary(fromBBox, toBBox).inflate(1);

        // start from the point which is closer to the boundary
        var reversed = bndry.center().distance(to) > bndry.center().distance(from);
        var start = reversed ? to : from;
        var end = reversed ? from : to;

        var p1, p2, p3;

        if (brng) {
            // Points on circle with radius equals 'W + H` are always outside the rectangle
            // with width W and height H if the center of that circle is the center of that rectangle.
            p1 = g.Point.fromPolar(bndry.width + bndry.height, radians[brng], start);
            p1 = bndry.pointNearestToPoint(p1).move(p1, -1);
        } else {
            p1 = bndry.pointNearestToPoint(start).move(start, 1);
        }

        p2 = freeJoin(p1, end, bndry);

        if (p1.round().equals(p2.round())) {
            p2 = g.Point.fromPolar(bndry.width + bndry.height, g.toRad(p1.theta(start)) + Math.PI / 2, end);
            p2 = bndry.pointNearestToPoint(p2).move(end, 1).round();
            p3 = freeJoin(p1, p2, bndry);
            route.points = reversed ? [p2, p3, p1] : [p1, p3, p2];
        } else {
            route.points = reversed ? [p2, p1] : [p1, p2];
        }

        route.direction = reversed ? bearing(p1, to) : bearing(p2, to);

        return route;
    }

    // MAIN ROUTER //

    // Return points through which a connection needs to be drawn in order to obtain an orthogonal link
    // routing from source to target going through `vertices`.
    function findOrthogonalRoute(vertices, opt, linkView) {

        var padding = opt.elementPadding || 20;

        var sourceBBox = getSourceBBox(linkView, opt);
        var targetBBox = getTargetBBox(linkView, opt);

        var sourceAnchor = getSourceAnchor(linkView, opt);
        var targetAnchor = getTargetAnchor(linkView, opt);

        // if anchor lies outside of bbox, the bbox expands to include it
        sourceBBox = sourceBBox.union(pointBox(sourceAnchor));
        targetBBox = targetBBox.union(pointBox(targetAnchor));

        vertices = util.toArray(vertices).map(g.Point);
        vertices.unshift(sourceAnchor);
        vertices.push(targetAnchor);

        var brng; // bearing of previous route segment

        var orthogonalVertices = []; // the array of found orthogonal vertices to be returned
        for (var i = 0, max = vertices.length - 1; i < max; i++) {

            var route = null;
            var from = vertices[i];
            var to = vertices[i + 1];
            var isOrthogonal = !!bearing(from, to);

            if (i === 0) { // source

                if (i + 1 === max) { // route source -> target

                    // Expand one of the elements by 1px to detect situations when the two
                    // elements are positioned next to each other with no gap in between.
                    if (sourceBBox.intersect(targetBBox.clone().inflate(1))) {
                        route = insideElement(from, to, sourceBBox, targetBBox);

                    } else if (!isOrthogonal) {
                        route = elementElement(from, to, sourceBBox, targetBBox);
                    }

                } else { // route source -> vertex

                    if (sourceBBox.containsPoint(to)) {
                        route = insideElement(from, to, sourceBBox, pointBox(to).inflate(padding));

                    } else if (!isOrthogonal) {
                        route = elementVertex(from, to, sourceBBox);
                    }
                }

            } else if (i + 1 === max) { // route vertex -> target

                // prevent overlaps with previous line segment
                var isOrthogonalLoop = isOrthogonal && bearing(to, from) === brng;

                if (targetBBox.containsPoint(from) || isOrthogonalLoop) {
                    route = insideElement(from, to, pointBox(from).inflate(padding), targetBBox, brng);

                } else if (!isOrthogonal) {
                    route = vertexElement(from, to, targetBBox, brng);
                }

            } else if (!isOrthogonal) { // route vertex -> vertex
                route = vertexVertex(from, to, brng);
            }

            // applicable to all routes:

            // set bearing for next iteration
            if (route) {
                Array.prototype.push.apply(orthogonalVertices, route.points);
                brng = route.direction;

            } else {
                // orthogonal route and not looped
                brng = bearing(from, to);
            }

            // push `to` point to identified orthogonal vertices array
            if (i + 1 < max) {
                orthogonalVertices.push(to);
            }
        }

        return orthogonalVertices;
    }

    return findOrthogonalRoute;

})(joint.util);
