(function multiplePapers(joint, V) {

    function createElementPreview(color) {
        return joint.dia.ElementView.extend({
            renderMarkup: function() {
                // Always render a grayish rectangle
                this.velBody = V('rect', {
                    fill: color,
                    stroke: 'gray'
                }).appendTo(this.vel.empty());
            },
            resize: function() {
                // Always set the rectangle size to the size of the model
                this.velBody.attr(this.model.size());
            },
            update: function() {
                // Noop: we simply ignore all attrs attributes.
            }
        });
    }

    var Preview = createElementPreview('lightgray');
    var OtherPreview = createElementPreview('lightblue');

    var graph = new joint.dia.Graph;

    var paper1 = new joint.dia.Paper({
        el: document.getElementById('paper-multiple-papers-and-views'),
        width: 600,
        height: 100,
        model: graph
    });

    var paper2 = new joint.dia.Paper({
        el: document.getElementById('paper-multiple-papers-and-views-small'),
        width: 600,
        height: 100,
        model: graph,
        elementView: Preview
        /* An example how to use a different view based on the model
        elementView: function(element) {
            switch (element.get('type')) {
                case 'basic.Rect': return Preview;
                case 'basic.Circle': return OtherPreview;
                default: return null; // use default jointjs view otherwise
            }
        }
        */
    });

    var el1 = new joint.shapes.basic.Rect({
        position: { x: 100, y: 30 },
        size: { width: 100, height: 30 },
        attrs: {
            rect: { fill: 'blue' },
            text: { text: 'my box', fill: 'white' }
        }
    });

    var el2 = new joint.shapes.basic.Circle({
        position: { x: 400, y: 30 },
        size: { width: 50, height: 50 },
        attrs: {
            circle: { fill: 'blue' },
            text: { text: 'circle', fill: 'white' }
        }
    });
    
    var link = new joint.dia.Link({
        source: { id: el1.id },
        target: { id: el2.id }
    });

    graph.addCells([el1, el2, link]);

}(joint, V));
