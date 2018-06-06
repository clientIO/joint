(function multipleLinks() {

    function adjustVertices(graph, cell) {

        // if `cell` is a view, find its model
        cell = cell.model || cell;

        if (cell instanceof joint.dia.Element) {
            // `cell` is an element

            _.chain(graph.getConnectedLinks(cell))
                .groupBy(function(link) {

                    // the key of the group is the model id of the link's source or target
                    // cell id is omitted
                    return _.omit([link.source().id, link.target().id], cell.id)[0];
                })
                .each(function(group, key) {

                    // if the member of the group has both source and target model
                    // then adjust vertices
                    if (key !== 'undefined') adjustVertices(graph, _.first(group));
                })
                .value();

            return;
        }

        // `cell` is a link
        // get its source and target model IDs
        var sourceId = cell.get('source').id || cell.previous('source').id;
        var targetId = cell.get('target').id || cell.previous('target').id;

        // if one of the ends is not a model
        // (if the link is pinned to paper at a point)
        // the link is interpreted as having no siblings
        if (!sourceId || !targetId) {
            // no vertices needed
            cell.unset('vertices');
            return;
        }

        // identify link siblings
        var siblings = _.filter(graph.getLinks(), function(sibling) {

            var siblingSourceId = sibling.source().id;
            var siblingTargetId = sibling.target().id;

            // if source and target are the same
            // or if source and target are reversed
            return ((siblingSourceId === sourceId) && (siblingTargetId === targetId))
                || ((siblingSourceId === targetId) && (siblingTargetId === sourceId));
        });

        var numSiblings = siblings.length;
        switch (numSiblings) {

            case 0: {
                // the link has no siblings
                break;

            } case 1: {
                // there is only one link
                // no vertices needed
                cell.unset('vertices');
                // fall through

            } default: {
                // there are multiple siblings
                // we need to create vertices

                // find the middle point of the link
                var sourceCenter = graph.getCell(sourceId).getBBox().center();
                var targetCenter = graph.getCell(targetId).getBBox().center();
                var midPoint = g.Line(sourceCenter, targetCenter).midpoint();

                // find the angle of the link
                var theta = sourceCenter.theta(targetCenter);

                // constant
                // the maximum distance between two sibling links
                var GAP = 20;

                _.each(siblings, function(sibling, index) {

                    // we want offset values to be calculated as 0, 20, 20, 40, 40, 60, 60 ...
                    var offset = GAP * Math.ceil(index / 2);

                    // place the vertices at points which are `offset` pixels perpendicularly away
                    // from the first link
                    //
                    // as index goes up, alternate left and right
                    //
                    //  ^  odd indices
                    //  |
                    //  |---->  index 0 sibling - centerline (between source and target centers)
                    //  |
                    //  v  even indices
                    var sign = ((index % 2) ? 1 : -1);

                    // to assure symmetry, if there is an even number of siblings
                    // shift all vertices leftward perpendicularly away from the centerline
                    if ((numSiblings % 2) === 0) {
                        offset -= ((GAP / 2) * sign);
                    }

                    // make reverse links count the same as non-reverse
                    var reverse = ((theta < 180) ? 1 : -1);

                    // we found the vertex
                    var angle = g.toRad(theta + (sign * reverse * 90));
                    var vertex = g.Point.fromPolar(offset, angle, midPoint);

                    // replace vertices array with `vertex`
                    sibling.vertices([vertex]);
                });
            }
        }
    }

    function bindInteractionEvents(adjustVertices, graph, paper) {

        // bind `graph` to the `adjustVertices` function
        var adjustGraphVertices = _.partial(adjustVertices, graph);

        // adjust vertices when a cell is removed or its source/target was changed
        graph.on('add remove change:source change:target', adjustGraphVertices);

        // adjust vertices when the user stops interacting with an element
        paper.on('cell:pointerup', adjustGraphVertices);
    }

    function addTools(paper, link) {

        var toolsView = new joint.dia.ToolsView({
            tools: [
                new joint.linkTools.SourceArrowhead(),
                new joint.linkTools.TargetArrowhead()
            ]
        });
        link.findView(paper).addTools(toolsView);
    }

    function bindToolEvents(paper) {

        // show link tools
        paper.on('link:mouseover', function(linkView) {
            linkView.showTools();
        })

        // hide link tools
        paper.on('link:mouseout', function(linkView) {
            linkView.hideTools();
        });
        paper.on('blank:mouseover cell:mouseover', function() {
            paper.hideTools();
        });
    }

    // create graph
    var graph = new joint.dia.Graph;

    // create paper
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-multiple-links'),
        model: graph,
        width: 600,
        height: 400,
        gridSize: 1,
        // disable built-in link dragging
        interactive: {
            linkMove: false
        }
    });

    // enable interactions
    bindInteractionEvents(adjustVertices, graph, paper);

    // create rectangles
    var rect1 = new joint.shapes.standard.Rectangle();
    rect1.position(20, 130);
    rect1.resize(100, 40);
    rect1.attr({
        body: {
            rx: 2,
            ry: 2,
            fill: '#2ecc71',
            stroke: '#27ae60',
            strokeWidth: 2
        }
    });
    rect1.addTo(graph);

    var rect2 = rect1.clone();
    rect2.translate(460, 0);
    rect2.addTo(graph);

    var rect3 = rect1.clone();
    rect3.translate(230, 100);
    rect3.attr({
        body: {
            fill: '#e97bc4',
            stroke: '#ee99cf',
        }
    })
    rect3.addTo(graph);

    // create links
    var link1 = new joint.shapes.standard.Link();
    link1.source(rect1);
    link1.target(rect2);
    link1.connector('smooth');
    link1.attr({
        line: {
            strokeWidth: 3,
            stroke: '#222222'
        }
    });
    link1.addTo(graph);
    addTools(paper, link1);

    var link2 = link1.clone();
    link2.addTo(graph);
    addTools(paper, link2);

    var link3 = link1.clone();
    link3.addTo(graph);
    addTools(paper, link3);

    var link4 = link1.clone();
    link4.addTo(graph);
    addTools(paper, link4);

    var link5 = link1.clone();
    link5.addTo(graph);
    addTools(paper, link5);

    var link6 = link1.clone();
    link6.addTo(graph);
    addTools(paper, link6);

    // tools are visible by default
    paper.hideTools();

    // enable tools
    bindToolEvents(paper);
}());
