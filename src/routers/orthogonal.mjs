import * as g from '../g/index.mjs';
import * as util from '../util/index.mjs';

// bearing -> opposite bearing
var opposites = {
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

// returns a point `p` where lines p,p1 and p,p2 are perpendicular and p is not contained
// in the given box
function freeJoin(p1, p2, bbox) {

    var p = new g.Point(p1.x, p2.y);
    if (bbox.containsPoint(p)) p = new g.Point(p2.x, p1.y);
    // kept for reference
    // if (bbox.containsPoint(p)) p = null;

    return p;
}

// returns either width or height of a bbox based on the given bearing
function getBBoxSize(bbox, bearing) {

    return bbox[(bearing === 'W' || bearing === 'E') ? 'width' : 'height'];
}

// simple bearing method (calculates only orthogonal cardinals)
function getBearing(from, to) {

    if (from.x === to.x) return (from.y > to.y) ? 'N' : 'S';
    if (from.y === to.y) return (from.x > to.x) ? 'W' : 'E';
    return null;
}

// transform point to a rect
function getPointBox(p) {

    return new g.Rect(p.x, p.y, 0, 0);
}

function getPaddingBox(opt) {

    // if both provided, opt.padding wins over opt.elementPadding
    var sides = util.normalizeSides(opt.padding || opt.elementPadding || 20);

    return {
        x: -sides.left,
        y: -sides.top,
        width: sides.left + sides.right,
        height: sides.top + sides.bottom
    };
}

// return source bbox
function getSourceBBox(linkView, opt) {

    return linkView.sourceBBox.clone().moveAndExpand(getPaddingBox(opt));
}

// return target bbox
function getTargetBBox(linkView, opt) {

    return linkView.targetBBox.clone().moveAndExpand(getPaddingBox(opt));
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

// PARTIAL ROUTERS //

function vertexVertex(from, to, bearing) {

    var p1 = new g.Point(from.x, to.y);
    var p2 = new g.Point(to.x, from.y);
    var d1 = getBearing(from, p1);
    var d2 = getBearing(from, p2);
    var opposite = opposites[bearing];

    var p = (d1 === bearing || (d1 !== opposite && (d2 === opposite || d2 !== bearing))) ? p1 : p2;

    return { points: [p], direction: getBearing(p, to) };
}

function elementVertex(from, to, fromBBox) {

    var p = freeJoin(from, to, fromBBox);

    return { points: [p], direction: getBearing(p, to) };
}

function vertexElement(from, to, toBBox, bearing) {

    var route = {};

    var points = [new g.Point(from.x, to.y), new g.Point(to.x, from.y)];
    var freePoints = points.filter(function(pt) {
        return !toBBox.containsPoint(pt);
    });
    var freeBearingPoints = freePoints.filter(function(pt) {
        return getBearing(pt, from) !== bearing;
    });

    var p;

    if (freeBearingPoints.length > 0) {
        // Try to pick a point which bears the same direction as the previous segment.

        p = freeBearingPoints.filter(function(pt) {
            return getBearing(from, pt) === bearing;
        }).pop();
        p = p || freeBearingPoints[0];

        route.points = [p];
        route.direction = getBearing(p, to);

    } else {
        // Here we found only points which are either contained in the element or they would create
        // a link segment going in opposite direction from the previous one.
        // We take the point inside element and move it outside the element in the direction the
        // route is going. Now we can join this point with the current end (using freeJoin).

        p = util.difference(points, freePoints)[0];

        var p2 = (new g.Point(to)).move(p, -getBBoxSize(toBBox, bearing) / 2);
        var p1 = freeJoin(p2, from, toBBox);

        route.points = [p1, p2];
        route.direction = getBearing(p2, to);
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

            var fromBorder = (new g.Point(from)).move(p2, -getBBoxSize(fromBBox, getBearing(from, p2)) / 2);
            var toBorder = (new g.Point(to)).move(p1, -getBBoxSize(toBBox, getBearing(to, p1)) / 2);
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
function insideElement(from, to, fromBBox, toBBox, bearing) {

    var route = {};
    var boundary = fromBBox.union(toBBox).inflate(1);

    // start from the point which is closer to the boundary
    var reversed = boundary.center().distance(to) > boundary.center().distance(from);
    var start = reversed ? to : from;
    var end = reversed ? from : to;

    var p1, p2, p3;

    if (bearing) {
        // Points on circle with radius equals 'W + H` are always outside the rectangle
        // with width W and height H if the center of that circle is the center of that rectangle.
        p1 = g.Point.fromPolar(boundary.width + boundary.height, radians[bearing], start);
        p1 = boundary.pointNearestToPoint(p1).move(p1, -1);

    } else {
        p1 = boundary.pointNearestToPoint(start).move(start, 1);
    }

    p2 = freeJoin(p1, end, boundary);

    if (p1.round().equals(p2.round())) {
        p2 = g.Point.fromPolar(boundary.width + boundary.height, g.toRad(p1.theta(start)) + Math.PI / 2, end);
        p2 = boundary.pointNearestToPoint(p2).move(end, 1).round();
        p3 = freeJoin(p1, p2, boundary);
        route.points = reversed ? [p2, p3, p1] : [p1, p3, p2];

    } else {
        route.points = reversed ? [p2, p1] : [p1, p2];
    }

    route.direction = reversed ? getBearing(p1, to) : getBearing(p2, to);

    return route;
}

// MAIN ROUTER //

// Return points through which a connection needs to be drawn in order to obtain an orthogonal link
// routing from source to target going through `vertices`.
export function orthogonal(vertices, opt, linkView) {

    var sourceBBox = getSourceBBox(linkView, opt);
    var targetBBox = getTargetBBox(linkView, opt);

    var sourceAnchor = getSourceAnchor(linkView, opt);
    var targetAnchor = getTargetAnchor(linkView, opt);

    // if anchor lies outside of bbox, the bbox expands to include it
    sourceBBox = sourceBBox.union(getPointBox(sourceAnchor));
    targetBBox = targetBBox.union(getPointBox(targetAnchor));

    vertices = util.toArray(vertices).map(g.Point);
    vertices.unshift(sourceAnchor);
    vertices.push(targetAnchor);

    var bearing; // bearing of previous route segment

    var orthogonalVertices = []; // the array of found orthogonal vertices to be returned
    for (var i = 0, max = vertices.length - 1; i < max; i++) {

        var route = null;

        var from = vertices[i];
        var to = vertices[i + 1];

        var isOrthogonal = !!getBearing(from, to);

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
                    route = insideElement(from, to, sourceBBox, getPointBox(to).moveAndExpand(getPaddingBox(opt)));

                } else if (!isOrthogonal) {
                    route = elementVertex(from, to, sourceBBox);
                }
            }

        } else if (i + 1 === max) { // route vertex -> target

            // prevent overlaps with previous line segment
            var isOrthogonalLoop = isOrthogonal && getBearing(to, from) === bearing;

            if (targetBBox.containsPoint(from) || isOrthogonalLoop) {
                route = insideElement(from, to, getPointBox(from).moveAndExpand(getPaddingBox(opt)), targetBBox, bearing);

            } else if (!isOrthogonal) {
                route = vertexElement(from, to, targetBBox, bearing);
            }

        } else if (!isOrthogonal) { // route vertex -> vertex
            route = vertexVertex(from, to, bearing);
        }

        // applicable to all routes:

        // set bearing for next iteration
        if (route) {
            Array.prototype.push.apply(orthogonalVertices, route.points);
            bearing = route.direction;

        } else {
            // orthogonal route and not looped
            bearing = getBearing(from, to);
        }

        // push `to` point to identified orthogonal vertices array
        if (i + 1 < max) {
            orthogonalVertices.push(to);
        }
    }

    return orthogonalVertices;
}
