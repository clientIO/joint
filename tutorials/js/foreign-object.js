(function foreignObjectPreventDefault() {

    const namespace = joint.shapes;

    const graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    // const paper = new joint.dia.Paper({
    //     el: document.getElementById('paper-foreign-object-prevent-default'),
    //     model: graph,
    //     width: 500,
    //     height: 350,
    //     async: true,
    //     frozen: true,
    //     cellViewNamespace: namespace,
    //     background: {
    //         color: '#F7F7F7'
    //     },
    //     preventDefaultBlankAction: false
    //     guard: (evt) => ['SPAN'].includes(evt.target.tagName)
    // });

    const paper = new joint.dia.Paper({
        el: document.getElementById('paper-foreign-object-prevent-default'),
        model: graph,
        width: 500,
        height: 350,
        cellViewNamespace: namespace,
        background: {
            color: '#F7F7F7'
        },
    });

    // paper.on('blank:pointerdown cell:pointerdown', () => {
    //     document.activeElement.blur();
    // });

    // const Form = joint.dia.Element.define('example.Form', {
    //     attrs: {
    //         foreignObject: {
    //             width: 'calc(w)',
    //             height: 'calc(h)'
    //         }
    //     }
    // }, {
    //     markup: joint.util.svg/* xml */`
    //         <foreignObject @selector="foreignObject">
    //             <div @selector="outer"
    //                 xmlns="http://www.w3.org/1999/xhtml"
    //                 class="outer"
    //             >
    //                 <div @selector="inner" class="inner">
    //                     <form @selector="form" class="form">
    //                         <input @selector="name" type="text" id="name" name="name" autocomplete="off" placeholder="Your diagram name"/>
    //                         <button @selector="submit">
    //                             <span>Submit</span>
    //                         </button>
    //                     </form>
    //                 </div>
    //             </div>
    //         </foreignObject>
    //     `
    // });

    // joint.shapes.example.FormView = joint.dia.ElementView.extend({

    //     events: {
    //         'submit form': 'onSubmit'
    //     },

    //     onSubmit: function(evt) {
    //         evt.preventDefault();
    //         evt.target.children.name.value = '';
    //         this.model.attr('name/props/value', '');
    //     },
    
    // });

    // const form = new Form();
    // form.position(72, 70);
    // form.resize(355, 200);
    // form.addTo(graph);

    const Card = joint.dia.Element.define('example.ForeignObject', {
        attrs: {
            body: {
                width: 'calc(w)',
                height: 'calc(h)',
                fill: {
                    type: 'linearGradient',
                    stops: [
                        { offset: 0, color: '#ff5c69' },
                        { offset: 0.5, color: '#ff4252' },
                        { offset: 1, color: '#ed2637' }
                    ]
                }
            },
            foreignObject: {
                width: 'calc(w-12)',
                height: 'calc(h-12)',
                x: 6,
                y: 6
            }
        },
    }, {
        markup: [
            {
                tagName: 'rect',
                selector: 'body'
            },
            {
                tagName: 'foreignObject',
                selector: 'foreignObject',
                children: [
                    {
                        tagName: 'div',
                        namespaceURI: 'http://www.w3.org/1999/xhtml',
                        selector: 'background',
                        style: {
                            backgroundColor: '#131e29',
                            width: '100%',
                            height: '100%'
                        },
                        children: [
                            {
                                tagName: 'p',
                                selector: 'text',
                                style: {
                                    color: '#F2F2F2',
                                    font: '16px sans-serif',
                                    padding: '10px',
                                    margin: 0,
                                },
                                textContent: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
                            }
                        ]
                    }
                ]
            }
        ]
    });

    // const Card = joint.dia.Element.define('example.ForeignObject', {
    //     attrs: {
    //         body: {
    //             width: 'calc(w)',
    //             height: 'calc(h)',
    //             // width: 180,
    //             // height: 100,
    //             fill: {
    //                 type: 'linearGradient',
    //                 stops: [
    //                     { offset: 0, color: '#ff5c69' },
    //                     { offset: 0.5, color: '#ff4252' },
    //                     { offset: 1, color: '#ed2637' }
    //                 ]
    //             }
    //         },
    //         foreignObject: {
    //             width: 'calc(w-12)',
    //             height: 'calc(h-12)',
    //             x: 6,
    //             y: 6
    //         }
    //     },
    // }, {
    //     // The /* xml */ comment is optional.
    //     // It is used to tell the IDE that the markup is XML.
    //     markup: joint.util.svg/* xml */`
    //         <style>
    //             div.card__background {
    //                 background-color: #131e29;
    //                 height: 100%;
    //             }
    //             p.card__text {
    //                 color: #F2F2F2;
    //                 font: 16px sans-serif;
    //                 padding: 10px;
    //                 margin: 0;
    //             }             
    //         </style>
    //         <rect @selector="body"/>
    //         <foreignObject @selector="foreignObject">
    //             <div @selector="background"
    //                 xmlns="http://www.w3.org/1999/xhtml"
    //                 class="card__background"
    //             >
    //                 <p @selector="text"
    //                     class="card__text"
    //                 >
    //                     Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    //                 </p>
    //             </div>
    //         </foreignObject>
    //     `
    // });


    const card = new Card({
        position: { x: 10, y: 10 },
        attrs: {
            body: { width: 180, height: 100 },
            // foreignObject: { width: 180, height: 100 },
        }
    });
    
    card.addTo(graph);


    // paper.unfreeze();
}());
