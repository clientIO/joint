joint.layout.DirectedGraph = {

    layout: function(graph, opt) {

        opt = opt || {};

        var inputGraph = this._prepareData(graph);
        var runner = dagre.layout();

        if (opt.debugLevel) { runner.debugLevel(opt.debugLevel); }
        if (opt.rankDir) { runner.rankDir(opt.rankDir); }
        if (opt.rankSep) { runner.rankSep(opt.rankSep); }
        if (opt.edgeSep) { runner.edgeSep(opt.edgeSep); }
        if (opt.nodeSep) { runner.nodeSep(opt.nodeSep); }

        var layoutGraph = runner.run(inputGraph);
        
        layoutGraph.eachNode(function(u, value) {
            if (!value.dummy) {
                graph.get('cells').get(u).set('position', {
                    x: value.x - value.width/2,
                    y: value.y - value.height/2
                });
            }
        });

        if (opt.setLinkVertices) {

            layoutGraph.eachEdge(function(e, u, v, value) {
                var link = graph.get('cells').get(e);
                if (link) {
                    graph.get('cells').get(e).set('vertices', value.points);
                }
            });
        }

        return { width: layoutGraph.graph().width, height: layoutGraph.graph().height };
    },
    
    _prepareData: function(graph) {

        var dagreGraph = new dagre.Digraph();

        // For each element.
        _.each(graph.getElements(), function(cell) {

            if (dagreGraph.hasNode(cell.id)) return;

            dagreGraph.addNode(cell.id, {
                width: cell.get('size').width,
                height: cell.get('size').height,
                rank: cell.get('rank')
            });
        });

        // For each link.
        _.each(graph.getLinks(), function(cell) {

            if (dagreGraph.hasEdge(cell.id)) return;

            var sourceId = cell.get('source').id;
            var targetId = cell.get('target').id;

            dagreGraph.addEdge(cell.id, sourceId, targetId, { minLen: cell.get('minLen') || 1 });
        });

        return dagreGraph;
    }
};
