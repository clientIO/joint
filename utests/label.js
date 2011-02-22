title('Labeling capabilities');
description('Exhibition of labeling features.');
dimension(800, 1000);

var paper = Joint.paper('world', 800, 1000);

/**
 * No label.
 */

paper.circle(50, 50, 20).joint(paper.circle(220, 60, 30));

/**
 * 
 */

paper.circle(50, 130, 20).joint(paper.circle(220, 140, 30), { label: 'my label' });
paper.circle(50, 210, 20).joint(paper.circle(220, 220, 30), { label: 'my veeery loooooong label that could be even longer' } );
//paper.circle(50, 290, 20).joint(paper.circle(220, 300, 30), Joint.dia.uml.dependencyArrow);
//paper.circle(50, 370, 20).joint(paper.circle(220, 380, 30), Joint.dia.uml.aggregationArrow);

/**
 * label attributes
 */

paper.circle(300, 50, 20).joint(paper.circle(470, 60, 30), {
    label: 'my label',
    labelAttrs: {
        stroke: 'blue',
        'stroke-width': 1,
        'font-family': 'serif'
    }
});
paper.circle(300, 130, 20).joint(paper.circle(470, 140, 30), {
    label: 'my label',
    labelAttrs: {
        stroke: 'green',
        'stroke-width': 1,
        'font-family': 'sans-serif'
    }
});
paper.circle(300, 210, 20).joint(paper.circle(470, 220, 30), {
    label: 'my label',
    labelAttrs: {
        stroke: 'red',
        'stroke-width': 2,
        'font-family': 'serif',
        'font-size': 20
    }
});
paper.circle(300, 290, 20).joint(paper.circle(470, 300, 30), {
    label: 'my label',
    labelAttrs: {
        stroke: 'green',
        'stroke-width': 1,
        'font-family': 'serif',
        'font-size': 18,
        opacity: 0.5,
        rotation: 30
    }
});
paper.circle(300, 370, 20).joint(paper.circle(470, 380, 30), {
    label: 'my label',
    labelAttrs: {
        stroke: 'red',
        'stroke-width': 1,
        'font-family': 'serif',
        'font-size': 20,
        'stroke-dasharray': '-'
    }
});

/**
 * label box attributes.
 */

paper.circle(550, 50, 20).joint(paper.circle(720, 60, 30), {
    label: 'my label',
    labelAttrs: {
        stroke: 'blue',
        'stroke-width': 1,
        'font-family': 'serif'
    },
    labelBoxAttrs: {
        fill: 'yellow',
        stroke: 'black'
    }
});
paper.circle(550, 130, 20).joint(paper.circle(720, 140, 30), {
    label: 'my label',
    labelAttrs: {
        stroke: 'green',
        'stroke-width': 1,
        'font-family': 'sans-serif'
    },
    labelBoxAttrs: {
        fill: 'yellow',
        stroke: 'black',
        opacity: 0.2
    }
});
paper.circle(550, 210, 20).joint(paper.circle(720, 220, 30), {
    label: 'my label',
    labelAttrs: {
        stroke: 'red',
        'stroke-width': 2,
        'font-family': 'serif',
        'font-size': 20
    },
    labelBoxAttrs: {
        fill: 'yellow',
        stroke: 'black',
        'stroke-dasharray': '--'
    }
});
paper.circle(550, 290, 20).joint(paper.circle(720, 300, 30), {
    label: 'my label',
    labelAttrs: {
        stroke: 'green',
        'stroke-width': 1,
        'font-family': 'serif',
        'font-size': 18,
        opacity: 0.5,
        rotation: 30
    },
    labelBoxAttrs: {
        fill: 'yellow',
        stroke: 'black',
        rotation: 30
    }
});
paper.circle(550, 370, 20).joint(paper.circle(720, 380, 30), {
    label: 'my label',
    labelAttrs: {
        fill: '90-green-red',
        'font-size': 25
    },
    labelBoxAttrs: {
        fill: '90-#fff-#000'
    }
});

/**
 * label position
 */

paper.circle(50, 300, 20).joint(paper.circle(720, 500, 30), {
    label: 'my label',
    labelAttrs: {
        fill: '90-green-red',
        'font-size': 25
    },
    labelBoxAttrs: {
        fill: '90-#fff-#000'
    }
}).setVertices(['250 300', '70 370', '70 450', '250 350', '250 500']);


paper.circle(50, 550, 20).joint(paper.circle(720, 750, 30), {
    label: 'my label',
    labelAttrs: {
        fill: '90-green-red',
        'font-size': 25
    },
    labelBoxAttrs: {
        fill: '90-#fff-#000',
        padding: 10,
        r: 15
    }
}).setVertices(['250 550', '70 620', '70 700', '250 600', '250 750']).toggleSmoothing();

/**
 * multiple labels
 */

paper.circle(50, 950, 20).joint(paper.circle(720, 950, 30), {
    label: ['label 1', 'label 2', 'label 3', 'label 4'],
    labelAttrs: [
        { position: 50, fill: '90-green-red', 'font-size': 25 },
        { position: 1/3, fill: 'blue', 'font-size': 25 },
        { position: 2/3, fill: '90-green-red', 'font-size': 25 },
        { position: -50, fill: 'red', 'font-size': 25 }
    ],
    labelBoxAttrs: [
        { fill: 'lightgray' },
        { fill: 'yellow' }
    ]
}).setVertices(['70 850', '170 870', '270 850', '290 830', '300 900']);

