joint.routers.orthogonal = function() {

    var sourceBBox, targetBBox;

    // Return the direction that one would have to take traveling from `p1` to `p2`.
    // This function assumes the line between `p1` and `p2` is orthogonal.
    function direction(p1, p2) {
        
        if (p1.y < p2.y && p1.x === p2.x) {
            return 'down';
        } else if (p1.y > p2.y && p1.x === p2.x) {
            return 'up';
        } else if (p1.x < p2.x && p1.y === p2.y) {
            return 'right';
        }
        return 'left';
    }

    function bestDirection(p1, p2, preferredDirection) {

        var directions;

        // This branching determines possible directions that one can take to travel
        // from `p1` to `p2`.
        if (p1.x < p2.x) {

            if (p1.y > p2.y) { directions = ['up', 'right']; }
            else if (p1.y < p2.y) { directions = ['down', 'right']; }
            else { directions = ['right']; }

        } else if (p1.x > p2.x) {

            if (p1.y > p2.y) { directions = ['up', 'left']; }
            else if (p1.y < p2.y) { directions = ['down', 'left']; }
            else { directions = ['left']; }

        } else {

            if (p1.y > p2.y) { directions = ['up']; }
            else { directions = ['down']; }
        }

        if (_.contains(directions, preferredDirection)) {
            return preferredDirection;
        }

        var direction = _.first(directions);

        // Should the direction be the exact opposite of the preferred direction,
        // try another one if such direction exists.
        switch (preferredDirection) {
        case 'down': if (direction === 'up') return _.last(directions); break;
        case 'up': if (direction === 'down') return _.last(directions); break;
        case 'left': if (direction === 'right') return _.last(directions); break;
        case 'right': if (direction === 'left') return _.last(directions); break;
        }
        return direction;
    };

    // Find a vertex in between the vertices `p1` and `p2` so that the route between those vertices
    // is orthogonal. Prefer going the direction determined by `preferredDirection`.
    function findMiddleVertex(p1, p2, preferredDirection) {
        
        var direction = bestDirection(p1, p2, preferredDirection);
        if (direction === 'down' || direction === 'up') {
            return { x: p1.x, y: p2.y, d: direction };
        }
        return { x: p2.x, y: p1.y, d: direction };
    }

    // Return points that one needs to draw a connection through in order to have a orthogonal link
    // routing from source to target going through `vertices`.
    function findOrthogonalRoute(vertices) {

        vertices = (vertices || []).slice();
        var orthogonalVertices = [];

        var sourceCenter = sourceBBox.center();
        var targetCenter = targetBBox.center();

        if (!vertices.length) {

            if (Math.abs(sourceCenter.x - targetCenter.x) < (sourceBBox.width / 2) ||
                Math.abs(sourceCenter.y - targetCenter.y) < (sourceBBox.height / 2)
            ) {

                vertices = [{
                    x: Math.min(sourceCenter.x, targetCenter.x) +
                        Math.abs(sourceCenter.x - targetCenter.x) / 2,
                    y: Math.min(sourceCenter.y, targetCenter.y) +
                        Math.abs(sourceCenter.y - targetCenter.y) / 2
                }];
            }
        }

        vertices.unshift(sourceCenter);
        vertices.push(targetCenter);

        var orthogonalVertex;
        var lastOrthogonalVertex;
        var vertex;
        var nextVertex;

        // For all the pairs of link model vertices...
        for (var i = 0; i < vertices.length - 1; i++) {

            vertex = vertices[i];
            nextVertex = vertices[i + 1];
            lastOrthogonalVertex = _.last(orthogonalVertices);
            
            if (i > 0) {
                // Push all the link vertices to the orthogonal route.
                orthogonalVertex = vertex;
                // Determine a direction between the last vertex and the new one.
                // Therefore, each vertex contains the `d` property describing the direction that one
                // would have to take to travel to that vertex.
                orthogonalVertex.d = lastOrthogonalVertex
                    ? direction(lastOrthogonalVertex, vertex)
                    : 'top';

                orthogonalVertices.push(orthogonalVertex);
                lastOrthogonalVertex = orthogonalVertex;
            }

            // Make sure that we don't create a vertex that would go the opposite direction then
            // that of the previous one.
            // Othwerwise, a 'spike' segment would be created which is not desirable.
            // Find a dummy vertex to keep the link orthogonal. Preferably, take the same direction
            // as the previous one.
            var d = lastOrthogonalVertex && lastOrthogonalVertex.d;
            orthogonalVertex = findMiddleVertex(vertex, nextVertex, d);

            // Do not add a new vertex that is the same as one of the vertices already added.
            if (!g.point(orthogonalVertex).equals(g.point(vertex)) &&
                !g.point(orthogonalVertex).equals(g.point(nextVertex))) {

                orthogonalVertices.push(orthogonalVertex);
            }
        }
        return orthogonalVertices;
    };

    return function(vertices) {

        sourceBBox = this.sourceBBox;
        targetBBox = this.targetBBox;

        return findOrthogonalRoute(vertices);
    };

}();
