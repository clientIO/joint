(function hyperlinks() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-hyperlinks'),
        model: graph,
        width: 600,
        height: 100,
        // use a custom element view
        // (to ensure that opening the link is not prevented on touch devices)
        elementView: joint.dia.ElementView.extend({
            events: {
                'touchstart a': 'onAnchorTouchStart'
            },
            onAnchorTouchStart: function(evt) {
                evt.stopPropagation();
            }
        })
    });

    // first element
    // (only the label is a hyperlink)
    joint.shapes.standard.Rectangle.define('examples.HyperlinkLabelRectangle', {
        attrs: {
            body: {
                fill: '#ffffff',
                stroke: '#000000'
            },
            link: {
                refWidth: '100%',
                refHeight: '100%',
                xlinkShow: 'new',
                cursor: 'pointer'
            },
            label: {
                fill: '#ffa500'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body',
        }, {
            // `link` envelops only `label`
            tagName: 'a',
            selector: 'link',
            children: [{
                tagName: 'text',
                selector: 'label'
            }]
        }]
    });

    var rect = new joint.shapes.examples.HyperlinkLabelRectangle();
    rect.position(75, 20);
    rect.resize(150, 60);
    rect.attr({
        link: {
            xlinkHref: 'https://jointjs.com'
        },
        label: {
            text: 'Label as link\nhttps://jointjs.com',
        }
    });
    rect.addTo(graph);

    // second element
    // (the whole element is a hyperlink)
    joint.shapes.standard.Rectangle.define('examples.HyperlinkRectangle', {
        attrs: {
            link: {
                xlinkShow: 'new',
                cursor: 'pointer'
            },
            body: {
                fill: '#ffffff',
                stroke: '#ffa500'
            },
            label: {
                fill: '#ffa500'
            }
        }
    }, {
        markup: [{
            // `link` envelops both `body` and `label`
            tagName: 'a',
            selector: 'link',
            children: [{
                tagName: 'rect',
                selector: 'body'
            }, {
                tagName: 'text',
                selector: 'label'
            }]
        }]
    });

    var rect2 = new joint.shapes.examples.HyperlinkRectangle();
    rect2.position(375, 20);
    rect2.resize(150, 60);
    rect2.attr({
        link: {
            xlinkHref: 'https://jointjs.com'
        },
        label: {
            text: 'Whole element as link\nhttps://jointjs.com',
        }
    });
    rect2.addTo(graph);

    var link = new joint.shapes.standard.Link();
    link.source(rect);
    link.target(rect2);
    link.addTo(graph);
}());
