var graph = new joint.dia.Graph();

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 800,
    height: 600,
    gridSize: 1,
    model: graph
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
        name: "state 1",
        events: ["entry / init()","exit / destroy()"],
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
        name: "state 2",
        events: ["entry / create()","exit / kill()","A / foo()","B / bar()"],
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
        name: "state 3",
        events: ["entry / create()","exit / kill()"],
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
        name: "sub state 4",
        events: ["entry / create()"],
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
                stroke: "#4b4a67",
                'stroke-width': 2
            },
            '.inner': {
                fill: '#4b4a67'
            }
        }
    })

};
_.each(states, function(c) { graph.addCell(c); });

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
        attrs: {'.connection': linkAttrs }
    }),
    new uml.Transition({
        source: { id: states.s1.id },
        target: { id: states.s2.id },
        attrs: {'.connection': linkAttrs }
    }),
    new uml.Transition({
        source: { id: states.s1.id },
        target: { id: states.s3.id },
        attrs: {'.connection': linkAttrs }
    }),
    new uml.Transition({
        source: { id: states.s3.id },
        target: { id: states.s4.id },
        attrs: {'.connection': linkAttrs }
    }),
    new uml.Transition({
        source: { id: states.s2.id },
        target: { id: states.se.id },
        attrs: {'.connection': linkAttrs }
    })
];

graph.addCells(transitons);
