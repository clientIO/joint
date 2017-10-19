(function() {

    var Shape = joint.dia.Element.define('demo.Shape', {
        size: {
            width: 100,
            height: 50
        },
        attrs: {
            rect: {
                refWidth: '100%',
                refHeight: '100%',
                fill: 'ivory',
                stroke: 'gray',
                strokeWidth: 2,
                rx: 10,
                ry: 10
            },
            text: {
                refX: '50%',
                refY: '50%',
                yAlignment: 'middle',
                xAlignment: 'middle',
                fontSize: 30
            }
        }
    }, {
        markup: '<rect/><text/>',

        setText: function(text) {
            return this.attr('text/text', text || '');
        }
    });

    var Link = joint.dia.Link.define('demo.Link', {
        attrs: {
            '.connection': {
                stroke: 'gray',
                strokeWidth: 2,
                pointerEvents: 'none',
                targetMarker: {
                    type: 'path',
                    fill: 'gray',
                    stroke: 'none',
                    d: 'M 10 -10 0 0 10 10 z'
                }
            }
        },
        connector: {
            name: 'rounded'
        },
        z: -1,
        weight: 1,
        minLen: 1,
        labelPosition: 'c',
        labelOffset: 10,
        labelSize: {
            width: 50,
            height: 30
        },
        labels: [{
            markup: '<rect/><text/>',
            attrs: {
                text: {
                    fill: 'gray',
                    textAnchor: 'middle',
                    refY: 5,
                    refY2: '-50%',
                    fontSize: 20,
                    cursor: 'pointer'
                },
                rect: {
                    fill: 'lightgray',
                    stroke: 'gray',
                    strokeWidth: 2,
                    refWidth: '100%',
                    refHeight: '100%',
                    refX: '-50%',
                    refY: '-50%',
                    rx: 5,
                    ry: 5
                }
            },
            size: {
                width: 50, height: 30
            }
        }]

    }, {
        markup: '<path class="connection"/><g class="labels"/>',

        connect: function(sourceId, targetId) {
            return this.set({
                source: { id: sourceId },
                target: { id: targetId }
            });
        },

        setLabelText: function(text) {
            return this.prop('labels/0/attrs/text/text', text || '');
        }
    });

    var LayoutControls = joint.mvc.View.extend({

        events: {
            change: 'layout',
            input: 'layout'
        },

        options: {
            padding: 50
        },

        init: function() {

            var options = this.options;
            if (options.adjacencyList) {
                options.cells = this.buildGraphFromAdjacencyList(options.adjacencyList);
            }

            this.listenTo(options.paper.model, 'change', function(cell, opt) {
                if (opt.layout) {
                    this.layout();
                }
            });
        },

        layout: function() {

            var paper = this.options.paper;
            var graph = paper.model;
            var cells = this.options.cells;

            joint.layout.DirectedGraph.layout(cells, this.getLayoutOptions());

            if (graph.getCells().length === 0) {
                // The graph could be empty at the beginning to avoid cells rendering
                // and their subsequent update when elements are translated
                graph.resetCells(cells);
            }

            paper.fitToContent({
                padding: this.options.padding,
                allowNewOrigin: 'any'
            });

            this.trigger('layout');
        },

        getLayoutOptions: function() {
            return {
                setVertices: true,
                setLabels: true,
                ranker: this.$('#ranker').val(),
                rankDir: this.$('#rankdir').val(),
                align: this.$('#align').val(),
                rankSep: parseInt(this.$('#ranksep').val(), 10),
                edgeSep: parseInt(this.$('#edgesep').val(), 10),
                nodeSep: parseInt(this.$('#nodesep').val(), 10)
            };
        },

        buildGraphFromAdjacencyList: function(adjacencyList) {

            var elements = [];
            var links = [];

            Object.keys(adjacencyList).forEach(function(parentLabel) {
                // Add element
                elements.push(
                    new Shape({ id: parentLabel }).setText(parentLabel)
                );
                // Add links
                adjacencyList[parentLabel].forEach(function(childLabel) {
                    links.push(
                        new Link()
                            .connect(parentLabel, childLabel)
                            .setLabelText(parentLabel + '-' + childLabel)
                    );
                });
            });

            // Links must be added after all the elements. This is because when the links
            // are added to the graph, link source/target
            // elements must be in the graph already.
            return elements.concat(links);
        }

    });

    var LinkControls = joint.mvc.View.extend({

        highlighter: {
            name: 'stroke',
            options: {
                attrs: {
                    'stroke': 'lightcoral',
                    'stroke-width': 4
                }
            }
        },

        events: {
            change: 'updateLink',
            input: 'updateLink'
        },

        init: function() {
            this.highlight();
            this.updateControls();
        },

        updateLink: function() {
            this.options.cellView.model.set(this.getModelAttributes(), { layout: true });
        },

        updateControls: function() {

            var link = this.options.cellView.model;

            this.$('#labelpos').val(link.get('labelPosition'));
            this.$('#labeloffset').val(link.get('labelOffset'));
            this.$('#minlen').val(link.get('minLen'));
            this.$('#weight').val(link.get('weight'));
        },

        getModelAttributes: function() {
            return {
                minLen: parseInt(this.$('#minlen').val(), 10),
                weight: parseInt(this.$('#weight').val(), 10),
                labelPosition: this.$('#labelpos').val(),
                labelOffset: parseInt(this.$('#labeloffset').val(), 10)
            };
        },

        onRemove: function() {
            this.unhighlight();
        },

        highlight: function() {
            this.options.cellView.highlight('rect', { highlighter: this.highlighter });
        },

        unhighlight: function() {
            this.options.cellView.unhighlight('rect', { highlighter: this.highlighter });
        }

    }, {

        create: function(linkView) {
            this.remove();
            this.instance = new this({
                el: this.template.cloneNode(true).getElementById('link-controls'),
                cellView: linkView
            });
            this.instance.$el.insertAfter('#layout-controls');
        },

        remove: function() {
            if (this.instance) {
                this.instance.remove();
                this.instance = null;
            }
        },

        refresh: function() {
            if (this.instance) {
                this.instance.unhighlight();
                this.instance.highlight();
            }
        },

        instance: null,

        template: document.getElementById('link-controls-template').content

    });

    var controls = new LayoutControls({
        el: document.getElementById('layout-controls'),
        paper: new joint.dia.Paper({
            el: document.getElementById('paper'),
            interactive: function(cellView) {
                return cellView.model.isElement();
            }
        }).on({
            'link:pointerdown': LinkControls.create,
            'blank:pointerdown element:pointerdown': LinkControls.remove
        }, LinkControls),
        adjacencyList: {
            a: ['b','c','d'],
            b: ['d', 'e'],
            c: [],
            d: [],
            e: ['e'],
            f: [],
            g: ['b','i'],
            h: ['f'],
            i: ['f','h']
        }
    }).on({
        'layout': LinkControls.refresh
    }, LinkControls);

    controls.layout();

})(joint);
