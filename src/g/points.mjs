export function parsePoints(svgString) {

    // Step 1: Discard surrounding spaces
    const trimmedString = svgString.trim();
    if (trimmedString === '') return [];

    const points = [];

    // Step 2: Split at commas (+ their surrounding spaces) or at multiple spaces
    // ReDoS mitigation: Have an anchor at the beginning of each alternation
    // Note: This doesn't simplify double (or more) commas - causes empty coords
    // This regex is used by `split()`, so it doesn't need to use /g
    const coords = trimmedString.split(/\b\s*,\s*|,\s*|\s+/);

    const numCoords = coords.length;
    for (let i = 0; i < numCoords; i += 2) {
        // Step 3: Convert each coord to number
        // Note: If the coord cannot be converted to a number, it will be `NaN`
        // Note: If the coord is empty ("", e.g. from ",," input), it will be `0`
        // Note: If we end up with an odd number of coords, the last point's second coord will be `NaN`
        points.push({ x: +coords[i], y: +coords[i + 1] });
    }
    return points;
}

export function clonePoints(points) {
    const numPoints = points.length;
    if (numPoints === 0) return [];
    const newPoints = [];
    for (let i = 0; i < numPoints; i++) {
        const point = points[i].clone();
        newPoints.push(point);
    }
    return newPoints;
}

// Returns a convex-hull polyline from this polyline.
// Implements the Graham scan (https://en.wikipedia.org/wiki/Graham_scan).
// Output polyline starts at the first element of the original polyline that is on the hull, then continues clockwise.
// Minimal polyline is found (only vertices of the hull are reported, no collinear points).
export function convexHull(points) {

    const { abs } = Math;

    var i;
    var n;

    var numPoints = points.length;
    if (numPoints === 0) return []; // if points array is empty

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
                    if (abs(angleBetween - 180) < THRESHOLD) { // rounding around 180 to 180
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

    return hullPoints;
}
