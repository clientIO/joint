(function foreignObjectPreventDefault() {

    const namespace = joint.shapes;

    const graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    const paper = new joint.dia.Paper({
        el: document.getElementById('paper-foreign-object-prevent-default'),
        model: graph,
        width: 400,
        height: 270,
        gridSize: 1,
        async: true,
        cellViewNamespace: namespace,
        guard: (evt) => ['INPUT'].includes(evt.target.tagName)
    });

    paper.on('blank:pointerdown cell:pointerdown', () => {
        document.activeElement.blur();
    });

    const Handle = joint.dia.Element.define('example.Handle', {
        attrs: {
            body: {
                width: 'calc(w)',
                height: 'calc(h)',
                fill: 'white',
                stroke: 'black',
                rx: 5,
                ry: 5
            },
            foreignObject: {
                width: 'calc(w)',
                height: 'calc(h)',
                x: 0,
                y: 45
            },
            handle: {
                r: 16,
                cx: 'calc(w-24)',
                cy:  'calc(0.15*h)',
                fill: 'none',
                stroke: 'black',
            },
            dots: {
            
            },
            dot1: {
                r:3,
                cx: 'calc(w-32)',
                cy:  'calc(0.15*h)',
                groupSelector: 'dots'
            },
            dot2: {
                r:3,
                cx: 'calc(w-24)',
                cy:  'calc(0.15*h)',
                groupSelector: 'dots'
            },
            dot3: {
                r:3,
                cx: 'calc(w-16)',
                cy:  'calc(0.15*h)',
                groupSelector: 'dots'
            }
        }
    }, {
        markup: joint.util.svg/* xml */`
            <rect @selector="body" />
            <foreignObject @selector="foreignObject">
                    <div @selector="content"
                        xmlns="http://www.w3.org/1999/xhtml"
                        style="font-family: sans-serif;"
                    >
                    <p @selector="p1" style="color: black;">Lorem ipsum dolor sit amet consectetur.</p>
                    <br />
                    <p @selector="p2" style="color: black;">Lorem ipsum dolor sit amet consectetur.</p>
                        <form @selector="formContent" id="form">
                            <label @selector="label" for="diagramName">Diagram Name</label>
                            <input @selector="diagramName" type="text" id="diagramName" name="diagramName"/>
                            <input @selector="submit" type="submit" value="submit"/>
                            <input @selector="checkbox" type="checkbox" checked=""/>
                        </form>
                    </div>
            </foreignObject>
            <circle @selector="handle" />
            <g @group-selector="dots">
                <circle @selector="dot1" />
                <circle @selector="dot2" />
                <circle @selector="dot3" />
            </g>
            <text @selector="userData" />
        `
    }, {});

    joint.shapes.example.Handle = joint.dia.ElementView.extend({

        events: {
            'submit form': 'onSubmit'
        },

        onSubmit: function(evt) {
            evt.preventDefault();
            evt.target.children.diagramName.value = '';
        },

    });
    
    
    const handle = new Handle({});
    handle.position(90, 40);
    handle.resize(200, 200);
    
    handle.addTo(graph);
}());