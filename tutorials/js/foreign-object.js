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
                            <label @selector="label" for="name">Name</label>
                            <input @selector="name" type="text" id="name" name="name"/>
                            <input @selector="submit" type="submit" value="submit"/>
                        </form>
                    </div>
            </foreignObject>
        `
    }, {});
    
    
    const form = new Form({});
    form.position(100, 20);
    form.resize(200, 200);
    
    form.addTo(graph);
    
    paper.dumpViews();
    
    const formHTML = document.querySelector('form');
    
    formHTML.addEventListener('submit', (e) => {
        e.preventDefault();
    });

}());
