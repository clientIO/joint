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

function times(n, cb) {
    Array.from({ length: n }).forEach((_, i) => cb(i));
}

times(36, function(index) {
    g6.addPort({ group: 'a', id: index + '', attrs: { text: { text: index }}});
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

var b1 = document.createElement('b');
b1.textContent = 'Click on Element to toggle port rotation compensation';
document.body.appendChild(b1);

var br1 = document.createElement('br');
document.body.appendChild(br1);

var button1 = document.createElement('button');
button1.textContent = '-';
button1.addEventListener('click', function() {
    var size = g6.get('size');
    g6.resize(Math.max(50, size.width - 50), size.height);
}, false);
document.body.appendChild(button1);

var button2 = document.createElement('button');
button2.textContent = '+';
button2.addEventListener('click', function() {
    var size = g6.get('size');
    g6.resize(size.width + 50, size.height);
}, false);
document.body.appendChild(button2);

var b2 = document.createElement('b');
b2.textContent = ' adjust width ';
document.body.appendChild(b2);

var br2 = document.createElement('br');
document.body.appendChild(br2);

var button3 = document.createElement('button');
button3.textContent = '-';
button3.addEventListener('click', function() {
    var size = g6.get('size');
    g6.resize(size.width, Math.max(50, size.height - 50));
}, false);
document.body.appendChild(button3);

var button4 = document.createElement('button');
button4.textContent = '+';
button4.addEventListener('click', function() {
    var size = g6.get('size');
    g6.resize(size.width, size.height + 50);
}, false);
document.body.appendChild(button4);

var b3 = document.createElement('b');
b3.textContent = ' adjust height ';
document.body.appendChild(b3);

var div = document.createElement('div');
div.innerHTML = '&nbsp;';
document.body.appendChild(div);
