var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 10,
    model: graph,
    guard: function(evt) {
        return evt.target instanceof HTMLInputElement;
    }
});

paper.on('blank:pointerdown cell:pointerdown', function() {
    document.activeElement.blur();
});

var Example = joint.dia.Element.define('example.ForeignObject', {
    attrs: {
        body: {
            refWidth: '100%',
            refHeight: '100%',
            stroke: '#333333',
            fill: '#ffffff',
            strokeWidth: 2
        },
        foreignObject: {
            refWidth: '100%',
            refHeight: '100%'
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'foreignObject',
        selector: 'foreignObject',
        attributes: {
            'overflow': 'hidden'
        },
        children: [{
            tagName: 'div',
            namespaceURI: 'http://www.w3.org/1999/xhtml',
            selector: 'content',
            style: {
                fontSize: 14,
                width: '100%',
                height: '100%',
                position: 'static',
                backgroundColor: 'transparent',
                textAlign: 'center',
                margin: 0,
                padding: '0px 10px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            },
            children: [{
                tagName: 'span',
                textContent: 'First Name'
            }, {
                tagName: 'input',
                selector: 'firstname',
                attributes: {
                    'type': 'input',
                    'name': 'firstname'
                },
                style: {
                    position: 'static',
                    width: '100%'
                }
            }, {
                tagName: 'span',
                textContent: 'Last Name'
            }, {
                tagName: 'input',
                selector: 'lastname',
                attributes: {
                    'type': 'input',
                    'name': 'lastname'
                },
                style: {
                    position: 'static',
                    width: '100%'
                }
            }]
        }]
    }]
}, {
    attributes: {
        value: {
            set: function(text, _, node) {
                if ('value' in node) node.value = text;
            }
        }
    }
});

joint.shapes.example.ForeignObjectView = joint.dia.ElementView.extend({

    events: {
        'change input': 'onInputChange'
    },

    onInputChange: function(evt) {
        var input = evt.target;
        this.model.attr(input.name + '/value', input.value);
    }
});

var ex = new Example();
ex.resize(200, 100);
ex.position(200, 100);
ex.attr('firstname/value', 'Bobby');
ex.attr('lastname/value', 'Fisher');
ex.addTo(graph);
