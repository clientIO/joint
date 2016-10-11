(function() {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({ el: $('#paper-parent-expand'), width: 650, height: 250, gridSize: 1, model: graph });

    var r1 = new joint.shapes.basic.Rect({
        position: { x: 20, y: 20 },
        size: { width: 150, height: 150 },
        attrs: { rect: { fill: '#E74C3C' }, text: { text: 'Parent' } }
    });
    var r2 = new joint.shapes.basic.Rect({
        position: { x: 40, y: 25 },
        size: { width: 50, height: 40 },
        attrs: { rect: { fill: '#F1C40F' }, text: { text: 'Child' } }
    });
    var r3 = new joint.shapes.basic.Rect({
        position: { x: 110, y: 60 },
        size: { width: 50, height: 40 },
        attrs: { rect: { fill: '#9B59B6' }, text: { text: 'Child' } }
    });

    r1.embed(r2);
    r1.embed(r3);
    graph.addCells([r1, r2, r3]);

    graph.on('change:size', function(cell, newPosition, opt) {
        
        if (opt.skipParentHandler) return;
        
        if (cell.get('embeds') && cell.get('embeds').length) {
            // If we're manipulating a parent element, let's store
            // it's original size to a special property so that
            // we can shrink the parent element back while manipulating
            // its children.
            cell.set('originalSize', cell.get('size'));
        }
    });
    
    graph.on('change:position', function(cell, newPosition, opt) {

        if (opt.skipParentHandler) return;

        if (cell.get('embeds') && cell.get('embeds').length) {
            // If we're manipulating a parent element, let's store
            // it's original position to a special property so that
            // we can shrink the parent element back while manipulating
            // its children.
            cell.set('originalPosition', cell.get('position'));
        }
        
        var parentId = cell.get('parent');
        if (!parentId) return;

        var parent = graph.getCell(parentId);
        var parentBbox = parent.getBBox();

        if (!parent.get('originalPosition')) parent.set('originalPosition', parent.get('position'));
        if (!parent.get('originalSize')) parent.set('originalSize', parent.get('size'));
        
        var originalPosition = parent.get('originalPosition');
        var originalSize = parent.get('originalSize');
        
        var newX = originalPosition.x;
        var newY = originalPosition.y;
        var newCornerX = originalPosition.x + originalSize.width;
        var newCornerY = originalPosition.y + originalSize.height;
        
        _.each(parent.getEmbeddedCells(), function(child) {

            var childBbox = child.getBBox();
            
            if (childBbox.x < newX) { newX = childBbox.x; }
            if (childBbox.y < newY) { newY = childBbox.y; }
            if (childBbox.corner().x > newCornerX) { newCornerX = childBbox.corner().x; }
            if (childBbox.corner().y > newCornerY) { newCornerY = childBbox.corner().y; }
        });

        // Note that we also pass a flag so that we know we shouldn't adjust the
        // `originalPosition` and `originalSize` in our handlers as a reaction
        // on the following `set()` call.
        parent.set({
            position: { x: newX, y: newY },
            size: { width: newCornerX - newX, height: newCornerY - newY }
        }, { skipParentHandler: true });
    });
}());
