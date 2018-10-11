// Demo with orange elements

var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    width: 800,
    height: 1400,
    gridSize: 1,
    perpendicularLinks: false,
    elementView: joint.dia.ElementView.extend().extend({
        render: function() {
            console.log('!! no render');
        },
        onRender: function() {
            console.log('!!!no onrender');
        }
    }).extend({
        // render: function() {
        //     console.log('render');
        // },
        onRender: function() {
            console.count('onRender');
        },
        render: '5'
    })
});

x = new joint.shapes.standard.Rectangle();
x.addTo(graph);
