// Accepts path data string, array of segments, array of Curves and/or Lines, or a Polyline.
// Path created is not guaranteed to be a valid (serializable) path (might not start with an M).
import { Polyline } from './polyline.mjs';
import { Rect } from './rect.mjs';
import { Point } from './point.mjs';
import { Line } from './line.mjs';
import { Curve } from './curve.mjs';
import { types } from './types.mjs';
import { extend } from './extend.mjs';
export const Path = function(arg) {

    if (!(this instanceof Path)) {
        return new Path(arg);
    }

    if (typeof arg === 'string') { // create from a path data string
        return new Path.parse(arg);
    }

    this.segments = [];

    var i;
    var n;

    if (!arg) {
        // don't do anything

    } else if (Array.isArray(arg) && arg.length !== 0) { // if arg is a non-empty array
        // flatten one level deep
        // so we can chain arbitrary Path.createSegment results
        arg = arg.reduce(function(acc, val) {
            return acc.concat(val);
        }, []);

        n = arg.length;
        if (arg[0].isSegment) { // create from an array of segments
            for (i = 0; i < n; i++) {

                var segment = arg[i];

                this.appendSegment(segment);
            }

        } else { // create from an array of Curves and/or Lines
            var previousObj = null;
            for (i = 0; i < n; i++) {

                var obj = arg[i];

                if (!((obj instanceof Line) || (obj instanceof Curve))) {
                    throw new Error('Cannot construct a path segment from the provided object.');
                }

                if (i === 0) this.appendSegment(Path.createSegment('M', obj.start));

                // if objects do not link up, moveto segments are inserted to cover the gaps
                if (previousObj && !previousObj.end.equals(obj.start)) this.appendSegment(Path.createSegment('M', obj.start));

                if (obj instanceof Line) {
                    this.appendSegment(Path.createSegment('L', obj.end));

                } else if (obj instanceof Curve) {
                    this.appendSegment(Path.createSegment('C', obj.controlPoint1, obj.controlPoint2, obj.end));
                }

                previousObj = obj;
            }
        }

    } else if (arg.isSegment) { // create from a single segment
        this.appendSegment(arg);

    } else if (arg instanceof Line) { // create from a single Line
        this.appendSegment(Path.createSegment('M', arg.start));
        this.appendSegment(Path.createSegment('L', arg.end));

    } else if (arg instanceof Curve) { // create from a single Curve
        this.appendSegment(Path.createSegment('M', arg.start));
        this.appendSegment(Path.createSegment('C', arg.controlPoint1, arg.controlPoint2, arg.end));

    } else if (arg instanceof Polyline) { // create from a Polyline
        if (!(arg.points && (arg.points.length !== 0))) return; // if Polyline has no points, leave Path empty

        n = arg.points.length;
        for (i = 0; i < n; i++) {

            var point = arg.points[i];

            if (i === 0) this.appendSegment(Path.createSegment('M', point));
            else this.appendSegment(Path.createSegment('L', point));
        }

    } else { // unknown object
        throw new Error('Cannot construct a path from the provided object.');
    }
};

// More permissive than V.normalizePathData and Path.prototype.serialize.
// Allows path data strings that do not start with a Moveto command (unlike SVG specification).
// Does not require spaces between elements; commas are allowed, separators may be omitted when unambiguous (e.g. 'ZM10,10', 'L1.6.8', 'M100-200').
// Allows for command argument chaining.
// Throws an error if wrong number of arguments is provided with a command.
// Throws an error if an unrecognized path command is provided (according to Path.segmentTypes). Only a subset of SVG commands is currently supported (L, C, M, Z).
Path.parse = function(pathData) {

    if (!pathData) return new Path();

    var path = new Path();

    var commandRe = /(?:[a-zA-Z] *)(?:(?:-?\d+(?:\.\d+)?(?:e[-+]?\d+)? *,? *)|(?:-?\.\d+ *,? *))+|(?:[a-zA-Z] *)(?! |\d|-|\.)/g;
    var commands = pathData.match(commandRe);

    var numCommands = commands.length;
    for (var i = 0; i < numCommands; i++) {

        var command = commands[i];
        var argRe = /(?:[a-zA-Z])|(?:(?:-?\d+(?:\.\d+)?(?:e[-+]?\d+)?))|(?:(?:-?\.\d+))/g;
        var args = command.match(argRe);

        var segment = Path.createSegment.apply(this, args); // args = [type, coordinate1, coordinate2...]
        path.appendSegment(segment);
    }

    return path;
};

// Create a segment or an array of segments.
// Accepts unlimited points/coords arguments after `type`.
Path.createSegment = function(type) {

    if (!type) throw new Error('Type must be provided.');

    var segmentConstructor = Path.segmentTypes[type];
    if (!segmentConstructor) throw new Error(type + ' is not a recognized path segment type.');

    var args = [];
    var n = arguments.length;
    for (var i = 1; i < n; i++) { // do not add first element (`type`) to args array
        args.push(arguments[i]);
    }

    return applyToNew(segmentConstructor, args);
};

