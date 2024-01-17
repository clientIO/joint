const State = joint.dia.Element.define('uml.State', {
    attrs: {
        '.uml-state-body': {
            'width': 200, 'height': 200, 'rx': 10, 'ry': 10,
            'fill': '#ecf0f1', 'stroke': '#bdc3c7', 'stroke-width': 3
        },
        '.uml-state-separator': {
            'stroke': '#bdc3c7', 'stroke-width': 2
        },
        '.uml-state-name': {
            'ref': '.uml-state-body', 'ref-x': .5, 'ref-y': 5, 'text-anchor': 'middle',
            'fill': '#000000', 'font-family': 'Courier New', 'font-size': 14
        },
        '.uml-state-events': {
            'ref': '.uml-state-separator', 'ref-x': 5, 'ref-y': 5,
            'fill': '#000000', 'font-family': 'Courier New', 'font-size': 14
        }
    },

    name: 'State',
    events: []

}, {
    useCSSSelectors: true,
    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<rect class="uml-state-body"/>',
        '</g>',
        '<path class="uml-state-separator"/>',
        '<text class="uml-state-name"/>',
        '<text class="uml-state-events"/>',
        '</g>'
    ].join(''),

    initialize: function() {

        this.on({
            'change:name': this.updateName,
            'change:events': this.updateEvents,
            'change:size': this.updatePath
        }, this);

        this.updateName();
        this.updateEvents();
        this.updatePath();

        joint.dia.Element.prototype.initialize.apply(this, arguments);
    },

    updateName: function() {

        this.attr('.uml-state-name/text', this.get('name'));
    },

    updateEvents: function() {

        this.attr('.uml-state-events/text', this.get('events').join('\n'));
    },

    updatePath: function() {

        var d = 'M 0 20 L ' + this.get('size').width + ' 20';

        // We are using `silent: true` here because updatePath() is meant to be called
        // on resize and there's no need to to update the element twice (`change:size`
        // triggers also an update).
        this.attr('.uml-state-separator/d', d, { silent: true });
    }
});

const StartState = joint.dia.Element.define('uml.StartState', {
    size: { width: 60, height: 60 },
    attrs: {
        'circle': {
            r: 30,
            cx: 30,
            cy: 30,
            'fill': '#34495e',
            'stroke': '#2c3e50',
            'stroke-width': 2,
            'rx': 1
        },
        'text': {
            'font-size': 14,
            text: '',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': .5,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Arial, helvetica, sans-serif'
        }
    }
}, {
    useCSSSelectors: true,
    markup: '<g class="rotatable"><g class="scalable"><circle/></g><text/></g>',
});

const EndState = joint.dia.Element.define('uml.EndState', {
    size: { width: 20, height: 20 },
    attrs: {
        'circle.outer': {
            transform: 'translate(10, 10)',
            r: 10,
            fill: '#ffffff',
            stroke: '#2c3e50'
        },

        'circle.inner': {
            transform: 'translate(10, 10)',
            r: 6,
            fill: '#34495e'
        }
    }
}, {
    useCSSSelectors: true,
    markup: '<g class="rotatable"><g class="scalable"><circle class="outer"/><circle class="inner"/></g></g>',
});

const Transition = joint.dia.Link.define('uml.Transition', {
    attrs: {
        '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z', fill: '#34495e', stroke: '#2c3e50' },
        '.connection': { stroke: '#2c3e50' }
    }
}, {
    useCSSSelectors: true
});

const shapes = { ...joint.shapes, uml: { State, StartState, EndState, Transition }};

var graph = new joint.dia.Graph({}, { cellNamespace: shapes });

new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 800,
    height: 600,
    gridSize: 1,
    model: graph,
    cellViewNamespace: shapes,
    linkView: joint.dia.LegacyLinkView,
});

var uml = joint.shapes.uml;

var states = {

    s0: new uml.StartState({
        position: { x:20  , y: 20 },
        size: { width: 30, height: 30 },
        attrs: {
            'circle': {
                fill: '#4b4a67',
                stroke: 'none'
            }
        }
    }),

    s1: new uml.State({
        position: { x:100  , y: 100 },
        size: { width: 200, height: 100 },
        name: 'state 1',
        events: ['entry / init()','exit / destroy()'],
        attrs: {
            '.uml-state-body': {
                fill: 'rgba(48, 208, 198, 0.1)',
                stroke: 'rgba(48, 208, 198, 0.5)',
                'stroke-width': 1.5
            },
            '.uml-state-separator': {
                stroke: 'rgba(48, 208, 198, 0.4)'
            }
        }
    }),

    s2: new uml.State({
        position: { x:400  , y: 200 },
        size: { width: 300, height: 300 },
        name: 'state 2',
        events: ['entry / create()','exit / kill()','A / foo()','B / bar()'],
        attrs: {
            '.uml-state-body': {
                fill: 'rgba(48, 208, 198, 0.1)',
                stroke: 'rgba(48, 208, 198, 0.5)',
                'stroke-width': 1.5
            },
            '.uml-state-separator': {
                stroke: 'rgba(48, 208, 198, 0.4)'
            }
        }
    }),

    s3: new uml.State({
        position: { x:130  , y: 400 },
        size: { width: 160, height: 60 },
        name: 'state 3',
        events: ['entry / create()','exit / kill()'],
        attrs: {
            '.uml-state-body': {
                fill: 'rgba(48, 208, 198, 0.1)',
                stroke: 'rgba(48, 208, 198, 0.5)',
                'stroke-width': 1.5
            },
            '.uml-state-separator': {
                stroke: 'rgba(48, 208, 198, 0.4)'
            }
        }
    }),

    s4: new uml.State({
        position: { x:530  , y: 400 },
        size: { width: 160, height: 50 },
        name: 'sub state 4',
        events: ['entry / create()'],
        attrs: {
            '.uml-state-body': {
                fill: 'rgba(48, 208, 198, 0.1)',
                stroke: 'rgba(48, 208, 198, 0.5)',
                'stroke-width': 1.5
            },
            '.uml-state-separator': {
                stroke: 'rgba(48, 208, 198, 0.4)'
            }
        }
    }),

    se: new uml.EndState({
        position: { x:750  , y: 550 },
        size: { width: 30, height: 30 },
        attrs: {
            '.outer': {
                stroke: '#4b4a67',
                'stroke-width': 2
            },
            '.inner': {
                fill: '#4b4a67'
            }
        }
    })

};
Object.keys(states).forEach(function(key) {
    graph.addCell(states[key]);
});

states.s2.embed(states.s4);

var linkAttrs =  {
    'fill': 'none',
    'stroke-linejoin': 'round',
    'stroke-width': '2',
    'stroke': '#4b4a67'
};

var transitons = [
    new uml.Transition({
        source: { id: states.s0.id },
        target: { id: states.s1.id },
        attrs: { '.connection': linkAttrs }
    }),
    new uml.Transition({
        source: { id: states.s1.id },
        target: { id: states.s2.id },
        attrs: { '.connection': linkAttrs }
    }),
    new uml.Transition({
        source: { id: states.s1.id },
        target: { id: states.s3.id },
        attrs: { '.connection': linkAttrs }
    }),
    new uml.Transition({
        source: { id: states.s3.id },
        target: { id: states.s4.id },
        attrs: { '.connection': linkAttrs }
    }),
    new uml.Transition({
        source: { id: states.s2.id },
        target: { id: states.se.id },
        attrs: { '.connection': linkAttrs }
    })
];

graph.addCells(transitons);
