const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

const paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 10,
    model: graph,
    async: true,
    cellViewNamespace: joint.shapes,
    guard: (evt) => ['SELECT', 'INPUT', 'BUTTON'].includes(evt.target.tagName)
});

// Remove focus from the input when the user clicks on the paper.
paper.on('blank:pointerdown cell:pointerdown', () => {
    document.activeElement.blur();
});

const Example = joint.dia.Element.define('example.ForeignObject', {
    attrs: {
        body: {
            width: 'calc(w)',
            height: 'calc(h)',
            stroke: '#333333',
            fill: '#ffffff',
            strokeWidth: 2
        },
        foreignObject: {
            width: 'calc(w)',
            height: 'calc(h)',
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


const Example2 = joint.dia.Element.define('example.ForeignObject2', {
    attrs: {
        body: {
            width: 'calc(w)',
            height: 'calc(h)',
            stroke: '#333333',
            fill: '#ffffff',
            strokeWidth: 2
        },
        foreignObject: {
            width: 'calc(w)',
            height: 'calc(h)',
        }
    }
}, {
    // The /* xml */ comment is optional.
    // It is used to tell the IDE that the markup is XML.
    markup: joint.util.svg/* xml */`
        <rect @selector="body"/>
        <foreignObject @selector="foreignObject" overflow="hidden">
            <div @selector="content"
                xmlns="http://www.w3.org/1999/xhtml"
                style="font-size: 14px; width: 100%; height: 100%; position: static; background-color: transparent; text-align: center; margin: 0px; padding: 0px 10px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center;"
            >
                <span>First Name</span>
                <input @selector="firstname" type="input" style="position: static; width: 100%;"/>
                <span>Last Name</span>
                <input @selector="lastname" type="input" style="position: static; width: 100%;"/>
                <span>Color</span>
                <select @selector="color" style="position: static; width: 100%;">
                    <option value="white">White</option>
                    <option value="black">Black</option>
                </select>
                <span>Data</span>
                <table class="element-table">
                    <tr>
                        <td>A</td>
                        <td>B</td>
                        <td>C</td>
                        <td>D</td>
                        <td>E</td>
                        <td>F</td>
                        <td>G</td>
                        <td>H</td>
                    </tr>
                    <tr>
                        <td>1</td>
                        <td>2</td>
                        <td>3</td>
                        <td>4</td>
                        <td>5</td>
                        <td>6</td>
                        <td>7</td>
                        <td>8</td>
                    </tr>
                </table>
                <span>Image</span>
                <img @selector="image" src="https://picsum.photos/180/100" style="position: static; width: 100%; height: 100px;"/>
                <span>Button</span>
                <button @selector="button" style="position: static; width: 100%;">Click me</button>
            </div>
        </foreignObject>
    `,
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
        const input = evt.target;
        this.model.attr(input.name + '/value', input.value);
    }
});

joint.shapes.example.ForeignObject2View = joint.dia.ElementView.extend({

    events: {
        'change input,select': 'onInputChange',
        'click button': 'onButtonClick'
    },

    onInputChange: function(evt) {
        const input = evt.target;
        this.model.attr(input.getAttribute('joint-selector') + '/value', input.value);
    },

    imageId: 0,

    onButtonClick: function(evt) {
        const { width } = this.model.size();
        this.model.attr('image/src', `https://picsum.photos/id/${this.imageId++}/${width-20}/100`);
    }
});

const ex = new Example({
    attrs: {
        body: {
            fill: '#fbf5d0',
            stroke: '#ff9580'
        }
    }
});
ex.resize(200, 100);
ex.position(100, 100);
ex.attr('firstname/value', 'Bobby');
ex.attr('lastname/value', 'Fisher');
ex.addTo(graph);

const ex2 = new Example2({
    attrs: {
        body: {
            fill: '#f6f4f4',
            stroke: '#b2a29f'
        }
    }
});
ex2.resize(200, 380);
ex2.position(400, 10);
ex2.attr('firstname/value', 'Garry');
ex2.attr('lastname/value', 'Kasparov');
ex2.attr('color/value', 'white');
ex2.addTo(graph);
