(function testingE2EPlaywright() {

    const input = document.querySelector('.testing-e2e-playwright');

    const namespace = joint.shapes;

    const graph = new joint.dia.Graph({}, { cellNamespace: namespace });

    new joint.dia.Paper({
        el: document.getElementById('paper-testing-playwright'),
        model: graph,
        width: 500,
        height: 300,
        gridSize: 1,
        cellViewNamespace: namespace,
        defaultLink: new joint.shapes.standard.Link(),
        linkPinning: false,
        defaultConnectionPoint: { name: 'boundary' },
        validateConnection: function(cellViewS, _magnetS, cellViewT, _magnetT, _end, _linkView) {
            return (cellViewS !== cellViewT);
        }
    });

    const port = {
        position: {
            name: 'right'
        },
        attrs: {
            portBody: {
                magnet: true,
                r: 8,
                fill: '#023047',
                stroke: '#023047'
            }
        },
        label: {
            position: {
                name: 'right',
                args: { y: 6 } 
            },
            markup: [{
                tagName: 'text',
                selector: 'label',
                className: 'label-text'
            }]
        },
        markup: [{
            tagName: 'circle',
            selector: 'portBody',
            className: 'port-out'
        }]
    };


    const rect = new joint.shapes.standard.Rectangle({
        ports: {
            groups: {
                'out': port
            }
        },
        markup: [{
            tagName: 'rect',
            selector: 'body',
        }, {
            tagName: 'text',
            selector: 'label',
            className: 'rect__dynamic-label'
        }]
    });

    rect.addPorts([
        { 
            group: 'out',
            attrs: { label: { text: 'port' }}
        }
    ]);

    rect.position(40, 30);
    rect.resize(70, 70);
    rect.attr({
        body: {
            fill: 'white'
        },
        label: {
            text: '',
            fill: 'black',
            textWrap: {
                width: -10,
                height: '50%', 
                ellipsis: true 
            }
        }
    });

    rect.addTo(graph);

    const rect2 = new joint.shapes.standard.Rectangle({
        markup: [{
            tagName: 'rect',
            selector: 'body',
            className: 'target-magnet-false'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });
    rect2.resize(80, 80);
    rect2.position(195, 80);
    rect2.attr('label/text', 'rect2');
    rect2.attr('root/magnet', false);
    rect2.attr('body/fill', 'lightblue');
    rect2.addTo(graph);

    const rect3 = new joint.shapes.standard.Rectangle({
        markup: [{
            tagName: 'rect',
            selector: 'body',
            className: 'target-magnet-true'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });
    rect3.resize(80, 80);
    rect3.position(80, 170);
    rect3.attr('label/text', 'rect3');
    rect3.attr('root/magnet', true);
    rect3.attr('body/fill', 'lightblue');
    rect3.addTo(graph);

    const target = new joint.shapes.standard.Rectangle({
        markup: [{
            tagName: 'rect',
            selector: 'body',
            className: 'target'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });
    target.position(330, 20);
    target.resize(140, 140);
    target.attr({
        body: {
            stroke: 'red',
            strokeDasharray: '5,5'
        },
        label: {
            text: 'target',
            y: -50
        }
    });
    target.addTo(graph);


    const source = new joint.shapes.standard.Rectangle({
        markup: [{
            tagName: 'rect',
            selector: 'body',
            className: 'source'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });
    source.position(280, 200);
    source.resize(70, 70);
    source.attr({
        label: {
            text: 'source',
            y: -20
        }
    });
    source.addTo(graph);

    input.addEventListener('input', (e) => {
        rect.attr('label/text', e.target.value);
    });
    
})();
