(function(joint) {

    var fta = joint.shapes.fta;

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 900,
        height: 800,
        model: graph,
        defaultConnectionPoint: { name: 'boundary', args: { extrapolate: true }},
        defaultConnector: { name: 'rounded' },
        defaultRouter: { name: 'orthogonal' },
        async: true,
        interactive: false,
        frozen: true,
        sorting: joint.dia.Paper.sorting.APPROX
    });

    paper.on({
        'element:mouseenter': function(elementView) {
            var tools = new joint.dia.ToolsView({
                tools: [joint.elementTools.FTABoundary.factory()]
            });
            elementView.addTools(tools);
        },
        'element:mouseleave': function(elementView) {
            elementView.removeTools();
        },
        'element:gate:click': function(elementView) {
            var element = elementView.model;
            var gateType = element.gate();
            var gateTypes = Object.keys(element.gateTypes);
            var index = gateTypes.indexOf(gateType);
            var newIndex = (index + 1) % gateTypes.length;
            element.gate(gateTypes[newIndex]);
        }
    });

    function layout(graph) {
        var autoLayoutElements = [];
        var manualLayoutElements = [];
        graph.getElements().forEach(function(el) {
            if (el.get('type') === 'fta.ConditioningEvent') {
                manualLayoutElements.push(el);
            } else {
                autoLayoutElements.push(el);
            }
        });
        // Automatic Layout
        joint.layout.DirectedGraph.layout(graph.getSubgraph(autoLayoutElements), {
            setVertices: true,
            marginX: 20,
            marginY: 20
        });
        // Manual Layout
        manualLayoutElements.forEach(function(el) {
            var neighbor = graph.getNeighbors(el, { inbound: true })[0];
            if (!neighbor) return;
            var neighborPosition = neighbor.getBBox().bottomRight();
            el.position(neighborPosition.x + 20, neighborPosition.y - el.size().height / 2 - 20);
        });
    }

    // Original FTA Diagram: https://www.edrawsoft.com/templates/pdf/scaffolding-fall-fault-tree.pdf

    var events = [
        fta.IntermediateEvent.create('Fall from Scaffolding').gate('inhibit'),
        fta.IntermediateEvent.create('Fall from the Scaffolding', 'and').gate('and'),
        fta.IntermediateEvent.create('Safety Belt Not Working', 'or').gate('or'),
        fta.IntermediateEvent.create('Fall By Accident', 'or').gate('or'),
        fta.IntermediateEvent.create('Broken By Equipment', 'or').gate('or'),
        fta.IntermediateEvent.create('Did not Wear Safety Belt', 'or').gate('or'),
        fta.UndevelopedEvent.create('Slip and Fall'),
        fta.UndevelopedEvent.create('Lose Balance'),
        fta.UndevelopedEvent.create('Upholder Broken'),
        fta.BasicEvent.create('Safety Belt Broken'),
        fta.BasicEvent.create('Forgot to Wear'),
        fta.ExternalEvent.create('Take off When Walking'),
        fta.ConditioningEvent.create('Height and Ground Condition')
    ];

    var links = [
        fta.Link.create(events[0], events[1]),
        fta.Link.create(events[1], events[2]),
        fta.Link.create(events[1], events[3]),
        fta.Link.create(events[2], events[4]),
        fta.Link.create(events[2], events[5]),
        fta.Link.create(events[3], events[6]),
        fta.Link.create(events[3], events[7]),
        fta.Link.create(events[4], events[8]),
        fta.Link.create(events[4], events[9]),
        fta.Link.create(events[5], events[10]),
        fta.Link.create(events[5], events[11]),
        fta.Link.create(events[0], events[12])
    ];

    graph.resetCells(events.concat(links));

    layout(graph);

    paper.unfreeze();

})(joint);
