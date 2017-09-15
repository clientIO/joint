(function() {

    // Create a custom element.
    // ------------------------

    var ElementLink = joint.dia.Element.define('custom.ElementLink', {
        attrs: {
            rect: {
                refWidth: '100%',
                refHeight: '100%',
                strokeWidth: 5
            },
            text: {
                refX: '50%',
                refY: '50%',
                xAlignment: 'middle',
                yAlignment: 'middle',
                fill: '#FFFFFF'
            },
            a: {
                xlinkShow: 'new',
                cursor: 'pointer'
            }
        }
    });

    var ElementLinkView = joint.dia.ElementView.extend({
        events: {
            'touchstart a': 'onAnchorTouchStart'
        },
        onAnchorTouchStart: function(evt) {
            // Make sure the default action (opening an <a> tag) is not prevented on touch devices
            evt.stopPropagation();
        }
    });

    // Create JointJS elements and add them to the graph as usual.
    // -----------------------------------------------------------

    // The following custom shape creates a link out of the whole element.
    var element1 = new ElementLink({
        // Note the `<a>` SVG element surrounding the entire markup.
        markup: '<a><rect/><text/></a>',
        attrs: {
            a: {
                xlinkHref: 'https://jointjs.com'
            },
            text: {
                text: 'Element as a link:\nhttps://jointjs.com'
            },
            rect: {
                fill: '#E67E22',
                stroke: '#D35400'
            }
        }
    });

    // The following custom shape creates a link only out of the label inside the element.
    var element2 = new ElementLink({
        // Note the `<a>` SVG element surrounding only the text markup.
        markup: '<rect/><a><text/></a>',
        attrs: {
            a: {
                xlinkHref: 'https://jointjs.com'
            },
            text: {
                text: 'Only label as a link:\nhttps://jointjs.com'
            },
            rect: {
                fill: '#9B59B6',
                stroke: '#8E44AD'
            }
        }
    });

    var link = new joint.dia.Link({
        attrs: {
            '.connection': {
                strokeWidth: 5,
                stroke: '#34495E'
            }
        }
    });

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-hyperlinks'),
        width: 650,
        height: 400,
        elementView: ElementLinkView
    });

    paper.model.addCells([
        element1.position(80, 80).size(170, 100),
        element2.position(370, 160).size(170, 100),
        link.set('source', { id: element1.id }).set('target', { id: element2.id })
    ]);

}());
