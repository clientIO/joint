(function gradients() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-gradients'),
        model: graph,
        width: 650,
        height: 280,
        gridSize: 1
    });

    var el = new joint.shapes.standard.Rectangle();
    el.position(0, 0);
    el.resize(200, 100);
    el.attr({
        body: {
            rx: 2,
            ry: 2,
            strokeWidth: 20
        },
        label: {
            fontSize: 15,
            fill: '#ffffff'
        }
    });

    var el1 = el.clone();
    el1.translate(20, 20);
    el1.attr({
        body: {
            fill: {
                type: 'linearGradient',
                stops: [
                    { offset: '0%', color: '#e67e22' },
                    { offset: '20%', color: '#d35400' },
                    { offset: '40%', color: '#e74c3c' },
                    { offset: '60%', color: '#c0392b' },
                    { offset: '80%', color: '#f39c12' }
                ]
            },
            stroke: {
                type: 'linearGradient',
                stops: [
                    { offset: '0%', color: '#3498db' },
                    { offset: '50%', color: '#9b59b6' }
                ]
            }
        },
        label: {
            text: 'linear gradient\n(both fill and stroke)'
        }
    });
    el1.addTo(graph);

    var el2 = el.clone();
    el2.translate(300, 20);
    el2.attr({
        body: {
            fill: {
                type: 'radialGradient',
                stops: [
                    { offset: '0%', color: '#e67e22' },
                    { offset: '20%', color: '#d35400' },
                    { offset: '40%', color: '#e74c3c' },
                    { offset: '60%', color: '#c0392b' },
                    { offset: '80%', color: '#f39c12' }
                ]
            },
            stroke: {
                type: 'radialGradient',
                stops: [
                    { offset: '95%', color: '#3498db' },
                    { offset: '98%', color: '#9b59b6' }
                ]
            }
        },
        label: {
            text: 'radial gradient\n(both fill and stroke)'
        }
    });
    el2.addTo(graph);

    // note the use of the `x1`, `y1`, `x2` and `y2` attributes
    // they allow us to define the direction of the gradient
    var el3 = el1.clone();
    el3.translate(0, 135);
    el3.attr({
        body: {
            fill: {
                // inherits `type` from `el1`
                // inherits `stops` from `el1`
                attrs: {
                    x1: '0%',
                    y1: '0%',
                    x2: '0%',
                    y2: '100%'
                }
            },
            stroke: {
                // inherits `type` from `el1`
                // inherits `stops` from `el1`
                attrs: {
                    x1: '0%',
                    y1: '0%',
                    x2: '0%',
                    y2: '100%'
                }
            }
        },
        label: {
            text: 'linear gradient\n(top-down)'
        }
    });
    el3.addTo(graph);
}());
