var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 650,
    height: 400,
    gridSize: 20,
    model: graph
});


// Create a custom element.
// ------------------------

joint.shapes.html = {};
joint.shapes.html.Element = joint.shapes.basic.Rect.extend({
    defaults: _.defaultsDeep({ type: 'html.Element' }, joint.shapes.basic.Rect.prototype.defaults)
});

// Create a custom view for that element that displays an HTML div above it.
// -------------------------------------------------------------------------

joint.shapes.html.ElementView = joint.dia.ElementView.extend({

    template: [
        '<div class="my-html-element">',
        '<label>This is HTML</label>',
        '<input type="text" value="I\'m HTML input" />',
        '</div>'
    ].join(''),

    initialize: function() {
        _.bindAll(this, 'updateBox');
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        this.$box = $(joint.util.template(this.template)());
        // Prevent paper from handling pointerdown.
        this.$box.find('input').on('mousedown', function(evt) { evt.stopPropagation(); });
        // This is an example of reacting on the input change and storing the input data in the cell model.
        this.$box.find('input').on('change', _.bind(function(evt) {
            this.model.set('myinput', $(evt.target).val());
        }, this));
        // Update the box position whenever the underlying model changes.
        this.model.on('change', this.updateBox, this);
        // Remove the box when the model gets removed from the graph.
        this.model.on('remove', this.removeBox, this);
    },
    render: function() {
        joint.dia.ElementView.prototype.render.apply(this, arguments);
        this.paper.$el.append(this.$box);
        this.updateBox();
        return this;
    },
    updateBox: function() {
        // Set the position and the size of the box so that it covers the JointJS element.
        var bbox = this.getBBox();
        // Example of updating the HTML with a data stored in the cell model.
        this.$box.find('label').text(this.model.get('mylabel'));
        this.$box.css({ width: bbox.width + 2, height: bbox.height + 2, left: bbox.x, top: bbox.y });
    },
    removeBox: function(evt) {
        this.$box.remove();
    }
});

// Create JointJS elements and add them to the graph as usual.
// -----------------------------------------------------------

var el1 = new joint.shapes.html.Element({ position: { x: 80, y: 80 }, size: { width: 150, height: 80 }, mylabel: 'I am a label' });
var el2 = new joint.shapes.html.Element({ position: { x: 350, y: 150 }, size: { width: 150, height: 80 } });
var l = new joint.dia.Link({ source: { id: el1.id }, target: { id: el2.id } });

graph.addCells([el1, el2, l]);

// Highlighting
// ------------

$('#highlight').on('click', function() {

    var el1View = paper.findViewByModel(el1);
    var el2View = paper.findViewByModel(el2);
    var lView = paper.findViewByModel(l);

    el1View.$box.addClass('highlight');
    el2View.$box.addClass('highlight');
    lView.highlight();
});

$('#unhighlight').on('click', function() {

    var el1View = paper.findViewByModel(el1);
    var el2View = paper.findViewByModel(el2);
    var lView = paper.findViewByModel(l);

    el1View.$box.removeClass('highlight');
    el2View.$box.removeClass('highlight');
    lView.unhighlight();
});
