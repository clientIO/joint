'use strict';

(function() {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: $('#paper'),
        width: 400,
        height: 400,
        gridSize: 1,
        model: graph
    });

    $('#btn-layout').on('click', layout);

    function layout() {

        try {
            var adjacencyList = JSON.parse($('#adjacency-list').val());
        } catch (error) {
            console.log(error);
        }

        var cells = adjacencyListToCells(adjacencyList);

        graph.resetCells(cells);

        joint.layout.DirectedGraph.layout(graph, {
            setLinkVertices: false
        });
    }

    // Helpers.
    // --------

    function adjacencyListToCells(adjacencyList) {

        var elements = [];
        var links = [];

        _.each(adjacencyList, function(edges, parentElementLabel) {
            elements.push(makeElement(parentElementLabel));

            _.each(edges, function(childElementLabel) {
                links.push(makeLink(parentElementLabel, childElementLabel));
            });
        });

        // Links must be added after all the elements. This is because when the links
        // are added to the graph, link source/target
        // elements must be in the graph already.
        var cells = elements.concat(links);

        return cells;
    }

    function makeLink(parentElementLabel, childElementLabel) {

        return new joint.dia.Link({
            source: { id: parentElementLabel },
            target: { id: childElementLabel },
            attrs: {
                '.marker-target': { d: 'M 4 0 L 0 2 L 4 4 z' }
            },
            smooth: true
        });
    }

    function makeElement(label) {

        var maxLineLength = _.max(label.split('\n'), function(l) {
            return l.length;
        }).length;

        // Compute width/height of the rectangle based on the number
        // of lines in the label and the letter size. 0.6 * letterSize is
            // an approximation of the monospace font letter width.
        var letterSize = 10;
        var width = 2 * (letterSize * (0.6 * maxLineLength + 1));
        var height = 2 * ((label.split('\n').length + 1) * letterSize);

        return new joint.shapes.basic.Rect({
            id: label,
            size: { width: width, height: height },
            attrs: {
                text: { text: label, 'font-size': letterSize, 'font-family': 'monospace', fill: 'white' },
                rect: {
                    fill: '#FE854F',
                    width: width,
                    height: height,
                    rx: 5,
                    ry: 5,
                    stroke: 'none'
                }
            }
        });
    }

    layout();

})();
