var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 800,
    height: 1200,
    gridSize: 10,
    perpendicularLinks: false,
    model: graph
});

$('#perpendicularLinks').on('change', function() {

    paper.options.perpendicularLinks = $(this).is(':checked') ? true : false;

});

var r1 = new joint.shapes.basic.Rect({
    position: { x: 335, y: 50 },
    size: { width: 70, height: 30 },
    attrs: {
        rect: { fill: 'orange' },
        text: { text: 'Box', magnet: true }
    }
});
graph.addCell(r1);


function title(x, y, text) {

    var el = new joint.shapes.basic.Text({
        position: { x: x, y: y },
        size: { width: text.length * 4, height: text.split('\n').length * 15 },
        attrs: {
            text: { text: text, 'font-size': 12, 'text-anchor': 'end' }
        }
    });

    graph.addCell(el);
}

// Default connection of two elements.
// -----------------------------------

title(250, 70, 'Default connection');

var r2 = r1.clone();
graph.addCell(r2);
r2.translate(300);

var link1 = new joint.dia.Link({

    source: { id: r1.id },
    target: { id: r2.id }
});

graph.addCell(link1);

// Custom .marker-source and .marker-target.
// -----------------------------------------

title(250, 150, 'Custom markers');

var r3 = r1.clone();
graph.addCell(r3);
r3.translate(0, 80);

var r4 = r3.clone();
graph.addCell(r4);
r4.translate(300);

var link2 = new joint.dia.Link({

    source: { id: r3.id },
    target: { id: r4.id },
    attrs: {
        '.marker-source': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        },
        '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        }
    }
});

graph.addCell(link2);


// Changing source and target selectors of the link.
// -------------------------------------------------

title(250, 230, 'Changing source and target selectors of a link');

var r5 = r3.clone();
graph.addCell(r5);
r5.translate(0, 80);

var r6 = r5.clone();
graph.addCell(r6);
r6.translate(300);

// Example on setting `magnet === false` on the overall element. In this case,
// only the text can be a target of a link for this specific element.
r6.attr({ '.': { magnet: false } });

var link3 = new joint.dia.Link({

    source: { id: r5.id },
    target: { id: r6.id, selector: 'text' },
    attrs: {
        '.marker-source': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        },
        '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        }
    }
});

graph.addCell(link3);


// Vertices.
// ---------

title(250, 310, 'Vertices');

var r7 = r5.clone();
graph.addCell(r7);
r7.translate(0, 80);

var r8 = r7.clone();
graph.addCell(r8);
r8.translate(300);

var link4 = new joint.dia.Link({

    source: { id: r7.id },
    target: { id: r8.id },
    vertices: [{ x: 370, y: 390 }, { x: 670, y: 390 }],
    attrs: {
        '.marker-source': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        },
        '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        }
    }
});

graph.addCell(link4);


// Custom vertex/connection markups. (ADVANCED)
// --------------------------------------------

title(250, 430, 'Customized vertex markers,\nvertex tools and marker elements');

var r9 = r7.clone();
graph.addCell(r9);
r9.translate(0, 120);

var r10 = r9.clone();
graph.addCell(r10);
r10.translate(300);

var link5 = new joint.dia.Link({

    source: { id: r9.id },
    target: { id: r10.id },
    vertices: [{ x: 370, y: 520 }, { x: 520, y: 570 }, { x: 670, y: 520 }],
    attrs: {
        '.connection': {
            'stroke-width': 4,
            'stroke-dasharray': [5, 5, 5],
            stroke: 'gray'
        },
        '.marker-source': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        },
        '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        }
    },
    markup: [
        '<path class="connection"/>',
        '<image class="marker-source" xlink:href="http://cdn3.iconfinder.com/data/icons/49handdrawing/24x24/left.png" width="25" height="25"/>',
        '<image class="marker-target" xlink:href="http://cdn3.iconfinder.com/data/icons/49handdrawing/24x24/left.png" width="25" height="25"/>',
        '<path class="connection-wrap"/>',
        '<g class="marker-vertices"/>'
    ].join(''),
    
    vertexMarkup: [
        '<g class="marker-vertex-group" transform="translate(<%= x %>, <%= y %>)">',
        '<image class="marker-vertex" idx="<%= idx %>" xlink:href="http://figurepool.com/images/logo.png" width="25" height="25" transform="translate(-12.5, -12.5)"/>',
        '<rect class="marker-vertex-remove-area" idx="<%= idx %>" fill="red" width="19.5" height="19" transform="translate(11, -26)" rx="3" ry="3" />',
        '<path class="marker-vertex-remove" idx="<%= idx %>" transform="scale(.8) translate(9.5, -37)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z">',
        '<title>Remove vertex.</title>',
        '</path>',
        '</g>'
    ].join('')
});

