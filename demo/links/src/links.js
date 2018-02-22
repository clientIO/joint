// Demo with fancy link labels

var graph = new joint.dia.Graph();

var paper = new joint.dia.Paper({

    el: $('#paper'),
    width: 800,
    height: 600,
    model: graph,
    gridSize: 1
});

// custom link definition
var CustomLink = joint.dia.Link.define('examples.CustomLink', {
    defaultLabel: {
        attrs: { text: { text: '*' } }
    }
});

var link = new CustomLink({
    source: { x: 10, y: 20 },
    target: { x: 350, y: 20 }
});

/*
$rappid_green: #31d0c6;
$rappid_purple: #7c68fc;
$rappid_orange: #fe854f;
$rappid_orange2: #feb663;
$rappid_white: #f6f6f6;
$rappid_grey1: #222138;
$rappid_grey2: #33334e;
$rappid_grey3: #4b4a67;
$rappid_orange4: #3c4260;
$rappid_grey5: #6a6c8a;
$rappid_grey6: #c6c7e2;
$payne_grey: #3c4260;
*/

link.attr({
    '.connection': { stroke: '#222138' },
    '.marker-source': { fill: '#31d0c6', stroke: 'none', d: 'M 10 0 L 0 5 L 10 10 z' },
    '.marker-target': { fill: '#fe854f', stroke: '#7c68fc', d: 'M 10 0 L 0 5 L 10 10 z' }
});

var link2 = new CustomLink({
    source: { x: 10, y: 80 },
    target: { x: 350, y: 80 }
});

link2.attr({
    '.connection': { stroke: '#fe854f', 'stroke-width': 4 },
    '.marker-source': { stroke: '#fe854f', fill: '#fe854f', d: 'M 10 0 L 0 5 L 10 10 z' },
    '.marker-target': { stroke: '#fe854f', fill: '#fe854f', d: 'M 10 0 L 0 5 L 10 10 z' }
});

var link3 = new CustomLink({
    source: { x: 10, y: 140 },
    target: { x: 350, y: 140 }
});

link3.attr({
    '.connection': { stroke: '#31d0c6', 'stroke-width': 3, 'stroke-dasharray': '5 2' },
    '.marker-source': { stroke: '#31d0c6', fill: '#31d0c6', d: 'M5.5,15.499,15.8,21.447,15.8,15.846,25.5,21.447,25.5,9.552,15.8,15.152,15.8,9.552z' },
    '.marker-target': { stroke: '#31d0c6', fill: '#31d0c6', d: 'M4.834,4.834L4.833,4.833c-5.889,5.892-5.89,15.443,0.001,21.334s15.44,5.888,21.33-0.002c5.891-5.891,5.893-15.44,0.002-21.33C20.275-1.056,10.725-1.056,4.834,4.834zM25.459,5.542c0.833,0.836,1.523,1.757,2.104,2.726l-4.08,4.08c-0.418-1.062-1.053-2.06-1.912-2.918c-0.859-0.859-1.857-1.494-2.92-1.913l4.08-4.08C23.7,4.018,24.622,4.709,25.459,5.542zM10.139,20.862c-2.958-2.968-2.959-7.758-0.001-10.725c2.966-2.957,7.756-2.957,10.725,0c2.954,2.965,2.955,7.757-0.001,10.724C17.896,23.819,13.104,23.817,10.139,20.862zM5.542,25.459c-0.833-0.837-1.524-1.759-2.105-2.728l4.081-4.081c0.418,1.063,1.055,2.06,1.914,2.919c0.858,0.859,1.855,1.494,2.917,1.913l-4.081,4.081C7.299,26.982,6.379,26.292,5.542,25.459zM8.268,3.435l4.082,4.082C11.288,7.935,10.29,8.571,9.43,9.43c-0.858,0.859-1.494,1.855-1.912,2.918L3.436,8.267c0.58-0.969,1.271-1.89,2.105-2.727C6.377,4.707,7.299,4.016,8.268,3.435zM22.732,27.563l-4.082-4.082c1.062-0.418,2.061-1.053,2.919-1.912c0.859-0.859,1.495-1.857,1.913-2.92l4.082,4.082c-0.58,0.969-1.271,1.891-2.105,2.728C24.623,26.292,23.701,26.983,22.732,27.563z' }
});

var link4 = new CustomLink({
    source: { x: 400, y: 20 },
    target: { x: 740, y: 20 },
    router: { name: 'orthogonal' },
    vertices: [{ x: 500, y: 60 }, { x: 550, y: 40 }]
});

