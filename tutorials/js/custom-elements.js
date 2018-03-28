(function customElements() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-custom-elements'),
        model: graph,
        width: 600,
        height: 300
    });

    joint.shapes.standard.Rectangle.define('examples.CustomRectangle', {
        attrs: {
            body: {
                rx: 10,
                ry: 10,
                strokeWidth: 1,
                fill: 'orange'
            },
            button: {
                event: 'element:button-pressed',
                cursor: 'pointer',
                refCx: '100%',
                cy: 0,
                r: 10,
                strokeWidth: 1,
                stroke: 'black',
                fill: 'red'
            },
            label: {
                textAnchor: 'left',
                refX: 10,
                fill: 'black',
                fontWeight: 'bold'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }, {
            tagName: 'circle',
            selector: 'button'
        }]
    }, {
        createRandom: function() {

            function randomColor() {

                var color = {};
                color.r = Math.floor(Math.random() * 256);
                color.g = Math.floor(Math.random() * 256);
                color.b = Math.floor(Math.random() * 256);
                return color;
            }

            function invertColor(color) {

                var inverted = {};
                inverted.r = Math.abs(color.r - 255);
                inverted.g = Math.abs(color.g - 255);
                inverted.b = Math.abs(color.b - 255);
                return inverted;
            }

            function colorString(color) {

                return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
            }

            var rectangle = new joint.shapes.examples.CustomRectangle();

            var fillColor = randomColor();
            var strokeColor = randomColor();
            var labelColor = invertColor(fillColor);

            var fill = colorString(fillColor);
            var stroke = colorString(strokeColor);
            var strokeWidth = Math.floor(Math.random() * 6);
            var strokeDasharray = Math.floor(Math.random() * 6) + ' ' + Math.floor(Math.random() * 6);
            var radius = Math.floor(Math.random() * 21);
            var labelFill = colorString(labelColor);

            rectangle.attr({
                body: {
                    fill: fill,
                    stroke: stroke,
                    strokeWidth: strokeWidth,
                    strokeDasharray: strokeDasharray,
                    rx: radius,
                    ry: radius
                },
                label: {
                    fill: labelFill
                }
            });

            return rectangle;
        }
    });

    var rect = new joint.shapes.standard.Rectangle();
    rect.position(100, 30);
    rect.resize(400, 40);
    rect.attr({
        text: {
            text: 'shapes.standard.Rectangle()'
        }
    });
    rect.addTo(graph);

    var rect2 = new joint.shapes.examples.CustomRectangle();
    rect2.position(100, 130);
    rect2.resize(400, 40);
    rect2.attr({
        label: {
            text: 'shapes.examples.CustomRectangle()'
        }
    });
    rect2.addTo(graph);

    var rect3 = joint.shapes.examples.CustomRectangle.createRandom();
    rect3.position(100, 230);
    rect3.resize(400, 40);
    rect3.attr({
        label: {
            text: 'shapes.examples.CustomRectangle.createRandom()'
        }
    });
    rect3.addTo(graph);

    paper.on('element:button-pressed', function(elementView, evt) {
        evt.stopPropagation();

        alert('Button pressed');
    });
}());
