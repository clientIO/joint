(function elementStyling() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-element-styling'),
        width: 600,
        height: 50,
        model: graph
    });

    var rect1 = new joint.shapes.basic.Generic({
        markup: '<rect class="element-rect"/><text class="element-text"/>',
        position: {
            x: 10,
            y: 10
        },
        size: {
            width: 100,
            height: 30
        },
        attrs: {
            // Selector point to all <rect/> tags in the markup
            // Alternative '.element-rect'
            rect: {
                // Special attributes telling the rect to fill
                // 100% width and height of the model size
                // (the whole bounding box)
                refWidth: '100%',
                refHeight: '100%'
            },
            // Selector point to all <text/> tags in the markup
            // Alternative '.element-text'
            text: {
                // Special attributes telling the text to position
                // itself in the center of the model bounding box
                refX: '50%',
                refY: '50%',
                // Special attributes telling the text to be pinned
                // to its position (refX, refY) by the text bounding box
                // center (default is top-left corner)
                xAlignment: '50%',
                yAlignment: '50%'
            }
        }
    });
    var rect2 = rect1.clone().translate(120);
    var rect3 = rect2.clone().translate(120);
    var rect4 = rect3.clone().translate(120);
    var rect5 = rect4.clone().translate(120);
    
    rect1.attr({
        rect: {
            fill: '#2C3E50',
            rx: 5,
            ry: 5,
            strokeWidth: 2,
            stroke: 'black'
        },
        text: {
            text: 'my label',
            fill: '#3498DB',
            fontSize: 18,
            fontWeight: 'bold',
            fontVariant: 'small-caps',
            textTransform: 'capitalize'
        }
    });

    rect1.addTo(graph);

    rect2.attr({
        rect: {
            fill: '#E74C3C',
            rx: 20,
            ry: 20,
            stroke: 'none'
        },
        text: {
            text: 'my label',
            fill: '#ECF0F1',
            fontSize: 11,
            fontWeight: 'normal',
            fontVariant: 'small-caps',
            textTransform: 'capitalize'
        }
    });

    rect2.addTo(graph);

    rect3.attr({
        rect: {
            fill: '#8E44AD',
            rx: 0,
            ry: 0,
            strokeWidth: 0
        },
        text: {
            text: 'my label',
            fill: 'white',
            fontSize: 13,
            fontWeight: 'normal'
        }
    });

    rect3.addTo(graph);

    rect4.attr({
        rect: {
            fill: '#2ECC71',
            rx: 0,
            ry: 0,
            strokeWidth: 1,
            stroke: 'black',
            strokeDasharray: '10,2'
        },
        text: {
            text: 'my label',
            fill: 'black',
            fontSize: 13,
            fontWeight: 'normal'
        }
    });

    rect4.addTo(graph);

    rect5.attr({
        rect: {
            fill: '#F39C12',
            rx: 20,
            ry: 20,
            strokeWidth: 1,
            stroke: 'black',
            strokeDasharray: '1,1'
        },
        text: {
            text: 'my label',
            fill: 'gray',
            fontSize: 18,
            fontWeight: 'bold',
            fontVariant: 'small-caps',
            textTransform: 'capitalize',
            style: { // inline CSS style
                textShadow: '1px 1px 1px black'
            }
        }
    });

    rect5.addTo(graph);

}());