Path.prototype = {

    type: types.Path,

    // Accepts one segment or an array of segments as argument.
    // Throws an error if argument is not a segment or an array of segments.
    appendSegment: function(arg) {

        var segments = this.segments;
        var numSegments = segments.length;
        // works even if path has no segments

        var currentSegment;

        var previousSegment = ((numSegments !== 0) ? segments[numSegments - 1] : null); // if we are appending to an empty path, previousSegment is null
        var nextSegment = null;

        if (!Array.isArray(arg)) { // arg is a segment
            if (!arg || !arg.isSegment) throw new Error('Segment required.');

            currentSegment = this.prepareSegment(arg, previousSegment, nextSegment);
            segments.push(currentSegment);

        } else { // arg is an array of segments
            // flatten one level deep
            // so we can chain arbitrary Path.createSegment results
            arg = arg.reduce(function(acc, val) {
                return acc.concat(val);
            }, []);

            if (!arg[0].isSegment) throw new Error('Segments required.');

            var n = arg.length;
            for (var i = 0; i < n; i++) {

                var currentArg = arg[i];
                currentSegment = this.prepareSegment(currentArg, previousSegment, nextSegment);
                segments.push(currentSegment);
                previousSegment = currentSegment;
            }
        }
    },

    // Returns the bbox of the path.
    // If path has no segments, returns null.
    // If path has only invisible segments, returns bbox of the end point of last segment.
    bbox: function() {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        var bbox;
        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            if (segment.isVisible) {
                var segmentBBox = segment.bbox();
                bbox = bbox ? bbox.union(segmentBBox) : segmentBBox;
            }
        }

        if (bbox) return bbox;

        // if the path has only invisible elements, return end point of last segment
        var lastSegment = segments[numSegments - 1];
        return new Rect(lastSegment.end.x, lastSegment.end.y, 0, 0);
    },

    // Returns a new path that is a clone of this path.
    clone: function() {

        var segments = this.segments;
        var numSegments = segments.length;
        // works even if path has no segments

        var path = new Path();
        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i].clone();
            path.appendSegment(segment);
        }

        return path;
    },

    closestPoint: function(p, opt) {

        var t = this.closestPointT(p, opt);
        if (!t) return null;

        return this.pointAtT(t);
    },

    closestPointLength: function(p, opt) {

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        var localOpt = { precision: precision, segmentSubdivisions: segmentSubdivisions };

        var t = this.closestPointT(p, localOpt);
        if (!t) return 0;

        return this.lengthAtT(t, localOpt);
    },

    closestPointNormalizedLength: function(p, opt) {

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        var localOpt = { precision: precision, segmentSubdivisions: segmentSubdivisions };

        var cpLength = this.closestPointLength(p, localOpt);
        if (cpLength === 0) return 0; // shortcut

        var length = this.length(localOpt);
        if (length === 0) return 0; // prevents division by zero

        return cpLength / length;
    },

    // Private function.
    closestPointT: function(p, opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        // not using localOpt

        var closestPointT;
        var minSquaredDistance = Infinity;
        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            var subdivisions = segmentSubdivisions[i];

            if (segment.isVisible) {
                var segmentClosestPointT = segment.closestPointT(p, {
                    precision: precision,
                    subdivisions: subdivisions
                });
                var segmentClosestPoint = segment.pointAtT(segmentClosestPointT);
                var squaredDistance = (new Line(segmentClosestPoint, p)).squaredLength();

                if (squaredDistance < minSquaredDistance) {
                    closestPointT = { segmentIndex: i, value: segmentClosestPointT };
                    minSquaredDistance = squaredDistance;
                }
            }
        }

        if (closestPointT) return closestPointT;

        // if no visible segment, return end of last segment
        return { segmentIndex: numSegments - 1, value: 1 };
    },

    closestPointTangent: function(p, opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        // not using localOpt

        var closestPointTangent;
        var minSquaredDistance = Infinity;
        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            var subdivisions = segmentSubdivisions[i];

            if (segment.isDifferentiable()) {
                var segmentClosestPointT = segment.closestPointT(p, {
                    precision: precision,
                    subdivisions: subdivisions
                });
                var segmentClosestPoint = segment.pointAtT(segmentClosestPointT);
                var squaredDistance = (new Line(segmentClosestPoint, p)).squaredLength();

                if (squaredDistance < minSquaredDistance) {
                    closestPointTangent = segment.tangentAtT(segmentClosestPointT);
                    minSquaredDistance = squaredDistance;
                }
            }
        }

        if (closestPointTangent) return closestPointTangent;

        // if no valid segment, return null
        return null;
    },

    // Returns `true` if the area surrounded by the path contains the point `p`.
    // Implements the even-odd algorithm (self-intersections are "outside").
    // Closes open paths (always imagines a final closing segment).
    // Precision may be adjusted by passing an `opt` object.
    containsPoint: function(p, opt) {

        var polylines = this.toPolylines(opt);
        if (!polylines) return false; // shortcut (this path has no polylines)

        var numPolylines = polylines.length;

        // how many component polylines does `p` lie within?
        var numIntersections = 0;
        for (var i = 0; i < numPolylines; i++) {
            var polyline = polylines[i];
            if (polyline.containsPoint(p)) {
                // `p` lies within this polyline
                numIntersections++;
            }
        }

        // returns `true` for odd numbers of intersections (even-odd algorithm)
        return ((numIntersections % 2) === 1);
    },

    // Divides the path into two at requested `ratio` between 0 and 1 with precision better than `opt.precision`; optionally using `opt.subdivisions` provided.
    divideAt: function(ratio, opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        if (ratio < 0) ratio = 0;
        if (ratio > 1) ratio = 1;

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        var localOpt = { precision: precision, segmentSubdivisions: segmentSubdivisions };

        var pathLength = this.length(localOpt);
        var length = pathLength * ratio;

        return this.divideAtLength(length, localOpt);
    },

    // Divides the path into two at requested `length` with precision better than requested `opt.precision`; optionally using `opt.subdivisions` provided.
    divideAtLength: function(length, opt) {

        var numSegments = this.segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        var fromStart = true;
        if (length < 0) {
            fromStart = false; // negative lengths mean start calculation from end point
            length = -length; // absolute value
        }

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        // not using localOpt

        var i;
        var segment;

        // identify the segment to divide:

        var l = 0; // length so far
        var divided;
        var dividedSegmentIndex;
        var lastValidSegment; // visible AND differentiable
        var lastValidSegmentIndex;
        var t;
        for (i = 0; i < numSegments; i++) {
            var index = (fromStart ? i : (numSegments - 1 - i));

            segment = this.getSegment(index);
            var subdivisions = segmentSubdivisions[index];
            var d = segment.length({ precision: precision, subdivisions: subdivisions });

            if (segment.isDifferentiable()) { // segment is not just a point
                lastValidSegment = segment;
                lastValidSegmentIndex = index;

                if (length <= (l + d)) {
                    dividedSegmentIndex = index;
                    divided = segment.divideAtLength(((fromStart ? 1 : -1) * (length - l)), {
                        precision: precision,
                        subdivisions: subdivisions
                    });
                    break;
                }
            }

            l += d;
        }

        if (!lastValidSegment) { // no valid segment found
            return null;
        }

        // else: the path contains at least one valid segment

        if (!divided) { // the desired length is greater than the length of the path
            dividedSegmentIndex = lastValidSegmentIndex;
            t = (fromStart ? 1 : 0);
            divided = lastValidSegment.divideAtT(t);
        }

        // create a copy of this path and replace the identified segment with its two divided parts:

        var pathCopy = this.clone();
        pathCopy.replaceSegment(dividedSegmentIndex, divided);

        var divisionStartIndex = dividedSegmentIndex;
        var divisionMidIndex = dividedSegmentIndex + 1;
        var divisionEndIndex = dividedSegmentIndex + 2;

        // do not insert the part if it looks like a point
        if (!divided[0].isDifferentiable()) {
            pathCopy.removeSegment(divisionStartIndex);
            divisionMidIndex -= 1;
            divisionEndIndex -= 1;
        }

        // insert a Moveto segment to ensure secondPath will be valid:
        var movetoEnd = pathCopy.getSegment(divisionMidIndex).start;
        pathCopy.insertSegment(divisionMidIndex, Path.createSegment('M', movetoEnd));
        divisionEndIndex += 1;

        // do not insert the part if it looks like a point
        if (!divided[1].isDifferentiable()) {
            pathCopy.removeSegment(divisionEndIndex - 1);
            divisionEndIndex -= 1;
        }

        // ensure that Closepath segments in secondPath will be assigned correct subpathStartSegment:

        var secondPathSegmentIndexConversion = divisionEndIndex - divisionStartIndex - 1;
        for (i = divisionEndIndex; i < pathCopy.segments.length; i++) {

            var originalSegment = this.getSegment(i - secondPathSegmentIndexConversion);
            segment = pathCopy.getSegment(i);

            if ((segment.type === 'Z') && !originalSegment.subpathStartSegment.end.equals(segment.subpathStartSegment.end)) {
                // pathCopy segment's subpathStartSegment is different from original segment's one
                // convert this Closepath segment to a Lineto and replace it in pathCopy
                var convertedSegment = Path.createSegment('L', originalSegment.end);
                pathCopy.replaceSegment(i, convertedSegment);
            }
        }

        // distribute pathCopy segments into two paths and return those:

        var firstPath = new Path(pathCopy.segments.slice(0, divisionMidIndex));
        var secondPath = new Path(pathCopy.segments.slice(divisionMidIndex));

        return [firstPath, secondPath];
    },

    // Checks whether two paths are exactly the same.
    // If `p` is undefined or null, returns false.
    equals: function(p) {

        if (!p) return false;

        var segments = this.segments;
        var otherSegments = p.segments;

        var numSegments = segments.length;
        if (otherSegments.length !== numSegments) return false; // if the two paths have different number of segments, they cannot be equal

        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            var otherSegment = otherSegments[i];

            // as soon as an inequality is found in segments, return false
            if ((segment.type !== otherSegment.type) || (!segment.equals(otherSegment))) return false;
        }

        // if no inequality found in segments, return true
        return true;
    },

    // Accepts negative indices.
    // Throws an error if path has no segments.
    // Throws an error if index is out of range.
    getSegment: function(index) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) throw new Error('Path has no segments.');

        if (index < 0) index = numSegments + index; // convert negative indices to positive
        if (index >= numSegments || index < 0) throw new Error('Index out of range.');

        return segments[index];
    },

    // Returns an array of segment subdivisions, with precision better than requested `opt.precision`.
    getSegmentSubdivisions: function(opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        // works even if path has no segments

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        // not using opt.segmentSubdivisions
        // not using localOpt

        var segmentSubdivisions = [];
        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            var subdivisions = segment.getSubdivisions({ precision: precision });
            segmentSubdivisions.push(subdivisions);
        }

        return segmentSubdivisions;
    },

    // Returns an array of subpaths of this path.
    // Invalid paths are validated first.
    // Returns `[]` if path has no segments.
    getSubpaths: function() {

        const validatedPath = this.clone().validate();

        const segments = validatedPath.segments;
        const numSegments = segments.length;

        const subpaths = [];
        for (let i = 0; i < numSegments; i++) {

            const segment = segments[i];
            if (segment.isSubpathStart) {
                // we encountered a subpath start segment
                // create a new path for segment, and push it to list of subpaths
                subpaths.push(new Path(segment));

            } else {
                // append current segment to the last subpath
                subpaths[subpaths.length - 1].appendSegment(segment);
            }
        }

        return subpaths;
    },

    // Insert `arg` at given `index`.
    // `index = 0` means insert at the beginning.
    // `index = segments.length` means insert at the end.
    // Accepts negative indices, from `-1` to `-(segments.length + 1)`.
    // Accepts one segment or an array of segments as argument.
    // Throws an error if index is out of range.
    // Throws an error if argument is not a segment or an array of segments.
    insertSegment: function(index, arg) {

        var segments = this.segments;
        var numSegments = segments.length;
        // works even if path has no segments

        // note that these are incremented compared to getSegments()
        // we can insert after last element (note that this changes the meaning of index -1)
        if (index < 0) index = numSegments + index + 1; // convert negative indices to positive
        if (index > numSegments || index < 0) throw new Error('Index out of range.');

        var currentSegment;

        var previousSegment = null;
        var nextSegment = null;

        if (numSegments !== 0) {
            if (index >= 1) {
                previousSegment = segments[index - 1];
                nextSegment = previousSegment.nextSegment; // if we are inserting at end, nextSegment is null

            } else { // if index === 0
                // previousSegment is null
                nextSegment = segments[0];
            }
        }

        if (!Array.isArray(arg)) {
            if (!arg || !arg.isSegment) throw new Error('Segment required.');

            currentSegment = this.prepareSegment(arg, previousSegment, nextSegment);
            segments.splice(index, 0, currentSegment);

        } else {
            // flatten one level deep
            // so we can chain arbitrary Path.createSegment results
            arg = arg.reduce(function(acc, val) {
                return acc.concat(val);
            }, []);

            if (!arg[0].isSegment) throw new Error('Segments required.');

            var n = arg.length;
            for (var i = 0; i < n; i++) {

                var currentArg = arg[i];
                currentSegment = this.prepareSegment(currentArg, previousSegment, nextSegment);
                segments.splice((index + i), 0, currentSegment); // incrementing index to insert subsequent segments after inserted segments
                previousSegment = currentSegment;
            }
        }
    },

    intersectionWithLine: function(line, opt) {

        var intersection = null;
        var polylines = this.toPolylines(opt);
        if (!polylines) return null;
        for (var i = 0, n = polylines.length; i < n; i++) {
            var polyline = polylines[i];
            var polylineIntersection = line.intersect(polyline);
            if (polylineIntersection) {
                intersection || (intersection = []);
                if (Array.isArray(polylineIntersection)) {
                    Array.prototype.push.apply(intersection, polylineIntersection);
                } else {
                    intersection.push(polylineIntersection);
                }
            }
        }

        return intersection;
    },

    isDifferentiable: function() {

        var segments = this.segments;
        var numSegments = segments.length;

        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            // as soon as a differentiable segment is found in segments, return true
            if (segment.isDifferentiable()) return true;
        }

        // if no differentiable segment is found in segments, return false
        return false;
    },

    // Checks whether current path segments are valid.
    // Note that d is allowed to be empty - should disable rendering of the path.
    isValid: function() {

        var segments = this.segments;
        var isValid = (segments.length === 0) || (segments[0].type === 'M'); // either empty or first segment is a Moveto
        return isValid;
    },

    // Returns length of the path, with precision better than requested `opt.precision`; or using `opt.segmentSubdivisions` provided.
    // If path has no segments, returns 0.
    length: function(opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return 0; // if segments is an empty array

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision; // opt.precision only used in getSegmentSubdivisions() call
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        // not using localOpt

        var length = 0;
        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            var subdivisions = segmentSubdivisions[i];
            length += segment.length({ subdivisions: subdivisions });
        }

        return length;
    },

    // Private function.
    lengthAtT: function(t, opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return 0; // if segments is an empty array

        var segmentIndex = t.segmentIndex;
        if (segmentIndex < 0) return 0; // regardless of t.value

        var tValue = t.value;
        if (segmentIndex >= numSegments) {
            segmentIndex = numSegments - 1;
            tValue = 1;
        } else if (tValue < 0) tValue = 0;
        else if (tValue > 1) tValue = 1;

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        // not using localOpt

        var subdivisions;
        var length = 0;
        for (var i = 0; i < segmentIndex; i++) {

            var segment = segments[i];
            subdivisions = segmentSubdivisions[i];
            length += segment.length({ precisison: precision, subdivisions: subdivisions });
        }

        segment = segments[segmentIndex];
        subdivisions = segmentSubdivisions[segmentIndex];
        length += segment.lengthAtT(tValue, { precisison: precision, subdivisions: subdivisions });

        return length;
    },

    // Returns point at requested `ratio` between 0 and 1, with precision better than requested `opt.precision`; optionally using `opt.segmentSubdivisions` provided.
    pointAt: function(ratio, opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        if (ratio <= 0) return this.start.clone();
        if (ratio >= 1) return this.end.clone();

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        var localOpt = { precision: precision, segmentSubdivisions: segmentSubdivisions };

        var pathLength = this.length(localOpt);
        var length = pathLength * ratio;

        return this.pointAtLength(length, localOpt);
    },

    // Returns point at requested `length`, with precision better than requested `opt.precision`; optionally using `opt.segmentSubdivisions` provided.
    // Accepts negative length.
    pointAtLength: function(length, opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        if (length === 0) return this.start.clone();

        var fromStart = true;
        if (length < 0) {
            fromStart = false; // negative lengths mean start calculation from end point
            length = -length; // absolute value
        }

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        // not using localOpt

        var lastVisibleSegment;
        var l = 0; // length so far
        for (var i = 0; i < numSegments; i++) {
            var index = (fromStart ? i : (numSegments - 1 - i));

            var segment = segments[index];
            var subdivisions = segmentSubdivisions[index];
            var d = segment.length({ precision: precision, subdivisions: subdivisions });

            if (segment.isVisible) {
                if (length <= (l + d)) {
                    return segment.pointAtLength(((fromStart ? 1 : -1) * (length - l)), {
                        precision: precision,
                        subdivisions: subdivisions
                    });
                }

                lastVisibleSegment = segment;
            }

            l += d;
        }

        // if length requested is higher than the length of the path, return last visible segment endpoint
        if (lastVisibleSegment) return (fromStart ? lastVisibleSegment.end : lastVisibleSegment.start);

        // if no visible segment, return last segment end point (no matter if fromStart or no)
        var lastSegment = segments[numSegments - 1];
        return lastSegment.end.clone();
    },

    // Private function.
    pointAtT: function(t) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        var segmentIndex = t.segmentIndex;
        if (segmentIndex < 0) return segments[0].pointAtT(0);
        if (segmentIndex >= numSegments) return segments[numSegments - 1].pointAtT(1);

        var tValue = t.value;
        if (tValue < 0) tValue = 0;
        else if (tValue > 1) tValue = 1;

        return segments[segmentIndex].pointAtT(tValue);
    },

    // Default precision
    PRECISION: 3,

    // Helper method for adding segments.
    prepareSegment: function(segment, previousSegment, nextSegment) {

        // insert after previous segment and before previous segment's next segment
        segment.previousSegment = previousSegment;
        segment.nextSegment = nextSegment;
        if (previousSegment) previousSegment.nextSegment = segment;
        if (nextSegment) nextSegment.previousSegment = segment;

        var updateSubpathStart = segment;
        if (segment.isSubpathStart) {
            segment.subpathStartSegment = segment; // assign self as subpath start segment
            updateSubpathStart = nextSegment; // start updating from next segment
        }

        // assign previous segment's subpath start (or self if it is a subpath start) to subsequent segments
        if (updateSubpathStart) this.updateSubpathStartSegment(updateSubpathStart);

        return segment;
    },

    // Remove the segment at `index`.
    // Accepts negative indices, from `-1` to `-segments.length`.
    // Throws an error if path has no segments.
    // Throws an error if index is out of range.
    removeSegment: function(index) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) throw new Error('Path has no segments.');

        if (index < 0) index = numSegments + index; // convert negative indices to positive
        if (index >= numSegments || index < 0) throw new Error('Index out of range.');

        var removedSegment = segments.splice(index, 1)[0];
        var previousSegment = removedSegment.previousSegment;
        var nextSegment = removedSegment.nextSegment;

        // link the previous and next segments together (if present)
        if (previousSegment) previousSegment.nextSegment = nextSegment; // may be null
        if (nextSegment) nextSegment.previousSegment = previousSegment; // may be null

        // if removed segment used to start a subpath, update all subsequent segments until another subpath start segment is reached
        if (removedSegment.isSubpathStart && nextSegment) this.updateSubpathStartSegment(nextSegment);
    },

    // Replace the segment at `index` with `arg`.
    // Accepts negative indices, from `-1` to `-segments.length`.
    // Accepts one segment or an array of segments as argument.
    // Throws an error if path has no segments.
    // Throws an error if index is out of range.
    // Throws an error if argument is not a segment or an array of segments.
    replaceSegment: function(index, arg) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) throw new Error('Path has no segments.');

        if (index < 0) index = numSegments + index; // convert negative indices to positive
        if (index >= numSegments || index < 0) throw new Error('Index out of range.');

        var currentSegment;

        var replacedSegment = segments[index];
        var previousSegment = replacedSegment.previousSegment;
        var nextSegment = replacedSegment.nextSegment;

        var updateSubpathStart = replacedSegment.isSubpathStart; // boolean: is an update of subpath starts necessary?

        if (!Array.isArray(arg)) {
            if (!arg || !arg.isSegment) throw new Error('Segment required.');

            currentSegment = this.prepareSegment(arg, previousSegment, nextSegment);
            segments.splice(index, 1, currentSegment); // directly replace

            if (updateSubpathStart && currentSegment.isSubpathStart) updateSubpathStart = false; // already updated by `prepareSegment`

        } else {
            // flatten one level deep
            // so we can chain arbitrary Path.createSegment results
            arg = arg.reduce(function(acc, val) {
                return acc.concat(val);
            }, []);

            if (!arg[0].isSegment) throw new Error('Segments required.');

            segments.splice(index, 1);

            var n = arg.length;
            for (var i = 0; i < n; i++) {

                var currentArg = arg[i];
                currentSegment = this.prepareSegment(currentArg, previousSegment, nextSegment);
                segments.splice((index + i), 0, currentSegment); // incrementing index to insert subsequent segments after inserted segments
                previousSegment = currentSegment;

                if (updateSubpathStart && currentSegment.isSubpathStart) updateSubpathStart = false; // already updated by `prepareSegment`
            }
        }

        // if replaced segment used to start a subpath and no new subpath start was added, update all subsequent segments until another subpath start segment is reached
        if (updateSubpathStart && nextSegment) this.updateSubpathStartSegment(nextSegment);
    },

    round: function(precision) {

        var segments = this.segments;
        var numSegments = segments.length;

        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            segment.round(precision);
        }

        return this;
    },

    scale: function(sx, sy, origin) {

        var segments = this.segments;
        var numSegments = segments.length;

        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            segment.scale(sx, sy, origin);
        }

        return this;
    },

    segmentAt: function(ratio, opt) {

        var index = this.segmentIndexAt(ratio, opt);
        if (!index) return null;

        return this.getSegment(index);
    },

    // Accepts negative length.
    segmentAtLength: function(length, opt) {

        var index = this.segmentIndexAtLength(length, opt);
        if (!index) return null;

        return this.getSegment(index);
    },

    segmentIndexAt: function(ratio, opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        if (ratio < 0) ratio = 0;
        if (ratio > 1) ratio = 1;

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        var localOpt = { precision: precision, segmentSubdivisions: segmentSubdivisions };

        var pathLength = this.length(localOpt);
        var length = pathLength * ratio;

        return this.segmentIndexAtLength(length, localOpt);
    },

    // Accepts negative length.
    segmentIndexAtLength: function(length, opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        var fromStart = true;
        if (length < 0) {
            fromStart = false; // negative lengths mean start calculation from end point
            length = -length; // absolute value
        }

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        // not using localOpt

        var lastVisibleSegmentIndex = null;
        var l = 0; // length so far
        for (var i = 0; i < numSegments; i++) {
            var index = (fromStart ? i : (numSegments - 1 - i));

            var segment = segments[index];
            var subdivisions = segmentSubdivisions[index];
            var d = segment.length({ precision: precision, subdivisions: subdivisions });

            if (segment.isVisible) {
                if (length <= (l + d)) return index;
                lastVisibleSegmentIndex = index;
            }

            l += d;
        }

        // if length requested is higher than the length of the path, return last visible segment index
        // if no visible segment, return null
        return lastVisibleSegmentIndex;
    },

    // Returns a string that can be used to reconstruct the path.
    // Additional error checking compared to toString (must start with M segment).
    serialize: function() {

        if (!this.isValid()) throw new Error('Invalid path segments.');

        return this.toString();
    },

    // Returns tangent line at requested `ratio` between 0 and 1, with precision better than requested `opt.precision`; optionally using `opt.segmentSubdivisions` provided.
    tangentAt: function(ratio, opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        if (ratio < 0) ratio = 0;
        if (ratio > 1) ratio = 1;

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        var localOpt = { precision: precision, segmentSubdivisions: segmentSubdivisions };

        var pathLength = this.length(localOpt);
        var length = pathLength * ratio;

        return this.tangentAtLength(length, localOpt);
    },

    // Returns tangent line at requested `length`, with precision better than requested `opt.precision`; optionally using `opt.segmentSubdivisions` provided.
    // Accepts negative length.
    tangentAtLength: function(length, opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        var fromStart = true;
        if (length < 0) {
            fromStart = false; // negative lengths mean start calculation from end point
            length = -length; // absolute value
        }

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;
        // not using localOpt

        var lastValidSegment; // visible AND differentiable (with a tangent)
        var l = 0; // length so far
        for (var i = 0; i < numSegments; i++) {
            var index = (fromStart ? i : (numSegments - 1 - i));

            var segment = segments[index];
            var subdivisions = segmentSubdivisions[index];
            var d = segment.length({ precision: precision, subdivisions: subdivisions });

            if (segment.isDifferentiable()) {
                if (length <= (l + d)) {
                    return segment.tangentAtLength(((fromStart ? 1 : -1) * (length - l)), {
                        precision: precision,
                        subdivisions: subdivisions
                    });
                }

                lastValidSegment = segment;
            }

            l += d;
        }

        // if length requested is higher than the length of the path, return tangent of endpoint of last valid segment
        if (lastValidSegment) {
            var t = (fromStart ? 1 : 0);
            return lastValidSegment.tangentAtT(t);
        }

        // if no valid segment, return null
        return null;
    },

    // Private function.
    tangentAtT: function(t) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        var segmentIndex = t.segmentIndex;
        if (segmentIndex < 0) return segments[0].tangentAtT(0);
        if (segmentIndex >= numSegments) return segments[numSegments - 1].tangentAtT(1);

        var tValue = t.value;
        if (tValue < 0) tValue = 0;
        else if (tValue > 1) tValue = 1;

        return segments[segmentIndex].tangentAtT(tValue);
    },

    toPoints: function(opt) {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null; // if segments is an empty array

        opt = opt || {};
        var precision = (opt.precision === undefined) ? this.PRECISION : opt.precision;
        var segmentSubdivisions = (opt.segmentSubdivisions === undefined) ? this.getSegmentSubdivisions({ precision: precision }) : opt.segmentSubdivisions;

        var points = [];
        var partialPoints = [];
        for (var i = 0; i < numSegments; i++) {
            var segment = segments[i];
            if (segment.isVisible) {
                var currentSegmentSubdivisions = segmentSubdivisions[i];
                if (currentSegmentSubdivisions.length > 0) {
                    var subdivisionPoints = currentSegmentSubdivisions.map(function(curve) {
                        return curve.start;
                    });
                    Array.prototype.push.apply(partialPoints, subdivisionPoints);
                } else {
                    partialPoints.push(segment.start);
                }
            } else if (partialPoints.length > 0) {
                partialPoints.push(segments[i - 1].end);
                points.push(partialPoints);
                partialPoints = [];
            }
        }

        if (partialPoints.length > 0) {
            partialPoints.push(this.end);
            points.push(partialPoints);
        }
        return points;
    },

    toPolylines: function(opt) {

        var polylines = [];
        var points = this.toPoints(opt);
        if (!points) return null;
        for (var i = 0, n = points.length; i < n; i++) {
            polylines.push(new Polyline(points[i]));
        }

        return polylines;
    },

    toString: function() {

        var segments = this.segments;
        var numSegments = segments.length;

        var pathData = '';
        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            pathData += segment.serialize() + ' ';
        }

        return pathData.trim();
    },

    translate: function(tx, ty) {

        var segments = this.segments;
        var numSegments = segments.length;

        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            segment.translate(tx, ty);
        }

        return this;
    },

    // Helper method for updating subpath start of segments, starting with the one provided.
    updateSubpathStartSegment: function(segment) {

        var previousSegment = segment.previousSegment; // may be null
        while (segment && !segment.isSubpathStart) {

            // assign previous segment's subpath start segment to this segment
            if (previousSegment) segment.subpathStartSegment = previousSegment.subpathStartSegment; // may be null
            else segment.subpathStartSegment = null; // if segment had no previous segment, assign null - creates an invalid path!

            previousSegment = segment;
            segment = segment.nextSegment; // move on to the segment after etc.
        }
    },

    // If the path is not valid, insert M 0 0 at the beginning.
    // Path with no segments is considered valid, so nothing is inserted.
    validate: function() {

        if (!this.isValid()) this.insertSegment(0, Path.createSegment('M', 0, 0));
        return this;
    }
};

