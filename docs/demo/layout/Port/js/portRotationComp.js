var paper6 = createPaper();

var g6 = new joint.shapes.basic.Circle({
    position: { x: 50, y: 50 },
    size: { width: 500, height: 300 },
    attrs: {
        text: { text: 'compensateRotation: true', fill: '#6a6c8a' },
        circle: { stroke: '#31d0c6', 'stroke-width': 2 }
    },
    ports: {
        groups: {
            'a': {
                position: {
                    name: 'ellipseSpread',
                    args: { startAngle: 0, dr: 0, compensateRotation: true }
                },
                label: {
                    position: 'radial'
                },
                attrs: {
                    rect: {
                        stroke: '#31d0c6',
                        'stroke-width': 2,
                        width: 20,
                        height: 20,
                        x: -10,
                        y: -10
                    },
                    '.dot': {
                        fill: '#fe854f',
                        r: 2
                    },
                    text: {
                        fill: '#6a6c8a'
                    }
                },
                markup: '<g><rect/><circle class="dot"/></g>'
            }
        }
    }
});

_.times(36, function(index) {
    g6.addPort({ group: 'a', id: index + '', attrs: { text: { text: index } } });
});

paper6.model.addCell(g6);
paper6.on('cell:pointerclick', function(cellView, e) {

    if (cellView.model.isLink() || !cellView.model.hasPorts()) {
        return;
    }

    var current = cellView.model.prop('ports/groups/a/position/args/compensateRotation');
    cellView.model.prop('attrs/text/text', 'compensateRotation: ' + !current);
    cellView.model.prop('ports/groups/a/position/args/compensateRotation', !current);
});

$('<b/>').text('Click on Element to toggle port rotation compensation').appendTo('body');
$('<br/>').appendTo('body');

$('<button/>').text('-').appendTo('body').on('click', function() {
    var size = g6.get('size');
    g6.resize(Math.max(50, size.width - 50), size.height);
});
$('<button/>').text('+').appendTo('body').on('click', function() {
    var size = g6.get('size');
    g6.resize(size.width + 50, size.height);
});
$('<b/>').text(' adjust width ').appendTo('body');
$('<br/>').appendTo('body');

$('<button/>').text('-').appendTo('body').on('click', function() {
    var size = g6.get('size');
    g6.resize(size.width, Math.max(50, size.height - 50));
});
$('<button/>').text('+').appendTo('body').on('click', function() {
    var size = g6.get('size');
    g6.resize(size.width, size.height + 50);
});
$('<b/>').text(' adjust height ').appendTo('body');
$('<div/>').html('&nbsp;').appendTo('body');

