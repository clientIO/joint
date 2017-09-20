(function(joint, $) {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 650,
        height: 400,
        gridSize: 20,
        model: graph,
        linkConnectionPoint: joint.util.shapePerimeterConnectionPoint
    });

    // Render group for all html views inside the paper
    paper.$htmlViews = $('<div>').addClass('html-views').appendTo(paper.el);
    // Update the group transformation based on the current paper scale
    paper.on('scale', function(sx, sy) {
        this.$htmlViews.css({
            transform: 'scale(' + [sx,sy] + ')',
            transformOrigin: '0 0'
        });
    });
    // Create a custom element.
    // ------------------------

    joint.dia.Element.define('html.Element', {
        markup: '<g class="rotatable"><rect/></g>',
        attrs: {
            rect: {
                refWidth: '100%',
                refHeight: '100%',
                stroke: 'gray'
            }
        }
    });

    // Create a custom view for that element that displays an HTML div above it.
    // -------------------------------------------------------------------------

    joint.shapes.html.ElementView = joint.dia.ElementView.extend({

        template: [
            '<div class="my-html-element">',
            '<div data-attribute="mylabel"></div>',
            '<input data-attribute="myinput" type="text"/>',
            '<i data-attribute="myinput"></i>',
            '<div class="delete">x</div>',
            '</div>',
        ].join(''),

        onBoxChange: function(evt) {

            var input = evt.target;
            var attribute = input.dataset.attribute;
            if (attribute) {
                this.model.set(attribute, input.value);
            }
        },

        onRender: function() {

            if (this.$box) this.$box.remove();

            var boxMarkup = joint.util.template(this.template)();
            var $box = this.$box = $(boxMarkup);

            this.$attributes = $box.find('[data-attribute]');

            this.bindEvents();

            $box.appendTo(this.paper.$htmlViews);

            this.updateBox();

            return this;
        },

        bindEvents: function() {

            var $box = this.$box;

            // React on all box changes. e.g. input change
            $box.on('change', this.onBoxChange.bind(this));
            $box.on('mousedown', '.delete', this.onDelete.bind(this));

            // Update the box position whenever the underlying model changes.
            this.listenTo(this.model, 'change', this.updateBox);
        },

        updateBox: function() {

            // Set the position and the size of the box so that it covers the JointJS element
            var bbox = this.model.getBBox();
            var angle = this.model.get('angle');

            this.$box.css({
                transform: 'rotate(' + angle + 'deg)',
                width: bbox.width,
                height: bbox.height,
                left: bbox.x,
                top: bbox.y
            });

            this.updateAttributes();
        },

        updateAttributes: function() {

            var model = this.model;

            this.$attributes.each(function() {

                var value = model.get(this.dataset.attribute);

                switch (this.tagName.toUpperCase()) {
                    case 'DIV':
                    case 'I':
                        this.textContent = value;
                        break;
                    case 'INPUT':
                        this.value = value;
                        break;
                }
            });
        },

        onRemove: function() {

            this.$box.remove();
        },

        onDelete: function() {

            this.model.remove();
        }

    });

    // Create JointJS elements and add them to the graph as usual.
    // -----------------------------------------------------------

    var el1 = new joint.shapes.html.Element({
        position: { x: 80, y: 80 },
        size: { width: 150, height: 80 },
        myinput: 'I am an input',
        mylabel: 'I am a label'
    });

    var el2 = new joint.shapes.html.Element({
        position: { x: 350, y: 150 },
        size: { width: 150, height: 80 },
        myinput: 'I am HTML input',
        mylabel: 'I am HTML label'
    });

    var l = new joint.dia.Link({
        source: { id: el1.id },
        target: { id: el2.id }
    });

    el1.rotate(45);

    graph.addCells([el1, el2, l]);

    // Zooming
    // ------------

    var zoomLevel = 1;

    $('#zoom-in').on('click', function() {
        zoomLevel = Math.min(3, zoomLevel + 0.2);
        paper.scale(zoomLevel, zoomLevel);
    });

    $('#zoom-out').on('click', function() {
        zoomLevel = Math.max(0.2, zoomLevel - 0.2);
        paper.scale(zoomLevel, zoomLevel);
    });

})(joint, $);