Object.defineProperty(Path.prototype, 'start', {
    // Getter for the first visible endpoint of the path.

    configurable: true,

    enumerable: true,

    get: function() {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null;

        for (var i = 0; i < numSegments; i++) {

            var segment = segments[i];
            if (segment.isVisible) return segment.start;
        }

        // if no visible segment, return last segment end point
        return segments[numSegments - 1].end;
    }
});

Object.defineProperty(Path.prototype, 'end', {
    // Getter for the last visible endpoint of the path.

    configurable: true,

    enumerable: true,

    get: function() {

        var segments = this.segments;
        var numSegments = segments.length;
        if (numSegments === 0) return null;

        for (var i = numSegments - 1; i >= 0; i--) {

            var segment = segments[i];
            if (segment.isVisible) return segment.end;
        }

        // if no visible segment, return last segment end point
        return segments[numSegments - 1].end;
    }
});


// Local helper function.
// Use an array of arguments to call a constructor (function called with `new`).
// Adapted from https://stackoverflow.com/a/8843181/2263595
// It is not necessary to use this function if the arguments can be passed separately (i.e. if the number of arguments is limited).
// - If that is the case, use `new constructor(arg1, arg2)`, for example.
// It is not necessary to use this function if the function that needs an array of arguments is not supposed to be used as a constructor.
// - If that is the case, use `f.apply(thisArg, [arg1, arg2...])`, for example.
function applyToNew(constructor, argsArray) {
    // The `new` keyword can only be applied to functions that take a limited number of arguments.
    // - We can fake that with .bind().
    // - It calls a function (`constructor`, here) with the arguments that were provided to it - effectively transforming an unlimited number of arguments into limited.
    // - So `new (constructor.bind(thisArg, arg1, arg2...))`
    // - `thisArg` can be anything (e.g. null) because `new` keyword resets context to the constructor object.
    // We need to pass in a variable number of arguments to the bind() call.
    // - We can use .apply().
    // - So `new (constructor.bind.apply(constructor, [thisArg, arg1, arg2...]))`
    // - `thisArg` can still be anything because `new` overwrites it.
    // Finally, to make sure that constructor.bind overwriting is not a problem, we switch to `Function.prototype.bind`.
    // - So, the final version is `new (Function.prototype.bind.apply(constructor, [thisArg, arg1, arg2...]))`

    // The function expects `argsArray[0]` to be `thisArg`.
    // - This means that whatever is sent as the first element will be ignored.
    // - The constructor will only see arguments starting from argsArray[1].
    // - So, a new dummy element is inserted at the start of the array.
    argsArray.unshift(null);

    return new (Function.prototype.bind.apply(constructor, argsArray));
}

