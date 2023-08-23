(function customElements() {

    var namespace = joint.shapes;

    var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    new joint.dia.Paper({
        el: document.getElementById('paper-custom-elements'),
        model: graph,
        width: 600,
        height: 400,
        cellViewNamespace: namespace
    });

    joint.dia.Element.define('standard.Rectangle', {
        attrs: {
            body: {
                width: 'calc(w)',
                height: 'calc(h)',
                strokeWidth: 2,
                stroke: '#000000',
                fill: '#FFFFFF'
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                x: 'calc(0.5*w)',
                y: 'calc(0.5*h)',
                fontSize: 14,
                fill: '#333333'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body',
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    joint.shapes.standard.Rectangle.define('examples.CustomRectangle', {
        attrs: {
            body: {
                rx: 10, // add a corner radius
                ry: 10,
                strokeWidth: 1,
                fill: 'cornflowerblue'
            },
            label: {
                textAnchor: 'left', // align text to left
                x: 10, // offset text from right edge of model bbox
                fill: 'white',
                fontSize: 18
            }
        }
    }, {
        // inherit joint.shapes.standard.Rectangle.markup
    }, {
        createRandom: function() {

            var rectangle = new this();

            var fill = '#' + ('000000' + Math.floor(Math.random() * 16777215).toString(16)).slice(-6);
            var stroke = '#' + ('000000' + Math.floor(Math.random() * 16777215).toString(16)).slice(-6);
            var strokeWidth = Math.floor(Math.random() * 6);
            var strokeDasharray = Math.floor(Math.random() * 6) + ' ' + Math.floor(Math.random() * 6);
            var radius = Math.floor(Math.random() * 21);

            rectangle.attr({
                body: {
                    fill: fill,
                    stroke: stroke,
                    strokeWidth: strokeWidth,
                    strokeDasharray: strokeDasharray,
                    rx: radius,
                    ry: radius
                },
                label: { // ensure visibility on dark backgrounds
                    fill: 'black',
                    stroke: 'white',
                    strokeWidth: 1,
                    fontWeight: 'bold'
                }
            });

            return rectangle;
        }
    });

    var rect = new joint.shapes.standard.Rectangle();
    rect.position(50, 25);
    rect.resize(500, 50);
    rect.attr({
        text: {
            text: 'shapes.standard.Rectangle()'
        }
    });
    rect.addTo(graph);

    var rect2 = new joint.shapes.standard.Rectangle();
    rect2.position(50, 125);
    rect2.resize(500, 50);
    rect2.attr({
        body: {
            rx: 10, // add a corner radius
            ry: 10,
            fill: '#ADD8E6'
        },
        label: {
            text: 'shapes.\nstandard.Rectangle()' // add Multiline label with Newline character
        }
    });
    rect2.addTo(graph);

    var rect3 = new joint.shapes.examples.CustomRectangle();
    rect3.position(50, 225);
    rect3.resize(500, 50);
    rect3.attr({
        label: {
            text: 'shapes.examples.CustomRectangle()'
        }
    });
    rect3.addTo(graph);

    var rect4 = joint.shapes.examples.CustomRectangle.createRandom();
    rect4.position(50, 325);
    rect4.resize(500, 50);
    rect4.attr({
        label: {
            text: 'shapes.examples.CustomRectangle.createRandom()'
        }
    });
    rect4.addTo(graph);
}());
