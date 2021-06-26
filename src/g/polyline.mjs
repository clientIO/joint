import { Rect } from './rect.mjs';
import { Point } from './point.mjs';
import { Line } from './line.mjs';

const { abs } = Math;

export const Polyline = function(points) {

    if (!(this instanceof Polyline)) {
        return new Polyline(points);
    }

    if (typeof points === 'string') {
        return new Polyline.parse(points);
    }

    this.points = (Array.isArray(points) ? points.map(Point) : []);
};

Polyline.parse = function(svgString) {
    svgString = svgString.trim();
    if (svgString === '') return new Polyline();

    var points = [];

    var coords = svgString.split(/\s*,\s*|\s+/);
    var n = coords.length;
    for (var i = 0; i < n; i += 2) {
        points.push({ x: +coords[i], y: +coords[i + 1] });
    }

    return new Polyline(points);
};

Polyline.prototype = {

    bbox: function() {

        var x1 = Infinity;
        var x2 = -Infinity;
        var y1 = Infinity;
        var y2 = -Infinity;

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty

        for (var i = 0; i < numPoints; i++) {

            var point = points[i];
            var x = point.x;
            var y = point.y;

            if (x < x1) x1 = x;
            if (x > x2) x2 = x;
            if (y < y1) y1 = y;
            if (y > y2) y2 = y;
        }

        return new Rect(x1, y1, x2 - x1, y2 - y1);
    },

    clone: function() {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return new Polyline(); // if points array is empty

        var newPoints = [];
        for (var i = 0; i < numPoints; i++) {

            var point = points[i].clone();
            newPoints.push(point);
        }

        return new Polyline(newPoints);
    },

    closestPoint: function(p) {

        var cpLength = this.closestPointLength(p);

        return this.pointAtLength(cpLength);
    },

    closestPointLength: function(p) {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return 0; // if points array is empty
        if (numPoints === 1) return 0; // if there is only one point

        var cpLength;
        var minSqrDistance = Infinity;
        var length = 0;
        var n = numPoints - 1;
        for (var i = 0; i < n; i++) {

            var line = new Line(points[i], points[i + 1]);
            var lineLength = line.length();

            var cpNormalizedLength = line.closestPointNormalizedLength(p);
            var cp = line.pointAt(cpNormalizedLength);

            var sqrDistance = cp.squaredDistance(p);
            if (sqrDistance < minSqrDistance) {
                minSqrDistance = sqrDistance;
                cpLength = length + (cpNormalizedLength * lineLength);
            }

            length += lineLength;
        }

        return cpLength;
    },

    closestPointNormalizedLength: function(p) {

        var cpLength = this.closestPointLength(p);
        if (cpLength === 0) return 0; // shortcut

        var length = this.length();
        if (length === 0) return 0; // prevents division by zero

        return cpLength / length;
    },

    closestPointTangent: function(p) {

        var cpLength = this.closestPointLength(p);

        return this.tangentAtLength(cpLength);
    },

    // Returns `true` if the area surrounded by the polyline contains the point `p`.
    // Implements the even-odd SVG algorithm (self-intersections are "outside").
    // (Uses horizontal rays to the right of `p` to look for intersections.)
    // Closes open polylines (always imagines a final closing segment).
    containsPoint: function(p) {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return false; // shortcut (this polyline has no points)

        var x = p.x;
        var y = p.y;

        // initialize a final closing segment by creating one from last-first points on polyline
        var startIndex = numPoints - 1; // start of current polyline segment
        var endIndex = 0; // end of current polyline segment
        var numIntersections = 0;
        for (; endIndex < numPoints; endIndex++) {
            var start = points[startIndex];
            var end = points[endIndex];
            if (p.equals(start)) return true; // shortcut (`p` is a point on polyline)

            var segment = new Line(start, end); // current polyline segment
            if (segment.containsPoint(p)) return true; // shortcut (`p` lies on a polyline segment)

            // do we have an intersection?
            if (((y <= start.y) && (y > end.y)) || ((y > start.y) && (y <= end.y))) {
                // this conditional branch IS NOT entered when `segment` is collinear/coincident with `ray`
                // (when `y === start.y === end.y`)
                // this conditional branch IS entered when `segment` touches `ray` at only one point
                // (e.g. when `y === start.y !== end.y`)
                // since this branch is entered again for the following segment, the two touches cancel out

                var xDifference = (((start.x - x) > (end.x - x)) ? (start.x - x) : (end.x - x));
                if (xDifference >= 0) {
                    // segment lies at least partially to the right of `p`
                    var rayEnd = new Point((x + xDifference), y); // right
                    var ray = new Line(p, rayEnd);

                    if (segment.intersect(ray)) {
                        // an intersection was detected to the right of `p`
                        numIntersections++;
                    }
                } // else: `segment` lies completely to the left of `p` (i.e. no intersection to the right)
            }

            // move to check the next polyline segment
            startIndex = endIndex;
        }

        // returns `true` for odd numbers of intersections (even-odd algorithm)
        return ((numIntersections % 2) === 1);
    },

    // Returns a convex-hull polyline from this polyline.
    // Implements the Graham scan (https://en.wikipedia.org/wiki/Graham_scan).
    // Output polyline starts at the first element of the original polyline that is on the hull, then continues clockwise.
    // Minimal polyline is found (only vertices of the hull are reported, no collinear points).
    convexHull: function() {

        var i;
        var n;

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return new Polyline(); // if points array is empty

        // step 1: find the starting point - point with the lowest y (if equality, highest x)
        var startPoint;
        for (i = 0; i < numPoints; i++) {
            if (startPoint === undefined) {
                // if this is the first point we see, set it as start point
                startPoint = points[i];

            } else if (points[i].y < startPoint.y) {
                // start point should have lowest y from all points
                startPoint = points[i];

            } else if ((points[i].y === startPoint.y) && (points[i].x > startPoint.x)) {
                // if two points have the lowest y, choose the one that has highest x
                // there are no points to the right of startPoint - no ambiguity about theta 0
                // if there are several coincident start point candidates, first one is reported
                startPoint = points[i];
            }
        }

        // step 2: sort the list of points
        // sorting by angle between line from startPoint to point and the x-axis (theta)

        // step 2a: create the point records = [point, originalIndex, angle]
        var sortedPointRecords = [];
        for (i = 0; i < numPoints; i++) {

            var angle = startPoint.theta(points[i]);
            if (angle === 0) {
                angle = 360; // give highest angle to start point
                // the start point will end up at end of sorted list
                // the start point will end up at beginning of hull points list
            }

            var entry = [points[i], i, angle];
            sortedPointRecords.push(entry);
        }

        // step 2b: sort the list in place
        sortedPointRecords.sort(function(record1, record2) {
            // returning a negative number here sorts record1 before record2
            // if first angle is smaller than second, first angle should come before second

            var sortOutput = record1[2] - record2[2];  // negative if first angle smaller
            if (sortOutput === 0) {
                // if the two angles are equal, sort by originalIndex
                sortOutput = record2[1] - record1[1]; // negative if first index larger
                // coincident points will be sorted in reverse-numerical order
                // so the coincident points with lower original index will be considered first
            }

            return sortOutput;
        });

        // step 2c: duplicate start record from the top of the stack to the bottom of the stack
        if (sortedPointRecords.length > 2) {
            var startPointRecord = sortedPointRecords[sortedPointRecords.length - 1];
            sortedPointRecords.unshift(startPointRecord);
        }

        // step 3a: go through sorted points in order and find those with right turns
        // we want to get our results in clockwise order
        var insidePoints = {}; // dictionary of points with left turns - cannot be on the hull
        var hullPointRecords = []; // stack of records with right turns - hull point candidates

        var currentPointRecord;
        var currentPoint;
        var lastHullPointRecord;
        var lastHullPoint;
        var secondLastHullPointRecord;
        var secondLastHullPoint;
        while (sortedPointRecords.length !== 0) {

            currentPointRecord = sortedPointRecords.pop();
            currentPoint = currentPointRecord[0];

            // check if point has already been discarded
            // keys for insidePoints are stored in the form 'point.x@point.y@@originalIndex'
            if (insidePoints.hasOwnProperty(currentPointRecord[0] + '@@' + currentPointRecord[1])) {
                // this point had an incorrect turn at some previous iteration of this loop
                // this disqualifies it from possibly being on the hull
                continue;
            }

            var correctTurnFound = false;
            while (!correctTurnFound) {

                if (hullPointRecords.length < 2) {
                    // not enough points for comparison, just add current point
                    hullPointRecords.push(currentPointRecord);
                    correctTurnFound = true;

                } else {
                    lastHullPointRecord = hullPointRecords.pop();
                    lastHullPoint = lastHullPointRecord[0];
                    secondLastHullPointRecord = hullPointRecords.pop();
                    secondLastHullPoint = secondLastHullPointRecord[0];

                    var crossProduct = secondLastHullPoint.cross(lastHullPoint, currentPoint);

                    if (crossProduct < 0) {
                        // found a right turn
                        hullPointRecords.push(secondLastHullPointRecord);
                        hullPointRecords.push(lastHullPointRecord);
                        hullPointRecords.push(currentPointRecord);
                        correctTurnFound = true;

                    } else if (crossProduct === 0) {
                        // the three points are collinear
                        // three options:
                        // there may be a 180 or 0 degree angle at lastHullPoint
                        // or two of the three points are coincident
                        var THRESHOLD = 1e-10; // we have to take rounding errors into account
                        var angleBetween = lastHullPoint.angleBetween(secondLastHullPoint, currentPoint);
                        if (abs(angleBetween - 180) < THRESHOLD) { // rouding around 180 to 180
                            // if the cross product is 0 because the angle is 180 degrees
                            // discard last hull point (add to insidePoints)
                            //insidePoints.unshift(lastHullPoint);
                            insidePoints[lastHullPointRecord[0] + '@@' + lastHullPointRecord[1]] = lastHullPoint;
                            // reenter second-to-last hull point (will be last at next iter)
                            hullPointRecords.push(secondLastHullPointRecord);
                            // do not do anything with current point
                            // correct turn not found

                        } else if (lastHullPoint.equals(currentPoint) || secondLastHullPoint.equals(lastHullPoint)) {
                            // if the cross product is 0 because two points are the same
                            // discard last hull point (add to insidePoints)
                            //insidePoints.unshift(lastHullPoint);
                            insidePoints[lastHullPointRecord[0] + '@@' + lastHullPointRecord[1]] = lastHullPoint;
                            // reenter second-to-last hull point (will be last at next iter)
                            hullPointRecords.push(secondLastHullPointRecord);
                            // do not do anything with current point
                            // correct turn not found

                        } else if (abs(((angleBetween + 1) % 360) - 1) < THRESHOLD) { // rounding around 0 and 360 to 0
                            // if the cross product is 0 because the angle is 0 degrees
                            // remove last hull point from hull BUT do not discard it
                            // reenter second-to-last hull point (will be last at next iter)
                            hullPointRecords.push(secondLastHullPointRecord);
                            // put last hull point back into the sorted point records list
                            sortedPointRecords.push(lastHullPointRecord);
                            // we are switching the order of the 0deg and 180deg points
                            // correct turn not found
                        }

                    } else {
                        // found a left turn
                        // discard last hull point (add to insidePoints)
                        //insidePoints.unshift(lastHullPoint);
                        insidePoints[lastHullPointRecord[0] + '@@' + lastHullPointRecord[1]] = lastHullPoint;
                        // reenter second-to-last hull point (will be last at next iter of loop)
                        hullPointRecords.push(secondLastHullPointRecord);
                        // do not do anything with current point
                        // correct turn not found
                    }
                }
            }
        }
        // at this point, hullPointRecords contains the output points in clockwise order
        // the points start with lowest-y,highest-x startPoint, and end at the same point

        // step 3b: remove duplicated startPointRecord from the end of the array
        if (hullPointRecords.length > 2) {
            hullPointRecords.pop();
        }

        // step 4: find the lowest originalIndex record and put it at the beginning of hull
        var lowestHullIndex; // the lowest originalIndex on the hull
        var indexOfLowestHullIndexRecord = -1; // the index of the record with lowestHullIndex
        n = hullPointRecords.length;
        for (i = 0; i < n; i++) {

            var currentHullIndex = hullPointRecords[i][1];

            if (lowestHullIndex === undefined || currentHullIndex < lowestHullIndex) {
                lowestHullIndex = currentHullIndex;
                indexOfLowestHullIndexRecord = i;
            }
        }

        var hullPointRecordsReordered = [];
        if (indexOfLowestHullIndexRecord > 0) {
            var newFirstChunk = hullPointRecords.slice(indexOfLowestHullIndexRecord);
            var newSecondChunk = hullPointRecords.slice(0, indexOfLowestHullIndexRecord);
            hullPointRecordsReordered = newFirstChunk.concat(newSecondChunk);

        } else {
            hullPointRecordsReordered = hullPointRecords;
        }

        var hullPoints = [];
        n = hullPointRecordsReordered.length;
        for (i = 0; i < n; i++) {
            hullPoints.push(hullPointRecordsReordered[i][0]);
        }

        return new Polyline(hullPoints);
    },

    // Checks whether two polylines are exactly the same.
    // If `p` is undefined or null, returns false.
    equals: function(p) {

        if (!p) return false;

        var points = this.points;
        var otherPoints = p.points;

        var numPoints = points.length;
        if (otherPoints.length !== numPoints) return false; // if the two polylines have different number of points, they cannot be equal

        for (var i = 0; i < numPoints; i++) {

            var point = points[i];
            var otherPoint = p.points[i];

            // as soon as an inequality is found in points, return false
            if (!point.equals(otherPoint)) return false;
        }

        // if no inequality found in points, return true
        return true;
    },

    intersectionWithLine: function(l) {
        var line = new Line(l);
        var intersections = [];
        var points = this.points;
        for (var i = 0, n = points.length - 1; i < n; i++) {
            var a = points[i];
            var b = points[i + 1];
            var l2 = new Line(a, b);
            var int = line.intersectionWithLine(l2);
            if (int) intersections.push(int[0]);
        }
        return (intersections.length > 0) ? intersections : null;
    },

    isDifferentiable: function() {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return false;

        var n = numPoints - 1;
        for (var i = 0; i < n; i++) {

            var a = points[i];
            var b = points[i + 1];
            var line = new Line(a, b);

            // as soon as a differentiable line is found between two points, return true
            if (line.isDifferentiable()) return true;
        }

        // if no differentiable line is found between pairs of points, return false
        return false;
    },

    length: function() {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return 0; // if points array is empty

        var length = 0;
        var n = numPoints - 1;
        for (var i = 0; i < n; i++) {
            length += points[i].distance(points[i + 1]);
        }

        return length;
    },

    pointAt: function(ratio) {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty
        if (numPoints === 1) return points[0].clone(); // if there is only one point

        if (ratio <= 0) return points[0].clone();
        if (ratio >= 1) return points[numPoints - 1].clone();

        var polylineLength = this.length();
        var length = polylineLength * ratio;

        return this.pointAtLength(length);
    },

    pointAtLength: function(length) {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty
        if (numPoints === 1) return points[0].clone(); // if there is only one point

        var fromStart = true;
        if (length < 0) {
            fromStart = false; // negative lengths mean start calculation from end point
            length = -length; // absolute value
        }

        var l = 0;
        var n = numPoints - 1;
        for (var i = 0; i < n; i++) {
            var index = (fromStart ? i : (n - 1 - i));

            var a = points[index];
            var b = points[index + 1];
            var line = new Line(a, b);
            var d = a.distance(b);

            if (length <= (l + d)) {
                return line.pointAtLength((fromStart ? 1 : -1) * (length - l));
            }

            l += d;
        }

        // if length requested is higher than the length of the polyline, return last endpoint
        var lastPoint = (fromStart ? points[numPoints - 1] : points[0]);
        return lastPoint.clone();
    },

    round: function(precision) {

        var points = this.points;
        var numPoints = points.length;

        for (var i = 0; i < numPoints; i++) {
            points[i].round(precision);
        }

        return this;
    },

    scale: function(sx, sy, origin) {

        var points = this.points;
        var numPoints = points.length;

        for (var i = 0; i < numPoints; i++) {
            points[i].scale(sx, sy, origin);
        }

        return this;
    },

    simplify: function(opt = {}) {

        const points = this.points;
        if (points.length < 3) return this; // we need at least 3 points

        // TODO: we may also accept startIndex and endIndex to specify where to start and end simplification
        const threshold = opt.threshold || 0; // = max distance of middle point from chord to be simplified

        // start at the beginning of the polyline and go forward
        let currentIndex = 0;
        // we need at least one intermediate point (3 points) in every iteration
        // as soon as that stops being true, we know we reached the end of the polyline
        while (points[currentIndex + 2]) {
            const firstIndex = currentIndex;
            const middleIndex = (currentIndex + 1);
            const lastIndex = (currentIndex + 2);

            const firstPoint = points[firstIndex];
            const middlePoint = points[middleIndex];
            const lastPoint = points[lastIndex];

            const chord = new Line(firstPoint, lastPoint); // = connection between first and last point
            const closestPoint = chord.closestPoint(middlePoint); // = closest point on chord from middle point
            const closestPointDistance = closestPoint.distance(middlePoint);
            if (closestPointDistance <= threshold) {
                // middle point is close enough to the chord = simplify
                // 1) remove middle point:
                points.splice(middleIndex, 1);
                // 2) in next iteration, investigate the newly-created triplet of points
                //    - do not change `currentIndex`
                //    = (first point stays, point after removed point becomes middle point)
            } else {
                // middle point is far from the chord
                // 1) preserve middle point
                // 2) in next iteration, move `currentIndex` by one step:
                currentIndex += 1;
                //    = (point after first point becomes first point)
            }
        }

        // `points` array was modified in-place
        return this;
    },

    tangentAt: function(ratio) {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty
        if (numPoints === 1) return null; // if there is only one point

        if (ratio < 0) ratio = 0;
        if (ratio > 1) ratio = 1;

        var polylineLength = this.length();
        var length = polylineLength * ratio;

        return this.tangentAtLength(length);
    },

    tangentAtLength: function(length) {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty
        if (numPoints === 1) return null; // if there is only one point

        var fromStart = true;
        if (length < 0) {
            fromStart = false; // negative lengths mean start calculation from end point
            length = -length; // absolute value
        }

        var lastValidLine; // differentiable (with a tangent)
        var l = 0; // length so far
        var n = numPoints - 1;
        for (var i = 0; i < n; i++) {
            var index = (fromStart ? i : (n - 1 - i));

            var a = points[index];
            var b = points[index + 1];
            var line = new Line(a, b);
            var d = a.distance(b);

            if (line.isDifferentiable()) { // has a tangent line (line length is not 0)
                if (length <= (l + d)) {
                    return line.tangentAtLength((fromStart ? 1 : -1) * (length - l));
                }

                lastValidLine = line;
            }

            l += d;
        }

        // if length requested is higher than the length of the polyline, return last valid endpoint
        if (lastValidLine) {
            var ratio = (fromStart ? 1 : 0);
            return lastValidLine.tangentAt(ratio);
        }

        // if no valid line, return null
        return null;
    },

    toString: function() {

        return this.points + '';
    },

    translate: function(tx, ty) {

        var points = this.points;
        var numPoints = points.length;

        for (var i = 0; i < numPoints; i++) {
            points[i].translate(tx, ty);
        }

        return this;
    },

    // Return svgString that can be used to recreate this line.
    serialize: function() {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return ''; // if points array is empty

        var output = '';
        for (var i = 0; i < numPoints; i++) {

            var point = points[i];
            output += point.x + ',' + point.y + ' ';
        }

        return output.trim();
    }
};

Object.defineProperty(Polyline.prototype, 'start', {
    // Getter for the first point of the polyline.

    configurable: true,

    enumerable: true,

    get: function() {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty

        return this.points[0];
    },
});

Object.defineProperty(Polyline.prototype, 'end', {
    // Getter for the last point of the polyline.

    configurable: true,

    enumerable: true,

    get: function() {

        var points = this.points;
        var numPoints = points.length;
        if (numPoints === 0) return null; // if points array is empty

        return this.points[numPoints - 1];
    },
});