// Path segment interface:
var segmentPrototype = {

    // virtual
    bbox: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    clone: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    closestPoint: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    closestPointLength: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    closestPointNormalizedLength: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // Redirect calls to closestPointNormalizedLength() function if closestPointT() is not defined for segment.
    closestPointT: function(p) {

        if (this.closestPointNormalizedLength) return this.closestPointNormalizedLength(p);

        throw new Error('Neither closestPointT() nor closestPointNormalizedLength() function is implemented.');
    },

    // virtual
    closestPointTangent: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    divideAt: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    divideAtLength: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // Redirect calls to divideAt() function if divideAtT() is not defined for segment.
    divideAtT: function(t) {

        if (this.divideAt) return this.divideAt(t);

        throw new Error('Neither divideAtT() nor divideAt() function is implemented.');
    },

    // virtual
    equals: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    getSubdivisions: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    isDifferentiable: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    isSegment: true,

    isSubpathStart: false, // true for Moveto segments

    isVisible: true, // false for Moveto segments

    // virtual
    length: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // Return a fraction of result of length() function if lengthAtT() is not defined for segment.
    lengthAtT: function(t) {

        if (t <= 0) return 0;

        var length = this.length();

        if (t >= 1) return length;

        return length * t;
    },

    nextSegment: null, // needed for subpath start segment updating

    // virtual
    pointAt: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    pointAtLength: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // Redirect calls to pointAt() function if pointAtT() is not defined for segment.
    pointAtT: function(t) {

        if (this.pointAt) return this.pointAt(t);

        throw new Error('Neither pointAtT() nor pointAt() function is implemented.');
    },

    previousSegment: null, // needed to get segment start property

    // virtual
    round: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    subpathStartSegment: null, // needed to get Closepath segment end property

    // virtual
    scale: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    serialize: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    tangentAt: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    tangentAtLength: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // Redirect calls to tangentAt() function if tangentAtT() is not defined for segment.
    tangentAtT: function(t) {

        if (this.tangentAt) return this.tangentAt(t);

        throw new Error('Neither tangentAtT() nor tangentAt() function is implemented.');
    },

    // virtual
    toString: function() {

        throw new Error('Declaration missing for virtual function.');
    },

    // virtual
    translate: function() {

        throw new Error('Declaration missing for virtual function.');
    }
};

