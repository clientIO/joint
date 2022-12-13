(function eventsEventAttribute() {

    var namespace = joint.shapes;

    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-events-event-attribute'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 1,
        background: {
            color: 'white'
        },
        interactive: false,
        cellViewNamespace: namespace
    });

    var CustomElement = joint.dia.Element.define('examples.CustomElement', {
        attrs: {
            body: {
                width: 'calc(w)',
                height: 'calc(h)',
                strokeWidth: 2,
                stroke: 'black',
                fill: 'white'
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                x: 'calc(0.5*w)',
                y: 'calc(0.5*h)',
                fontSize: 14,
                fill: 'black'
            },
            button: {
                cursor: 'pointer',
                ref: 'buttonLabel',
                width: 'calc(1.5*w)',
                height: 'calc(1.5*h)',
                x: 'calc(x-calc(0.25*w))',
                y: 'calc(y-calc(0.25*h))'
            },
            buttonLabel: {
                pointerEvents: 'none',
                x: 'calc(w)',
                y: 0,
                textAnchor: 'middle',
                textVerticalAnchor: 'middle'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body',
        }, {
            tagName: 'text',
            selector: 'label'
        }, {
            tagName: 'rect',
            selector: 'button'
        }, {
            tagName: 'text',
            selector: 'buttonLabel'
        }]
    });

    var element = new CustomElement();
    element.position(250, 30);
    element.resize(100, 40);
    element.attr({
        label: {
            pointerEvents: 'none',
            visibility: 'visible',
            text: 'Element'
        },
        body: {
            cursor: 'default',
            visibility: 'visible'
        },
        button: {
            event: 'element:button:pointerdown',
            fill: 'orange',
            stroke: 'black',
            strokeWidth: 2
        },
        buttonLabel: {
            text: '＿', // fullwidth underscore
            fill: 'black',
            fontSize: 8,
            fontWeight: 'bold'
        }
    });
    element.addTo(graph);

    paper.on('element:button:pointerdown', function(elementView, evt) {
        evt.stopPropagation(); // stop any further actions with the element view (e.g. dragging)

        var model = elementView.model;

        if (model.attr('body/visibility') === 'visible') {
            model.attr('body/visibility', 'hidden');
            model.attr('label/visibility', 'hidden');
            model.attr('buttonLabel/text', '＋'); // fullwidth plus

        } else {
            model.attr('body/visibility', 'visible');
            model.attr('label/visibility', 'visible');
            model.attr('buttonLabel/text', '＿'); // fullwidth underscore
        }
    });
}());
