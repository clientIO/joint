joint.layout.DirectedGraph = {

    layout: function(graph, opt) {

        opt = opt || {};

        var data = this._prepareData(graph);
        var runner = dagre.layout().nodes(data.nodeData).edges(data.edgeData);

        if (opt.debugLevel) { runner.debugLevel(opt.debugLevel); }
        if (opt.rankDir) { runner.rankDir(opt.rankDir); }
        if (opt.rankSep) { runner.rankSep(opt.rankSep); }
        if (opt.edgeSep) { runner.edgeSep(opt.edgeSep); }
        if (opt.nodeSep) { runner.nodeSep(opt.nodeSep); }

        runner.run();
        
        _.each(data.nodeData, function(node) {

            graph.get('cells').get(node.id).set('position', { x: node.dagre.x, y: node.dagre.y });
        });

        if (opt.setLinkVertices) {

            _.each(data.edgeData, function(edge) {

                graph.get('cells').get(edge.id).set('vertices', edge.dagre.points);
            });
        }
    },
    
    _prepareData: function(graph) {

        var nodeData = [];
        var edgeData = [];

        var nodeDataHash = {};
        var edgeDataHash = {};

        // For each element.
        graph.get('cells').each(function(cell) {

            if (!(cell instanceof joint.dia.Element)) return;

            if (!nodeDataHash[cell.id]) {
                
                var node = {
                    id: cell.id,
                    inEdges: [],
                    outEdges: [],
                    width: cell.get('size').width,
                    height: cell.get('size').height
                };
                nodeData.push(node);
                nodeDataHash[cell.id] = node;
            }
        });

        // For each link.
        graph.get('cells').each(function(cell) {

            if (!(cell instanceof joint.dia.Link)) return;
            
            var sourceId = cell.get('source').id;
            var targetId = cell.get('target').id;

            var source = nodeDataHash[sourceId];
            var target = nodeDataHash[targetId];

            var edge;
            if (edgeDataHash[cell.id]) {

                edge = edgeDataHash[cell.id];
                
            } else {

                edge = { id: cell.id, source: source, target: target, label: 'fooedge' };
                edgeDataHash[cell.id] = edge;
                edgeData.push(edge);
            }
            
            if (!_.contains(source.outEdges, edge)) source.outEdges.push(edge);
            if (!_.contains(target.inEdges, edge)) target.inEdges.push(edge);
        });

        return {
            nodeData: nodeData,
            edgeData: edgeData
        };
    }
};
