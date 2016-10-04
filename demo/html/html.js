(function(joint, $) {

    var graph = new joint.dia.Graph;
    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 650,
        height: 400,
        gridSize: 20,
        model: graph
    });


    // Create a custom element.
    // ------------------------

    joint.shapes.html = {};
    joint.shapes.html.Element = joint.shapes.basic.Generic.extend({
        markup: '<rect/>',
        defaults: _.defaultsDeep({
            type: 'html.Element',
            attrs: {
                rect: {
                    'ref-width': '100%',
                    'ref-height': '100%',
                    'stroke': 'gray'
                }
            }
        }, joint.shapes.basic.Generic.prototype.defaults)
    });

    // Create a custom view for that element that displays an HTML div above it.
    // -------------------------------------------------------------------------

    joint.shapes.html.ElementView = joint.dia.ElementView.extend({

        template: [
            '<div class="my-html-element">',
            '<label data-attribute="mylabel"></label>',
            '<input data-attribute="myinput" type="text"/>',
            '</div>'
        ].join(''),

        init: function() {

            // Update the box position whenever the underlying model changes.
            this.listenTo(this.model, 'change', this.updateBox);
        },

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

            // React on all box changes. e.g. input change
            $box.on('change', _.bind(this.onBoxChange, this));

            // Update the box size and position whenever the paper transformation changes.
            // Note: there is no paper yet on `init` method.
            this.listenTo(this.paper, 'scale', this.updateBox);

            $box.appendTo(this.paper.el);
            this.updateBox();

            return this;
        },

        updateBox: function() {

            // Set the position and the size of the box so that it covers the JointJS element
            // (taking the paper transformations into account).
            var bbox = this.getBBox({ useModelGeometry: true });
            var scale = V(this.paper.viewport).scale();

            this.$box.css({
                transform: 'scale(' + scale.sx + ',' + scale.sy + ')',
                transformOrigin: '0 0',
                width: bbox.width / scale.sx,
                height: bbox.height / scale.sy,
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
                    case 'LABEL':
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
