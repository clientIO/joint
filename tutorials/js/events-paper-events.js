(function eventsPaperEvents() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-events-paper-events'),
        model: graph,
        width: 600,
        height: 100,
        gridSize: 1,
        background: {
            color: 'white'
        },
        interactive: false
    });

    var rect = new joint.shapes.standard.Rectangle();
    rect.position(100, 30);
    rect.resize(100, 40);
    rect.attr({
        body: {
            cursor: 'pointer',
            fill: 'white',
            stoke: 'black'
        },
        label: {
            text: 'Element #1',
            cursor: 'pointer',
            fill: 'black'
        }
    });
    rect.addTo(graph);

    var rect2 = rect.clone();
    rect2.translate(300, 0);
    rect2.attr('label/text', 'Element #2');
    rect2.addTo(graph);

    var link = new joint.shapes.standard.Link();
    link.source(rect);
    link.target(rect2);
    link.attr({
        line: {
            stroke: 'black'
        }
    })
    link.labels([
        {
            markup: [{
                tagName: 'rect',
                selector: 'body'
            }, {
                tagName: 'text',
                selector: 'label'
            }],
            attrs: {
                label: {
                    cursor: 'pointer',
                    text: 'Link',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 12,
                    fill: 'black'
                },
                body: {
                    cursor: 'pointer',
                    ref: 'label',
                    refX: '-10%',
                    refY: '-10%',
                    refWidth: '120%',
                    refHeight: '120%',
                    fill: 'white',
                    stroke: 'black',
                    strokeWidth: 2
                }
            }
        }
    ]);
    link.addTo(graph);

    var info = new joint.shapes.standard.Rectangle();
    info.position(250, 70);
    info.resize(100, 20);
    info.attr({
        body: {
            visibility: 'hidden',
            cursor: 'default',
            fill: 'white',
            stoke: 'black'
        },
        label: {
            visibility: 'hidden',
            text: 'Link clicked',
            cursor: 'default',
            fill: 'black',
            fontSize: 12
        }
    });
    info.addTo(graph);

    paper.on('blank:pointerdblclick', function() {
        resetAll(this);

        info.attr('body/visibility', 'hidden');
        info.attr('label/visibility', 'hidden');

        this.drawBackground({
            color: 'orange'
        })
    });

    paper.on('element:pointerdblclick', function(elementView) {
        resetAll(this);

        var currentElement = elementView.model;
        currentElement.attr('body/stroke', 'orange')
    });

    paper.on('link:pointerdblclick', function(linkView) {
        resetAll(this);

        var currentLink = linkView.model;
        currentLink.attr('line/stroke', 'orange')
        currentLink.label(0, {
            attrs: {
                body: {
                    stroke: 'orange'
                }
            }
        })
    });

    paper.on('cell:pointerdblclick', function(cellView) {
        var isElement = cellView.model.isElement();
        var message = (isElement ? 'Element' : 'Link') + ' clicked';
        info.attr('label/text', message);

        info.attr('body/visibility', 'visible');
        info.attr('label/visibility', 'visible');
    });

    function resetAll(paper) {
        paper.drawBackground({
            color: 'white'
        })

        var elements = paper.model.getElements();
        for (var i = 0, ii = elements.length; i < ii; i++) {
            var currentElement = elements[i];
            currentElement.attr('body/stroke', 'black');
        }

        var links = paper.model.getLinks();
        for (var j = 0, jj = links.length; j < jj; j++) {
            var currentLink = links[j];
            currentLink.attr('line/stroke', 'black');
            currentLink.label(0, {
                attrs: {
                    body: {
                        stroke: 'black'
                    }
                }
            })
        }
    }
}());
