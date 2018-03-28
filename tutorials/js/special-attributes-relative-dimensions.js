(function specialAttributesRelativeDimensions() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-special-attributes-relative-dimensions'),
        model: graph,
        width: 600,
        height: 300,
        gridSize: 10,
        drawGrid: true,
        background: {
            color: 'rgba(0, 255, 0, 0.3)'
        },
        interactive: false
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
                refX: 0,
                refY: 0,
                refWidth: '100%',
                refHeight: '100%',
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
            refRx: '50%',
            refRy: '25%',
            refCx: '50%',
            refCy: 0,
            refX: '-50%',
            refY: '25%'
        },
        r: {
            refX: '100%',
            x: -10, // additional x offset
            refY: '100%',
            y: -10, // additional y offset
            refWidth: '50%',
            refHeight: '50%',
        },
        c: {
            refRCircumscribed: '50%',
            refCx: '50%',
            refCy: '50%'
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
            else contract(element)
        }
    });
}());