graph.addCell(link5);


title(250, 650, 'Labels');

var r11 = r10.clone();
graph.addCell(r11);
r11.translate(0, 230);

var r12 = r11.clone();
graph.addCell(r12);
r12.translate(-300);

var link6 = new joint.dia.Link({

    source: { id: r12.id },
    target: { id: r11.id },
    labels: [
        { position: 10, attrs: { text: { text: '1..n' } }},
        { position: .5, attrs: { text: { text: 'Foo', fill: 'white', 'font-family': 'sans-serif' }, rect: { stroke: '#F39C12', 'stroke-width': 20, rx: 5, ry: 5 } }},
        { position: -10, attrs: { text: { text: '*' } }}
    ],
    attrs: {
        '.marker-source': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        },
        '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        }
    }
});
graph.addCell(link6);


title(250, 750, 'Custom tools');

var r13 = r12.clone();
graph.addCell(r13);
r13.translate(0, 100);

var r14 = r13.clone();
graph.addCell(r14);
r14.translate(300);

var link7 = new joint.dia.Link({

    source: { id: r13.id },
    target: { id: r14.id },
    attrs: {
        '.marker-source': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        },
        '.marker-target': {
            d: 'M 10 0 L 0 5 L 10 10 z'
        }
    },
    toolMarkup: [
        '<g class="link-tool">',
        '<g class="tool-remove" event="remove">',
        '<circle r="11" />',
        '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"/>',
        '<title>Remove link.</title>',
        '</g>',
        '<g event="link:options">',
        '<circle r="11" transform="translate(25)"/>',
        '<path fill="white" transform="scale(.55) translate(29, -16)" d="M31.229,17.736c0.064-0.571,0.104-1.148,0.104-1.736s-0.04-1.166-0.104-1.737l-4.377-1.557c-0.218-0.716-0.504-1.401-0.851-2.05l1.993-4.192c-0.725-0.91-1.549-1.734-2.458-2.459l-4.193,1.994c-0.647-0.347-1.334-0.632-2.049-0.849l-1.558-4.378C17.165,0.708,16.588,0.667,16,0.667s-1.166,0.041-1.737,0.105L12.707,5.15c-0.716,0.217-1.401,0.502-2.05,0.849L6.464,4.005C5.554,4.73,4.73,5.554,4.005,6.464l1.994,4.192c-0.347,0.648-0.632,1.334-0.849,2.05l-4.378,1.557C0.708,14.834,0.667,15.412,0.667,16s0.041,1.165,0.105,1.736l4.378,1.558c0.217,0.715,0.502,1.401,0.849,2.049l-1.994,4.193c0.725,0.909,1.549,1.733,2.459,2.458l4.192-1.993c0.648,0.347,1.334,0.633,2.05,0.851l1.557,4.377c0.571,0.064,1.148,0.104,1.737,0.104c0.588,0,1.165-0.04,1.736-0.104l1.558-4.377c0.715-0.218,1.399-0.504,2.049-0.851l4.193,1.993c0.909-0.725,1.733-1.549,2.458-2.458l-1.993-4.193c0.347-0.647,0.633-1.334,0.851-2.049L31.229,17.736zM16,20.871c-2.69,0-4.872-2.182-4.872-4.871c0-2.69,2.182-4.872,4.872-4.872c2.689,0,4.871,2.182,4.871,4.872C20.871,18.689,18.689,20.871,16,20.871z"/>',
        '<title>Link options.</title>',
        '</g>',
        '</g>'
    ].join('')

});
graph.addCell(link7);

paper.on('link:options', function(evt, linkView, x, y) {

    alert('Opening options for link ' + linkView.model.id);
});


/*
// Uncomment just for fun.
var c = V('circle', { r: 8, fill: 'red' });
c.animateAlongPath({ dur: '4s', repeatCount: 'indefinite' }, paper.findViewByModel(link5).$('.connection')[0]);
V(paper.svg).append(c);
*/


// Manhattan routing.
// ------------------

title(250, 850, 'Manhattan routing');

var r15 = r13.clone();
graph.addCell(r15);
r15.translate(0, 100);

var r16 = r15.clone();
graph.addCell(r16);
r16.translate(300, 80);

var link8 = new joint.dia.Link({
    source: { id: r15.id },
    target: { id: r16.id },
    manhattan: true
});

graph.addCell(link8);
