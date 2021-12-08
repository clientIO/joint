(function specialAttributesTextRelativeDimensions() {

    var namespace = joint.shapes;

    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    new joint.dia.Paper({
        el: document.getElementById('paper-special-attributes-text-relative-dimensions'),
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
                x: '-calc(0.5*w)',
                y: '-calc(0.5*h)',
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
            rx: 'calc(0.5*w)',
            ry: 'calc(0.25*h)',
            cx: '-calc(0.5*w)',
            cy: '-calc(0.25*h)'
        },
        r: {
            ref: 'label',
            // additional x offset
            x: 'calc(0.5*w-10)',
            // additional y offset
            y: 'calc(0.5*h-10)',
            width: 'calc(0.5*w)',
            height: 'calc(0.5*h)'
        },
        c: {
            ref: 'label',
            r: 'calc(0.5*d)'
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
                    return start + end.substr(1, Math.ceil(end.length * time));
                };
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
                };
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
            else untype(element);
        }
    });
}());
