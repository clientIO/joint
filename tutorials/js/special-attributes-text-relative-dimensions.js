(function specialAttributesTextRelativeDimensions() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-special-attributes-text-relative-dimensions'),
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

    var CustomTextElement = joint.dia.Element.define('examples.CustomTextElement', {
        attrs: {
            label: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fontSize: 48
            },
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
                ref: 'label',
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
            tagName: 'text',
            selector: 'label'
        }, {
            tagName: 'rect',
            selector: 'outline'
        }]
    });

    var element = new CustomTextElement();
    element.attr({
        label: {
            text: 'H'
        },
        e: {
            ref: 'label',
            refRx: '50%',
            refRy: '25%',
            refCx: '50%',
            refCy: 0,
            refX: '-50%',
            refY: '25%'
        },
        r: {
            ref: 'label',
            refX: '100%',
            x: -10, // additional x offset
            refY: '100%',
            y: -10, // additional y offset
            refWidth: '50%',
            refHeight: '50%',
        },
        c: {
            ref: 'label',
            refRCircumscribed: '50%',
            // c is already centered at label anchor
        }
    });
    element.position(300, 150);
    element.addTo(graph);

    function type(element) {
        element.transition('attrs/label/text', 'Hello, World!', {
            delay: 1000,
            duration: 4000,
            valueFunction: function(start, end) {
                return function(time) {
                    return start + end.substr(1, Math.ceil(end.length * time))
                }
            }
        });

        element.typeToggle = false;
    }

    function untype(element) {
        element.transition('attrs/label/text', 'H', {
            delay: 1000,
            duration: 4000,
            timingFunction: function(time) {
                return (1 - time);
            },
            valueFunction: function(start, end) {
                return function(time) {
                    return end + start.substr(1, Math.ceil(start.length * time));
                }
            }
        });

        element.typeToggle = true;
    }

    element.currentTransitions = 0;
    element.typeToggle = true;

    type(element);

    element.on('transition:start', function(element) {
        element.currentTransitions += 1;
    });

    element.on('transition:end', function(element) {
        element.currentTransitions -= 1;

        if (element.currentTransitions === 0) {
            if (element.typeToggle) type(element);
            else untype(element)
        }
    });
}());
