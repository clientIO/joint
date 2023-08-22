const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

const paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 400,
    gridSize: 10,
    model: graph,
    async: true,
    cellViewNamespace: joint.shapes,
    preventDefaultBlankAction: false,
    preventDefaultViewAction: false
});

// Disable the default touch action on the paper.
// This is required in order to disable the scrolling of the page when the user starts interacting
// with the elements on the paper using touch.
// We set the `preventDefaultViewAction` option to `false` so clicking the element will
// blur the form control elements (input, select, textarea)
paper.el.style.touchAction = 'none';

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
            height: 'calc(h)'
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
                // Prevents the browser from scrolling the page when the user
                // tries to touch the foreignObject.
                // Works in Chrome, but not in Safari. If set on the paper,
                // it works everywhere.
                // touchAction: 'none'
            },
            children: [{
                tagName: 'span',
                textContent: 'First Name'
            }, {
                tagName: 'input',
                selector: 'firstname',
                attributes: {
                    'type': 'text',
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
                    'type': 'text',
                    'name': 'lastname'
                },
                style: {
                    position: 'static',
                    width: '100%'
                }
            }]
        }]
    }]
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
            height: 'calc(h)'
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
                style="font-size: 14px; width: 100%; height: 100%; position: static; background-color: transparent; text-align: center; margin: 0px; padding: 0px 10px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: top;"
            >
                <span>First Name</span>
                <input @selector="firstname" type="text" style="width: 100%;"/>
                <span>Last Name</span>
                <input @selector="lastname" type="text" style="width: 100%;"/>
                <span>Color</span>
                <select @selector="color" style="width: 100%;">
                    <option value="white">White</option>
                    <option value="black">Black</option>
                </select>
                <span>Data</span>
                <!-- Video (does not work well in Safari) -->
                <!-- <video @selector="video" controls="true" width="200">
                    <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm" type="video/webm" />
                    <source src="/media/cc0-videos/flower.mp4" type="video/mp4" />
                </video> -->
                <!-- Table -->
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
                <!-- Image -->
                <span>Image</span>
                <img @selector="image" src="https://picsum.photos/180/100" style="position: static; width: 100%; height: 100px;"/>
                <span>Button</span>
                <button @selector="button" style="position: static; width: 100%;">Click me</button>
            </div>
        </foreignObject>
    `
});

joint.shapes.example.ForeignObjectView = joint.dia.ElementView.extend({

    events: {
        'change input': 'onInputChange'
    },

    onInputChange: function(evt) {
        const input = evt.target;
        this.model.attr(input.name + '/props/value', input.value);
    }
});

joint.shapes.example.ForeignObject2View = joint.dia.ElementView.extend({

    events: {
        'change input,select': 'onInputChange',
        'click button': 'onButtonClick'
    },

    onInputChange: function(evt) {
        const input = evt.target;
        this.model.attr(input.getAttribute('joint-selector') + '/props/value', input.value);
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
ex.attr('firstname/props/value', 'Bobby');
ex.attr('lastname/props/value', 'Fisher');
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
ex2.attr('firstname/props/value', 'Garry');
ex2.attr('lastname/props/value', 'Kasparov');
ex2.attr('color/props/value', 'black');
ex2.addTo(graph);