// usually directly assigned
// getter for Closepath
Object.defineProperty(segmentPrototype, 'end', {

    configurable: true,

    enumerable: true,

    writable: true
});

// always a getter
// always throws error for Moveto
Object.defineProperty(segmentPrototype, 'start', {
    // get a reference to the end point of previous segment

    configurable: true,

    enumerable: true,

    get: function() {

        if (!this.previousSegment) throw new Error('Missing previous segment. (This segment cannot be the first segment of a path; OR segment has not yet been added to a path.)');

        return this.previousSegment.end;
    }
});

// virtual
Object.defineProperty(segmentPrototype, 'type', {

    configurable: true,

    enumerable: true,

    get: function() {

        throw new Error('Bad segment declaration. No type specified.');
    }
});

// Path segment implementations:
var Lineto = function() {

    var args = [];
    var n = arguments.length;
    for (var i = 0; i < n; i++) {
        args.push(arguments[i]);
    }

    if (!(this instanceof Lineto)) { // switching context of `this` to Lineto when called without `new`
        return applyToNew(Lineto, args);
    }

    if (n === 0) {
        throw new Error('Lineto constructor expects a line, 1 point, or 2 coordinates (none provided).');
    }

    var outputArray;

    if (args[0] instanceof Line) { // lines provided
        if (n === 1) {
            this.end = args[0].end.clone();
            return this;

        } else {
            throw new Error('Lineto constructor expects a line, 1 point, or 2 coordinates (' + n + ' lines provided).');
        }

    } else if (typeof args[0] === 'string' || typeof args[0] === 'number') { // coordinates provided
        if (n === 2) {
            this.end = new Point(+args[0], +args[1]);
            return this;

        } else if (n < 2) {
            throw new Error('Lineto constructor expects a line, 1 point, or 2 coordinates (' + n + ' coordinates provided).');

        } else { // this is a poly-line segment
            var segmentCoords;
            outputArray = [];
            for (i = 0; i < n; i += 2) { // coords come in groups of two

                segmentCoords = args.slice(i, i + 2); // will send one coord if args.length not divisible by 2
                outputArray.push(applyToNew(Lineto, segmentCoords));
            }
            return outputArray;
        }

    } else { // points provided (needs to be last to also cover plain objects with x and y)
        if (n === 1) {
            this.end = new Point(args[0]);
            return this;

        } else { // this is a poly-line segment
            var segmentPoint;
            outputArray = [];
            for (i = 0; i < n; i += 1) {

                segmentPoint = args[i];
                outputArray.push(new Lineto(segmentPoint));
            }
            return outputArray;
        }
    }
};

