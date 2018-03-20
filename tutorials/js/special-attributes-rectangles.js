(function specialAttributesRectangles() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-special-attributes-rectangles'),
        model: graph,
        width: 600,
        height: 300,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        },
        interactive: true
    });

    var DoubleRectangle = joint.dia.Element.define('examples.DoubleRectangle', {
        attrs: {
            rect: {
                strokeWidth: 1,
                stroke: '#000000'
            },
            rectangle: {
                fill: 'rgba(255,0,0,0.3)'
            },
            rectangle2: {
                fill: 'rgba(0,0,255,0.3)'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'rectangle',
        }, {
            tagName: 'rect',
            selector: 'rectangle2'
        }]
    });

    var element = new DoubleRectangle({
        attrs: {
            rectangle: {
                width: 50,
                height: 50
            },
            rectangle2: {
                ref: 'rectangle',
                refWidth: '50%',
                refHeight: '50%'
            }
        }
    });
    element.position(275, 125);
    element.resize(100, 100);
    element.addTo(graph);

    function contract(element) {
        element.transition('attrs/rectangle/width', 50, {
            delay: 1000,
            duration: 4000
        });

        element.transition('attrs/rectangle/height', 50, {
            delay: 1000,
            duration: 4000
        });

        element.transition('position', { x: 275, y: 125 }, {
            delay: 1000,
            duration: 4000,
            valueFunction: joint.util.interpolate.object
        });

        element.stretchToggle = true;
    }

    function stretch(element) {
        element.transition('attrs/rectangle/width', 400, {
            delay: 1000,
            duration: 4000
        });

        element.transition('attrs/rectangle/height', 100, {
            delay: 1000,
            duration: 4000
        });

        element.transition('position', { x: 100, y: 100 }, {
            delay: 1000,
            duration: 4000,
            valueFunction: joint.util.interpolate.object
        });

        element.stretchToggle = false;
    }

    element.currentTransitions = 0;
    element.stretchToggle = false;

    stretch(element);

    element.on('transition:start', function(element) {
        element.currentTransitions += 1;
    });

    element.on('transition:end', function(element) {
        element.currentTransitions -= 1;

        if (element.currentTransitions === 0) {
            if (element.stretchToggle) stretch(element);
            else contract(element)
        }
    });
}());
