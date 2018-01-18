(function basic(joint) {

    // Basics
    // ======

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-basic'),
        width: 600,
        height: 100,
        model: graph
    });

    // Initializing a built-in ready-to-use shape
    var rect1 = new joint.shapes.basic.Rect({
        position: { x: 100, y: 30 },
        size: { width: 100, height: 30 },
        attrs: {
            rect: { fill: 'blue' },
            text: { text: 'my box', fill: 'white' }
        }
    });

    // Cloning and re-positioning of a shape
    var rect2 = rect1.clone().translate(300);

    // Connecting 2 shapes from above with a link
    var link = new joint.dia.Link({
        source: { id: rect1.id },
        target: { id: rect2.id }
    });

    graph.addCells([rect1, rect2, link]);

    // Event Handling
    // ==============

    // All events triggered on a single cell (element or link)
    rect1.on('all', function() {
        console.log('rect1:' + arguments);
    });

    // All events triggered on the graph
    graph.on('all', function() {
        console.log('graph:', arguments);
    });

    // Specific event on a single cell
    rect1.on('change:position', function(rect1, position) {
        console.log('rect1:', position);
    });

    // Specific event on the graph
    graph.on('change:position', function(element, position) {
        console.log('graph:', element.id, ':', position);
    });

    // Option parameter (it's always passed as last argument).
    graph.on('change:myAttribute', function(cell, myAttribute, opt) {
        if (opt.consoleOutput) {
            console.log('option parameter:', myAttribute);
        }
    });
    rect1.set('myAttribute', 'I\'m visible', { consoleOutput: true });
    rect2.set('myAttribute', 'I\'m NOT visible', { consoleOutput: false });

}(joint));