var linetoPrototype = {

    clone: function() {

        return new Lineto(this.end);
    },

    divideAt: function(ratio) {

        var line = new Line(this.start, this.end);
        var divided = line.divideAt(ratio);
        return [
            new Lineto(divided[0]),
            new Lineto(divided[1])
        ];
    },

    divideAtLength: function(length) {

        var line = new Line(this.start, this.end);
        var divided = line.divideAtLength(length);
        return [
            new Lineto(divided[0]),
            new Lineto(divided[1])
        ];
    },

    getSubdivisions: function() {

        return [];
    },

    isDifferentiable: function() {

        if (!this.previousSegment) return false;

        return !this.start.equals(this.end);
    },

    round: function(precision) {

        this.end.round(precision);
        return this;
    },

    scale: function(sx, sy, origin) {

        this.end.scale(sx, sy, origin);
        return this;
    },

    serialize: function() {

        var end = this.end;
        return this.type + ' ' + end.x + ' ' + end.y;
    },

    toString: function() {

        return this.type + ' ' + this.start + ' ' + this.end;
    },

    translate: function(tx, ty) {

        this.end.translate(tx, ty);
        return this;
    }
};

Object.defineProperty(linetoPrototype, 'type', {

    configurable: true,

    enumerable: true,

    value: 'L'
});

