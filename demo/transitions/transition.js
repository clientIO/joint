var graph = new joint.dia.Graph;

new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 1,
    model: graph
});

var ball = new joint.shapes.standard.Circle({
    angle: 0,
    position: { x: -25, y: 50 },
    size: { width: 50, height: 50 },
    attrs: {
        label: {
            text: 'ball',
            fontSize: 20
        },
        body: {
            fill: '#FFFFFF'
        }
    }
});
graph.addCell(ball);

ball.transition('angle', 360, {
    delay: 1000,
    duration: 1000
});

ball.transition('position/x', 550, {
    delay: 1000,
    duration: 1000,
    timingFunction: joint.util.timing.reverse(joint.util.timing.quad)
});

ball.transition('position/y', 350, {
    delay: 1000,
    duration: 1000,
    timingFunction: joint.util.timing.reverse(joint.util.timing.bounce)
});

ball.transition('attrs/body/fill', '#FFFF00', {
    delay: 3000,
    duration: 500,
    valueFunction: joint.util.interpolate.hexColor
});

ball.transition('attrs/label', { text: 'yellow ball', fontSize: 8 }, {
    delay: 5000,
    duration: 2000,
    timingFunction: joint.util.timing.bounce,
    valueFunction: function(start, end) {
        return function(time) {
            return {
                text: end.text.substr(0, Math.ceil(end.text.length * time)),
                fontSize: start['font-size'] + (end['font-size'] - start['font-size']) * time
            };
        };
    }
});

var ufo = new joint.shapes.standard.Ellipse({
    angle: 0,
    position: { x: 400, y: 50 },
    size: { width: 35, height: 20 },
    attrs: {
        label: {
            text: 'u.f.o.',
            fontSize: 10
        },
        body: {
            fill: '#FFFFFF'
        }
    }
});
graph.addCell(ufo);

function fly(el) {
    el.transition('position', 20, {
        delay: 0,
        duration: 5000,
        valueFunction: function(a, b) {
            return function(t) {
                return {
                    x: a.x + 10 * b * (Math.cos(t * 2 * Math.PI) - 1),
                    y: a.y - b * Math.sin(t * 2 * Math.PI)
                };
            };
        }
    });
}

fly(ufo);

ufo.on('transition:end', fly);
