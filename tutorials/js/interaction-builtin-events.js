(function interactionBuiltinEvents() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-interaction-builtin-events'),
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
    rect.resize(100, 30);
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
    link.source({ id: rect.id });
    link.target({ id: rect2.id });
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
                    text: 'Link',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontSize: 12,
                    fill: 'black'
                },
                body: {
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

    paper.on('blank:pointerdblclick', function() {
        resetAll(this);

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
        var currentCell = cellView.model;
        var cellLabel;
        if (currentCell.isElement()) cellLabel = currentCell.attr('label/text');
        else if (currentCell.isLink()) cellLabel = currentCell.label(0).attrs.label.text;
        alert('Cell clicked: ' + currentCell.prop('type') + ' ("' + cellLabel + '")');
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