Lineto.prototype = extend(segmentPrototype, Line.prototype, linetoPrototype);

var Curveto = function() {

    var args = [];
    var n = arguments.length;
    for (var i = 0; i < n; i++) {
        args.push(arguments[i]);
    }

    if (!(this instanceof Curveto)) { // switching context of `this` to Curveto when called without `new`
        return applyToNew(Curveto, args);
    }

    if (n === 0) {
        throw new Error('Curveto constructor expects a curve, 3 points, or 6 coordinates (none provided).');
    }

    var outputArray;

    if (args[0] instanceof Curve) { // curves provided
        if (n === 1) {
            this.controlPoint1 = args[0].controlPoint1.clone();
            this.controlPoint2 = args[0].controlPoint2.clone();
            this.end = args[0].end.clone();
            return this;

        } else {
            throw new Error('Curveto constructor expects a curve, 3 points, or 6 coordinates (' + n + ' curves provided).');
        }

    } else if (typeof args[0] === 'string' || typeof args[0] === 'number') { // coordinates provided
        if (n === 6) {
            this.controlPoint1 = new Point(+args[0], +args[1]);
            this.controlPoint2 = new Point(+args[2], +args[3]);
            this.end = new Point(+args[4], +args[5]);
            return this;

        } else if (n < 6) {
            throw new Error('Curveto constructor expects a curve, 3 points, or 6 coordinates (' + n + ' coordinates provided).');

        } else { // this is a poly-bezier segment
            var segmentCoords;
            outputArray = [];
            for (i = 0; i < n; i += 6) { // coords come in groups of six

                segmentCoords = args.slice(i, i + 6); // will send fewer than six coords if args.length not divisible by 6
                outputArray.push(applyToNew(Curveto, segmentCoords));
            }
            return outputArray;
        }

    } else { // points provided (needs to be last to also cover plain objects with x and y)
        if (n === 3) {
            this.controlPoint1 = new Point(args[0]);
            this.controlPoint2 = new Point(args[1]);
            this.end = new Point(args[2]);
            return this;

        } else if (n < 3) {
            throw new Error('Curveto constructor expects a curve, 3 points, or 6 coordinates (' + n + ' points provided).');

        } else { // this is a poly-bezier segment
            var segmentPoints;
            outputArray = [];
            for (i = 0; i < n; i += 3) { // points come in groups of three

                segmentPoints = args.slice(i, i + 3); // will send fewer than three points if args.length is not divisible by 3
                outputArray.push(applyToNew(Curveto, segmentPoints));
            }
            return outputArray;
        }
    }
};

var curvetoPrototype = {

    clone: function() {

        return new Curveto(this.controlPoint1, this.controlPoint2, this.end);
    },

    divideAt: function(ratio, opt) {

        var curve = new Curve(this.start, this.controlPoint1, this.controlPoint2, this.end);
        var divided = curve.divideAt(ratio, opt);
        return [
            new Curveto(divided[0]),
            new Curveto(divided[1])
        ];
    },

    divideAtLength: function(length, opt) {

        var curve = new Curve(this.start, this.controlPoint1, this.controlPoint2, this.end);
        var divided = curve.divideAtLength(length, opt);
        return [
            new Curveto(divided[0]),
            new Curveto(divided[1])
        ];
    },

    divideAtT: function(t) {

        var curve = new Curve(this.start, this.controlPoint1, this.controlPoint2, this.end);
        var divided = curve.divideAtT(t);
        return [
            new Curveto(divided[0]),
            new Curveto(divided[1])
        ];
    },

    isDifferentiable: function() {

        if (!this.previousSegment) return false;

        var start = this.start;
        var control1 = this.controlPoint1;
        var control2 = this.controlPoint2;
        var end = this.end;

        return !(start.equals(control1) && control1.equals(control2) && control2.equals(end));
    },

    round: function(precision) {

        this.controlPoint1.round(precision);
        this.controlPoint2.round(precision);
        this.end.round(precision);
        return this;
    },

    scale: function(sx, sy, origin) {

        this.controlPoint1.scale(sx, sy, origin);
        this.controlPoint2.scale(sx, sy, origin);
        this.end.scale(sx, sy, origin);
        return this;
    },

    serialize: function() {

        var c1 = this.controlPoint1;
        var c2 = this.controlPoint2;
        var end = this.end;
        return this.type + ' ' + c1.x + ' ' + c1.y + ' ' + c2.x + ' ' + c2.y + ' ' + end.x + ' ' + end.y;
    },

    toString: function() {

        return this.type + ' ' + this.start + ' ' + this.controlPoint1 + ' ' + this.controlPoint2 + ' ' + this.end;
    },

    translate: function(tx, ty) {

        this.controlPoint1.translate(tx, ty);
        this.controlPoint2.translate(tx, ty);
        this.end.translate(tx, ty);
        return this;
    }
};

Object.defineProperty(curvetoPrototype, 'type', {

    configurable: true,

    enumerable: true,

    value: 'C'
});

Curveto.prototype = extend(segmentPrototype, Curve.prototype, curvetoPrototype);