link4.attr({
    '.connection': { stroke: '#3c4260', 'stroke-width': 2 },
    '.marker-source': { fill: '#4b4a67', stroke: '#4b4a67', d: 'M5.5,15.499,15.8,21.447,15.8,15.846,25.5,21.447,25.5,9.552,15.8,15.152,15.8,9.552z' },
    '.marker-target': { fill: '#4b4a67', stroke: '#4b4a67', d: 'M5.5,15.499,15.8,21.447,15.8,15.846,25.5,21.447,25.5,9.552,15.8,15.152,15.8,9.552z' }
});

var link5 = new CustomLink({
    source: { x: 440, y: 100 },
    target: { x: 740, y: 100 },
    vertices: [{ x: 400, y: 140 }, { x: 550, y: 100 }, { x: 600, y: 140 }],
    smooth: true
});

link5.attr({
    '.connection': { stroke: '#7c68fc', 'stroke-width': 2 },
    '.marker-source': { stroke: '#7c68fc', fill: '#7c68fc', d: 'M24.316,5.318,9.833,13.682,9.833,5.5,5.5,5.5,5.5,25.5,9.833,25.5,9.833,17.318,24.316,25.682z' },
    '.marker-target': { stroke: '#feb663', fill: '#feb663', d: 'M14.615,4.928c0.487-0.986,1.284-0.986,1.771,0l2.249,4.554c0.486,0.986,1.775,1.923,2.864,2.081l5.024,0.73c1.089,0.158,1.335,0.916,0.547,1.684l-3.636,3.544c-0.788,0.769-1.28,2.283-1.095,3.368l0.859,5.004c0.186,1.085-0.459,1.553-1.433,1.041l-4.495-2.363c-0.974-0.512-2.567-0.512-3.541,0l-4.495,2.363c-0.974,0.512-1.618,0.044-1.432-1.041l0.858-5.004c0.186-1.085-0.307-2.6-1.094-3.368L3.93,13.977c-0.788-0.768-0.542-1.525,0.547-1.684l5.026-0.73c1.088-0.158,2.377-1.095,2.864-2.081L14.615,4.928z' }
});

var link6 = new CustomLink({
    source: { x: 10, y: 200 },
    target: { x: 350, y: 200 },
    attrs: {
        '.marker-source': { fill: '#4b4a67', stroke: '#4b4a67', d: 'M 10 0 L 0 5 L 10 10 z'},
        '.marker-target': { fill: '#4b4a67', stroke: '#4b4a67', d: 'M 10 0 L 0 5 L 10 10 z' }
    },
    labels: [
        {
            attrs: { text: { text: 'label' } },
            position: 0.5
        }
    ]
});

var link7 = new CustomLink({
    source: { x: 400, y: 200 },
    target: { x: 740, y: 200 },
    attrs: {
        '.marker-source': { fill: '#4b4a67', stroke: '#4b4a67', d: 'M 10 0 L 0 5 L 10 10 z' },
        '.marker-target': { fill: '#4b4a67', stroke: '#4b4a67', d: 'M 10 0 L 0 5 L 10 10 z' }
    },
    labels: [
        {
            attrs: {
                text: {
                    text: 'fancy label',
                    fill: '#f6f6f6',
                    fontFamily: 'sans-serif'
                },
                rect: {
                    stroke: '#7c68fc',
                    strokeWidth: 20,
                    rx: 5,
                    ry: 5
                }
            },
            position: 0.5
        }
    ]
});

var link8 = new CustomLink({
    source: { x: 10, y: 280 },
    target: { x: 740, y: 280 },
    vertices: [{ x: 150, y: 350 }, { x: 250, y: 350 }, { x: 250, y: 280 }, { x: 500, y: 280 }, { x: 500, y: 350 }, { x: 630, y: 350 }],
    smooth: true,
    attrs: {
        '.marker-source': { fill: '#4b4a67', stroke: '#4b4a67', d: 'M 10 0 L 0 5 L 10 10 z'},
        '.marker-target': { fill: '#4b4a67', stroke: '#4b4a67', d: 'M 10 0 L 0 5 L 10 10 z' }
    },
    labels: [
        {
            attrs: { text: { text: '1..n' } },
            position: 25
        },
        {
            attrs: {
                text: {
                    text: 'multiple',
                    fill: 'white',
                    fontFamily: 'sans-serif'
                },
                rect: {
                    stroke: '#31d0c6',
                    strokeWidth: 20,
                    rx: 5,
                    ry: 5
                }
            },
            position: 0.45,
        },
        {
            attrs: {
                text: {
                    text: 'labels',
                    fill: 'white',
                    fontFamily: 'sans-serif'
                },
                rect: {
                    stroke: '#31d0c6',
                    strokeWidth: 20,
                    rx: 5,
                    ry: 5
                }
            },
            position: 0.55
        },
        {
            position: -25
        }
    ]
});


graph.addCell([link, link2, link3, link4, link5, link6, link7, link8]);
