import * as joint from '@joint/core';
import { DirectedGraph } from '@joint/layout-directed-graph';

function val(view, selector, val) {
    var el = view.el.querySelector(selector);
    if (!el) return null;
    if (val === undefined) {
        return el.value;
    }
    el.value = val;
}

var Shape = joint.dia.Element.define('demo.Shape', {
    z: 2,
    size: {
        width: 100,
        height: 50
    },
    attrs: {
        body: {
            width: 'calc(w)',
            height: 'calc(h)',
            fill: 'ivory',
            stroke: 'gray',
            strokeWidth: 2,
            rx: 10,
            ry: 10
        },
        label: {
            x: 'calc(w / 2)',
            y: 'calc(h / 2)',
            textVerticalAnchor: 'middle',
            textAnchor: 'middle',
            fontSize: 30
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }],

    setText: function(text) {
        return this.attr('label/text', text || '');
    }
});

var Link = joint.dia.Link.define('demo.Link', {
    attrs: {
        line: {
            connection: true,
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
    z: 1,
    weight: 1,
    minLen: 1,
    labelPosition: 'c',
    labelOffset: 10,
    labelSize: {
        width: 50,
        height: 30
    },
    labels: [{
        markup: [{
            tagName: 'rect',
            selector: 'labelBody'
        }, {
            tagName: 'text',
            selector: 'labelText'
        }],
        attrs: {
            labelText: {
                fill: 'gray',
                textAnchor: 'middle',
                y: 5,
                fontSize: 20,
                cursor: 'pointer'
            },
            labelBody: {
                fill: 'lightgray',
                stroke: 'gray',
                strokeWidth: 2,
                width: 'calc(w)',
                height: 'calc(h)',
                x: 'calc(-0.5 * w)',
                y: 'calc(-0.5 * h)',
                rx: 5,
                ry: 5
            }
        },
        size: {
            width: 50, height: 30
        }
    }]

}, {

    markup: [{
        tagName: 'path',
        selector: 'line',
        attributes: {
            'fill': 'none'
        }
    }],

    connect: function(sourceId, targetId) {
        return this.set({
            source: { id: sourceId },
            target: { id: targetId }
        });
    },

    setLabelText: function(text) {
        return this.prop('labels/0/attrs/labelText/text', text || '');
    }
});

var LayoutControls = joint.mvc.View.extend({

    events: {
        change: 'onChange',
        input: 'onChange'
    },

    options: {
        padding: 50
    },

    init: function() {

        var options = this.options;
        if (options.adjacencyList) {
            options.cells = this.buildGraphFromAdjacencyList(options.adjacencyList);
        }

        this.listenTo(options.paper.model, 'change', function(_, opt) {
            if (opt.layout) this.layout();
        });
    },

    onChange: function() {
        this.layout();
        this.trigger('layout');
    },

    layout: function() {

        var paper = this.options.paper;
        var graph = paper.model;
        var cells = this.options.cells;

        paper.freeze();

        DirectedGraph.layout(cells, this.getLayoutOptions());

        if (graph.getCells().length === 0) {
            // The graph could be empty at the beginning to avoid cells rendering
            // and their subsequent update when elements are translated
            graph.resetCells(cells);
        }

        paper.fitToContent({
            padding: this.options.padding,
            allowNewOrigin: 'any',
            useModelGeometry: true
        });

        paper.unfreeze();
    },

    getLayoutOptions: function() {
        return {
            setVertices: true,
            setLabels: true,
            ranker: val(this, '#ranker'),
            rankDir: val(this, '#rankdir'),
            align: val(this, '#align'),
            rankSep: parseInt(val(this, '#ranksep'), 10),
            edgeSep: parseInt(val(this, '#edgesep'), 10),
            nodeSep: parseInt(val(this, '#nodesep'), 10)
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


var template = document.getElementById('link-controls-template');
if (template.content) {
    template = template.content;
}

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
        this.constructor.refresh();
    },

    updateControls: function() {

        var link = this.options.cellView.model;

        val(this, '#labelpos', link.get('labelPosition'));
        val(this, '#labeloffset', link.get('labelOffset'));
        val(this, '#minlen', link.get('minLen'));
        val(this, '#weight', link.get('weight'));
    },

    getModelAttributes: function() {
        return {
            minLen: parseInt(val(this, '#minlen'), 10),
            weight: parseInt(val(this, '#weight'), 10),
            labelPosition: val(this, '#labelpos'),
            labelOffset: parseInt(val(this, '#labeloffset'), 10)
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
            el: this.template.cloneNode(true),
            cellView: linkView
        });
        document.getElementById('layout-controls').after(this.instance.el);
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

    template: template.querySelector('.controls')

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