var Moveto = function() {

    var args = [];
    var n = arguments.length;
    for (var i = 0; i < n; i++) {
        args.push(arguments[i]);
    }

    if (!(this instanceof Moveto)) { // switching context of `this` to Moveto when called without `new`
        return applyToNew(Moveto, args);
    }

    if (n === 0) {
        throw new Error('Moveto constructor expects a line, a curve, 1 point, or 2 coordinates (none provided).');
    }

    var outputArray;

    if (args[0] instanceof Line) { // lines provided
        if (n === 1) {
            this.end = args[0].end.clone();
            return this;

        } else {
            throw new Error('Moveto constructor expects a line, a curve, 1 point, or 2 coordinates (' + n + ' lines provided).');
        }

    } else if (args[0] instanceof Curve) { // curves provided
        if (n === 1) {
            this.end = args[0].end.clone();
            return this;

        } else {
            throw new Error('Moveto constructor expects a line, a curve, 1 point, or 2 coordinates (' + n + ' curves provided).');
        }

    } else if (typeof args[0] === 'string' || typeof args[0] === 'number') { // coordinates provided
        if (n === 2) {
            this.end = new Point(+args[0], +args[1]);
            return this;

        } else if (n < 2) {
            throw new Error('Moveto constructor expects a line, a curve, 1 point, or 2 coordinates (' + n + ' coordinates provided).');

        } else { // this is a moveto-with-subsequent-poly-line segment
            var segmentCoords;
            outputArray = [];
            for (i = 0; i < n; i += 2) { // coords come in groups of two

                segmentCoords = args.slice(i, i + 2); // will send one coord if args.length not divisible by 2
                if (i === 0) outputArray.push(applyToNew(Moveto, segmentCoords));
                else outputArray.push(applyToNew(Lineto, segmentCoords));
            }
            return outputArray;
        }

    } else { // points provided (needs to be last to also cover plain objects with x and y)
        if (n === 1) {
            this.end = new Point(args[0]);
            return this;

        } else { // this is a moveto-with-subsequent-poly-line segment
            var segmentPoint;
            outputArray = [];
            for (i = 0; i < n; i += 1) { // points come one by one

                segmentPoint = args[i];
                if (i === 0) outputArray.push(new Moveto(segmentPoint));
                else outputArray.push(new Lineto(segmentPoint));
            }
            return outputArray;
        }
    }
};

var movetoPrototype = {

    bbox: function() {

        return null;
    },

    clone: function() {

        return new Moveto(this.end);
    },

    closestPoint: function() {

        return this.end.clone();
    },

    closestPointNormalizedLength: function() {

        return 0;
    },

    closestPointLength: function() {

        return 0;
    },

    closestPointT: function() {

        return 1;
    },

    closestPointTangent: function() {

        return null;
    },

    divideAt: function() {

        return [
            this.clone(),
            this.clone()
        ];
    },

    divideAtLength: function() {

        return [
            this.clone(),
            this.clone()
        ];
    },

    equals: function(m) {

        return this.end.equals(m.end);
    },

    getSubdivisions: function() {

        return [];
    },

    isDifferentiable: function() {

        return false;
    },

    isSubpathStart: true,

    isVisible: false,

    length: function() {

        return 0;
    },

    lengthAtT: function() {

        return 0;
    },

    pointAt: function() {

        return this.end.clone();
    },

    pointAtLength: function() {

        return this.end.clone();
    },

    pointAtT: function() {

        return this.end.clone();
    },

    round: function(precision) {

        this.end.round(precision);
        return this;
    },

    scale: function(sx, sy, origin) {

        this.end.scale(sx, sy, origin);
        return this;
    },

    serialize: function() {

        var end = this.end;
        return this.type + ' ' + end.x + ' ' + end.y;
    },

    tangentAt: function() {

        return null;
    },

    tangentAtLength: function() {

        return null;
    },

    tangentAtT: function() {

        return null;
    },

    toString: function() {

        return this.type + ' ' + this.end;
    },

    translate: function(tx, ty) {

        this.end.translate(tx, ty);
        return this;
    }
};

Object.defineProperty(movetoPrototype, 'start', {

    configurable: true,

    enumerable: true,

    get: function() {

        throw new Error('Illegal access. Moveto segments should not need a start property.');
    }
});

Object.defineProperty(movetoPrototype, 'type', {

    configurable: true,

    enumerable: true,

    value: 'M'
});

Moveto.prototype = extend(segmentPrototype, movetoPrototype); // does not inherit from any other geometry object

var Closepath = function() {

    var args = [];
    var n = arguments.length;
    for (var i = 0; i < n; i++) {
        args.push(arguments[i]);
    }

    if (!(this instanceof Closepath)) { // switching context of `this` to Closepath when called without `new`
        return applyToNew(Closepath, args);
    }

    if (n > 0) {
        throw new Error('Closepath constructor expects no arguments.');
    }

    return this;
};

var closepathPrototype = {

    clone: function() {

        return new Closepath();
    },

    divideAt: function(ratio) {

        var line = new Line(this.start, this.end);
        var divided = line.divideAt(ratio);
        return [
            // if we didn't actually cut into the segment, first divided part can stay as Z
            (divided[1].isDifferentiable() ? new Lineto(divided[0]) : this.clone()),
            new Lineto(divided[1])
        ];
    },

    divideAtLength: function(length) {

        var line = new Line(this.start, this.end);
        var divided = line.divideAtLength(length);
        return [
            // if we didn't actually cut into the segment, first divided part can stay as Z
            (divided[1].isDifferentiable() ? new Lineto(divided[0]) : this.clone()),
            new Lineto(divided[1])
        ];
    },

    getSubdivisions: function() {

        return [];
    },

    isDifferentiable: function() {

        if (!this.previousSegment || !this.subpathStartSegment) return false;

        return !this.start.equals(this.end);
    },

    round: function() {

        return this;
    },

    scale: function() {

        return this;
    },

    serialize: function() {

        return this.type;
    },

    toString: function() {

        return this.type + ' ' + this.start + ' ' + this.end;
    },

    translate: function() {

        return this;
    }
};

Object.defineProperty(closepathPrototype, 'end', {
    // get a reference to the end point of subpath start segment

    configurable: true,

    enumerable: true,

    get: function() {

        if (!this.subpathStartSegment) throw new Error('Missing subpath start segment. (This segment needs a subpath start segment (e.g. Moveto); OR segment has not yet been added to a path.)');

        return this.subpathStartSegment.end;
    }
});

Object.defineProperty(closepathPrototype, 'type', {

    configurable: true,

    enumerable: true,

    value: 'Z'
});

Closepath.prototype = extend(segmentPrototype, Line.prototype, closepathPrototype);

var segmentTypes = Path.segmentTypes = {
    L: Lineto,
    C: Curveto,
    M: Moveto,
    Z: Closepath,
    z: Closepath
};

Path.regexSupportedData = new RegExp('^[\\s\\d' + Object.keys(segmentTypes).join('') + ',.]*$');

Path.isDataSupported = function(data) {

    if (typeof data !== 'string') return false;
    return this.regexSupportedData.test(data);
};
