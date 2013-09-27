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
            graph.get('cells').get(u).set('position', { x: value.x, y: value.y });
        });

        if (opt.setLinkVertices) {

            layoutGraph.eachEdge(function(e, u, v, value) {
                graph.get('cells').get(e).set('vertices', value.points);
            });
        }
    },
    
    _prepareData: function(graph) {

        var dagreGraph = new dagre.Digraph();

        // For each element.
        graph.get('cells').each(function(cell) {

            if (!(cell instanceof joint.dia.Element)) return;

            if (dagreGraph.hasNode(cell.id)) return;

            dagreGraph.addNode(cell.id, {
                width: cell.get('size').width,
                height: cell.get('size').height
            });
        });

        // For each link.
        graph.get('cells').each(function(cell) {

            if (!(cell instanceof joint.dia.Link)) return;
            
            if (dagreGraph.hasEdge(cell.id)) return;

            var sourceId = cell.get('source').id;
            var targetId = cell.get('target').id;

            dagreGraph.addEdge(cell.id, sourceId, targetId);
        });

        return dagreGraph;
    }
};
