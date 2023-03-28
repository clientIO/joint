(function foreignObject() {

    const namespace = joint.shapes;

    const graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    const paper = new joint.dia.Paper({
        el: document.getElementById('paper-foreign-object'),
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

    const Form = joint.dia.Element.define('example.Form', {
        attrs: {
            body: {
                width: 'calc(w)',
                height: 'calc(h)',
                fill: 'white',
                rx: 5,
                ry: 5
            },
            foreignObject: {
                width: 'calc(w)',
                height: 'calc(h)',
                x: 0,
                y: 10
            },
            userData: {
                text: ''
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
                        <form @selector="formContent" id="form">
                            <label @selector="label" for="diagramName">Diagram Name</label>
                            <input @selector="diagramName" type="text" id="diagramName" name="diagramName"/>
                            <input @selector="submit" type="submit" value="submit"/>
                        </form>
                    </div>
            </foreignObject>
            <text @selector="userData" />
        `
    }, {});

    joint.shapes.example.FormView = joint.dia.ElementView.extend({

        events: {
            'submit form': 'onSubmit'
        },

        onSubmit: function(evt) {
            // console.log('submit', evt.target.children.diagramName.value, evt);
            evt.preventDefault();
            this.model.attr('userData/text', evt.target.children.diagramName.value);
            evt.target.children.diagramName.value = '';
        },

    });
    
    
    const form = new Form({});
    form.position(90, 40);
    form.resize(200, 200);
    
    form.addTo(graph);

    // const Card = joint.dia.Element.define('example.ForeignObject', {
    //     attrs: {
    //         body: {
    //             width: 'calc(w)',
    //             height: 'calc(h)',
    //             stroke: '#4b5d67',
    //             fill: '#4b5d67',
    //             strokeWidth: 1,
    //             rx: 5,
    //             ry: 5
    //         },
    //         foreignObject: {
    //             width: 'calc(w-20)',
    //             height: 'calc(h-20)',
    //             x: 10,
    //             y: 10
    //         }
    //     },
    // }, {
    //     // The /* xml */ comment is optional.
    //     // It is used to tell the IDE that the markup is XML.
    //     markup: joint.util.svg/* xml */`
    //         <rect @selector="body"/>
    //         <foreignObject @selector="foreignObject">
    //             <div @selector="content"
    //                     xmlns="http://www.w3.org/1999/xhtml"
    //                     style="font-family: sans-serif; font-size: 16px; color: white;"
    //             >
    //                 <p @selector="textContent"
    //                     style="margin: 0; padding: 5px"
    //                 >
    //                     Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    //                 </p>
    //             </div>
    //         </foreignObject>
    //     `
    // });

    // const card = new Card({});
    // card.position(90, 40);
    // card.resize(180, 100);
    
    // card.addTo(graph);
}());