(function foreignObjectPreventDefault() {

    const namespace = joint.shapes;

    const graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    const paper = new joint.dia.Paper({
        el: document.getElementById('paper-foreign-object-prevent-default'),
        model: graph,
        width: 500,
        height: 350,
        async: true,
        frozen: true,
        cellViewNamespace: namespace,
        background: {
            color: '#F7F7F7'
        },
        // guard: (evt) => ['SPAN'].includes(evt.target.tagName)
    });

    paper.on('blank:pointerdown cell:pointerdown', () => {
        document.activeElement.blur();
    });

    const Form = joint.dia.Element.define('example.Form', {
        attrs: {
            foreignObject: {
                width: 'calc(w)',
                height: 'calc(h)'
            }
        }
    }, {
        markup: joint.util.svg/* xml */`
            <foreignObject @selector="foreignObject">
                    <div @selector="outer"
                        xmlns="http://www.w3.org/1999/xhtml"
                        class="outer"
                    >
                       <div @selector="inner" class="inner">
                            <form @selector="form" class="form">
                                <input @selector="name" type="text" id="name" name="name" autocomplete="off"  placeholder="Your diagram name" />
                                <button @selector="submit"><span>Submit</span></button>
                            </form>
                       </div>
                    </div>
            </foreignObject>
        `
    });

    joint.shapes.example.FormView = joint.dia.ElementView.extend({

        events: {
            'submit form': 'onSubmit'
        },

        onSubmit: function(evt) {
            evt.preventDefault();
            this.model.attr('name/props/value', '');
            evt.target.children.name.value = '';
        },

    });
    
    const form = new Form();
    form.position(72, 70);
    form.resize(355, 200);
    form.addTo(graph);

    paper.unfreeze();

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
