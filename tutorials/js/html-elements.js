(function() {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({ el: $('#paper-html-elements'), width: 650, height: 400, gridSize: 1, model: graph });

// Create a custom element.
// ------------------------

    joint.shapes.html = {};
    joint.shapes.html.Element = joint.shapes.basic.Rect.extend({
        defaults: joint.util.deepSupplement({
            type: 'html.Element',
            attrs: {
                rect: { stroke: 'none', 'fill-opacity': 0 }
            }
        }, joint.shapes.basic.Rect.prototype.defaults)
    });

// Create a custom view for that element that displays an HTML div above it.
// -------------------------------------------------------------------------

    joint.shapes.html.ElementView = joint.dia.ElementView.extend({

        template: [
            '<div class="html-element">',
            '<button class="delete">x</button>',
            '<label></label>',
            '<span></span>', '<br/>',
            '<select><option>--</option><option>one</option><option>two</option></select>',
            '<input type="text" value="I\'m HTML input" />',
            '</div>'
        ].join(''),

        initialize: function() {
            _.bindAll(this, 'updateBox');
            joint.dia.ElementView.prototype.initialize.apply(this, arguments);

            this.$box = $(_.template(this.template)());
            // Prevent paper from handling pointerdown.
            this.$box.find('input,select').on('mousedown click', function(evt) {
                evt.stopPropagation();
            });
            // This is an example of reacting on the input change and storing the input data in the cell model.
            this.$box.find('input').on('change', _.bind(function(evt) {
                this.model.set('input', $(evt.target).val());
            }, this));
            this.$box.find('select').on('change', _.bind(function(evt) {
                this.model.set('select', $(evt.target).val());
            }, this));
            this.$box.find('select').val(this.model.get('select'));
            this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));
            // Update the box position whenever the underlying model changes.
            this.model.on('change', this.updateBox, this);
            // Remove the box when the model gets removed from the graph.
            this.model.on('remove', this.removeBox, this);

            this.updateBox();
        },
        render: function() {
            joint.dia.ElementView.prototype.render.apply(this, arguments);
            this.paper.$el.prepend(this.$box);
            this.updateBox();
            return this;
        },
        updateBox: function() {
            // Set the position and dimension of the box so that it covers the JointJS element.
            var bbox = this.model.getBBox();
            // Example of updating the HTML with a data stored in the cell model.
            this.$box.find('label').text(this.model.get('label'));
            this.$box.find('span').text(this.model.get('select'));
            this.$box.css({
                width: bbox.width,
                height: bbox.height,
                left: bbox.x,
                top: bbox.y,
                transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)'
            });
        },
        removeBox: function(evt) {
            this.$box.remove();
        }
    });

// Create JointJS elements and add them to the graph as usual.
// -----------------------------------------------------------

    var el1 = new joint.shapes.html.Element({
        position: { x: 80, y: 80 },
        size: { width: 170, height: 100 },
        label: 'I am HTML',
        select: 'one'
    });
    var el2 = new joint.shapes.html.Element({
        position: { x: 370, y: 160 },
        size: { width: 170, height: 100 },
        label: 'Me too',
        select: 'two'
    });
    var l = new joint.dia.Link({
        source: { id: el1.id },
        target: { id: el2.id },
        attrs: { '.connection': { 'stroke-width': 5, stroke: '#34495E' } }
    });

    graph.addCells([el1, el2, l]);

}())
