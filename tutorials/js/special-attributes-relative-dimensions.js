(function specialAttributesRelativeDimensions() {

    var namespace = joint.shapes;

    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    new joint.dia.Paper({
        el: document.getElementById('paper-special-attributes-relative-dimensions'),
        model: graph,
        width: 600,
        height: 300,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        },
        interactive: false,
        cellViewNamespace: namespace
    });

    var CustomElement = joint.dia.Element.define('examples.CustomElement', {
        attrs: {
            e: {
                strokeWidth: 1,
                stroke: '#000000',
                fill: 'rgba(255,0,0,0.3)'
            },
            r: {
                strokeWidth: 1,
                stroke: '#000000',
                fill: 'rgba(0,255,0,0.3)'
            },
            c: {
                strokeWidth: 1,
                stroke: '#000000',
                fill: 'rgba(0,0,255,0.3)'
            },
            outline: {
                x: 0,
                y: 0,
                width: 'calc(w)',
                height: 'calc(h)',
                strokeWidth: 1,
                stroke: '#000000',
                strokeDasharray: '5 5',
                strokeDashoffset: 2.5,
                fill: 'none'
            }
        }
    }, {
        markup: [{
            tagName: 'ellipse',
            selector: 'e'
        }, {
            tagName: 'rect',
            selector: 'r'
        }, {
            tagName: 'circle',
            selector: 'c'
        }, {
            tagName: 'rect',
            selector: 'outline'
        }]
    });

    var element = new CustomElement();
    element.attr({
        e: {
            rx: 'calc(0.5*w)',
            ry: 'calc(0.25*h)',
            cx: 0,
            cy: 'calc(0.25*h)'
        },
        r: {
            // additional x offset
            x: 'calc(w-10)',
            // additional y offset
            y: 'calc(h-10)',
            width: 'calc(0.5*w)',
            height: 'calc(0.5*h)'
        },
        c: {
            r: 'calc(0.5*d)',
            cx: 'calc(0.5*w)',
            cy: 'calc(0.5*h)'
        }
    });
    element.position(280, 130);
    element.resize(40, 40);
    element.addTo(graph);

    function contract(element) {
        element.transition('size', { width: 40, height: 40 }, {
            delay: 1000,
            duration: 4000,
            valueFunction: joint.util.interpolate.object
        });

        element.transition('position', { x: 280, y: 130 }, {
            delay: 1000,
            duration: 4000,
            valueFunction: joint.util.interpolate.object
        });

        element.stretchToggle = true;
    }

    function stretch(element) {
        element.transition('size', { width: 270, height: 100 }, {
            delay: 1000,
            duration: 4000,
            valueFunction: joint.util.interpolate.object
        });

        element.transition('position', { x: 165, y: 100 }, {
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
            else contract(element);
        }
    });
}());
