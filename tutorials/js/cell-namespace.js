(function cellNamespace() {

    class RectangleTwoLabels extends joint.shapes.standard.Rectangle {
        defaults() {
            return {
                ...super.defaults,
                type: 'custom.RectangleTwoLabels'
            };
        }
      
        preinitialize() {
            this.markup = joint.util.svg/* xml */ `
               <rect @selector="body" />
               <text @selector="label" />
               <text @selector="labelSecondary" />
            `;
        }
    }

    const namespace = { ...joint.shapes, custom: { RectangleTwoLabels }};

    const graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    new joint.dia.Paper({
        el: document.getElementById('paper-cell-namespace'),
        model: graph,
        width: 400,
        height: 150,
        cellViewNamespace: namespace,
        background: {
            color: '#F7F7F7'
        },
        gridSize: 15,
        drawGrid: { name: 'dot', args: { color: '#BDBDBD' }}
    });


    graph.fromJSON({
        cells: [
            {
                type: 'standard.Rectangle', 
                size: { width: 100, height: 60 },
                position: { x: 50, y: 50 },
                attrs: { body: { fill: '#C9ECF5' }, label: { text: 'standard.Rectangle', textWrap: { width: 'calc(w-10)' }}}
            },
            { 
                type: 'custom.RectangleTwoLabels', 
                size: { width: 140, height: 80 },
                position: { x: 200, y: 30 },
                attrs: {
                    body: {
                        fill: '#F5BDB0'
                    }, 
                    label: { 
                        text: 'custom.RectangleTwoLabels',
                        textWrap: { width: 'calc(w-10)' } 
                    }, 
                    labelSecondary: { 
                        text: 'SecondaryLabel', 
                        x: 'calc(w/2)', 
                        y: 'calc(h+15)', 
                        textAnchor: 'middle', 
                        textVerticalAnchor: 'middle',
                        fontSize: 14 
                    }
                }
            },
        ]
    });
}());
