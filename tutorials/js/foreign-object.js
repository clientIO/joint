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
                                <button @selector="submit" class="arrow-target-mktg">
                                    <span>Submit</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="octicon arrow-symbol-mktg" width="24" height="24" viewBox="0 0 16 16" fill="none">
                                        <path fill="#ff7b72" d="M7.28033 3.21967C6.98744 2.92678 6.51256 2.92678 6.21967 3.21967C5.92678 3.51256 5.92678 3.98744 6.21967 4.28033L7.28033 3.21967ZM11 8L11.5303 8.53033C11.8232 8.23744 11.8232 7.76256 11.5303 7.46967L11 8ZM6.21967 11.7197C5.92678 12.0126 5.92678 12.4874 6.21967 12.7803C6.51256 13.0732 6.98744 13.0732 7.28033 12.7803L6.21967 11.7197ZM6.21967 4.28033L10.4697 8.53033L11.5303 7.46967L7.28033 3.21967L6.21967 4.28033ZM10.4697 7.46967L6.21967 11.7197L7.28033 12.7803L11.5303 8.53033L10.4697 7.46967Z"></path>
                                        <path class="octicon-chevrow-stem" stroke="#ff7b72" d="M1.75 8H11" stroke-width="1.5" stroke-linecap="round"></path>
                                    </svg>
                                </button>
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
