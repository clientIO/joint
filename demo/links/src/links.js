var graph = new joint.dia.Graph();
var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 800,
    height: 600,
    model: graph,
    interactive: { linkMove: false },
    defaultConnectionPoint: {
        name: 'boundary',
        args: {
            extrapolate: true,
            sticky: true
        }
    },
    validateConnection: function() {
        return false;
    }
});

var link1 = new joint.shapes.standard.Link({
    source: { x: 20, y: 20 },
    target: { x: 350, y: 20 },
    attrs: {
        line: {
            stroke: '#222138',
            sourceMarker: {
                'fill': '#31d0c6',
                'stroke': 'none',
                'd': 'M 5 -10 L -15 0 L 5 10 Z'
            },
            targetMarker: {
                'fill': '#fe854f',
                'stroke': 'none',
                'd': 'M 5 -10 L -15 0 L 5 10 Z'
            }
        }
    }
});

var link2 = new joint.shapes.standard.Link({
    source: { x: 20, y: 80 },
    target: { x: 350, y: 80 },
    attrs: {
        line: {
            stroke: '#fe854f',
            strokeWidth: 4,
            sourceMarker: {
                // if no fill or stroke specified, marker inherits the line color
                'd': 'M 0 -5 L -10 0 L 0 5 Z'
            },
            targetMarker: {
                // the marker can be an arbitrary SVGElement
                'type': 'circle',
                'r': 5
            }
        }
    }
});

// Utility function for normalizing marker's path data.
// Translates the center of an arbitrary path at <0 + offset,0>.
function normalizeMarker(d, offset) {
    var path = new g.Path(V.normalizePathData(d));
    var bbox = path.bbox();
    var ty = - bbox.height / 2 - bbox.y;
    var tx = - bbox.width / 2 - bbox.x;
    if (typeof offset === 'number') tx -= offset;
    path.translate(tx, ty);
    return path.serialize();
}

var link3 = new joint.shapes.standard.Link({
    source: { x: 10, y: 140 },
    target: { x: 350, y: 140 },
    attrs: {
        line: {
            stroke: '#31d0c6',
            strokeWidth: 3,
            strokeDasharray: '5 2',
            sourceMarker: {
                'stroke': '#31d0c6',
                'fill': '#31d0c6',
                'd': normalizeMarker('M5.5,15.499,15.8,21.447,15.8,15.846,25.5,21.447,25.5,9.552,15.8,15.152,15.8,9.552z')
            },
            targetMarker: {
                'stroke': '#31d0c6',
                'fill': '#31d0c6',
                'd': normalizeMarker('M4.834,4.834L4.833,4.833c-5.889,5.892-5.89,15.443,0.001,21.334s15.44,5.888,21.33-0.002c5.891-5.891,5.893-15.44,0.002-21.33C20.275-1.056,10.725-1.056,4.834,4.834zM25.459,5.542c0.833,0.836,1.523,1.757,2.104,2.726l-4.08,4.08c-0.418-1.062-1.053-2.06-1.912-2.918c-0.859-0.859-1.857-1.494-2.92-1.913l4.08-4.08C23.7,4.018,24.622,4.709,25.459,5.542zM10.139,20.862c-2.958-2.968-2.959-7.758-0.001-10.725c2.966-2.957,7.756-2.957,10.725,0c2.954,2.965,2.955,7.757-0.001,10.724C17.896,23.819,13.104,23.817,10.139,20.862zM5.542,25.459c-0.833-0.837-1.524-1.759-2.105-2.728l4.081-4.081c0.418,1.063,1.055,2.06,1.914,2.919c0.858,0.859,1.855,1.494,2.917,1.913l-4.081,4.081C7.299,26.982,6.379,26.292,5.542,25.459zM8.268,3.435l4.082,4.082C11.288,7.935,10.29,8.571,9.43,9.43c-0.858,0.859-1.494,1.855-1.912,2.918L3.436,8.267c0.58-0.969,1.271-1.89,2.105-2.727C6.377,4.707,7.299,4.016,8.268,3.435zM22.732,27.563l-4.082-4.082c1.062-0.418,2.061-1.053,2.919-1.912c0.859-0.859,1.495-1.857,1.913-2.92l4.082,4.082c-0.58,0.969-1.271,1.891-2.105,2.728C24.623,26.292,23.701,26.983,22.732,27.563z', 10)
            }
        }
    }
});

var link4 = new joint.shapes.standard.Link({
    source: { x: 400, y: 20 },
    target: { x: 740, y: 20 },
    vertices: [{ x: 400, y: 60 }, { x: 550, y: 60 }, { x: 550, y: 20 }],
    attrs: {
        line: {
            stroke: '#3c4260',
            strokeWidth: 2,
            sourceMarker: {
                'fill': '#4b4a67',
                'stroke': '#4b4a67',
                'd': normalizeMarker('M5.5,15.499,15.8,21.447,15.8,15.846,25.5,21.447,25.5,9.552,15.8,15.152,15.8,9.552z')
            },
            targetMarker: {
                'fill': '#4b4a67',
                'stroke': '#4b4a67',
                'd': normalizeMarker('M5.5,15.499,15.8,21.447,15.8,15.846,25.5,21.447,25.5,9.552,15.8,15.152,15.8,9.552z')
            },
            vertexMarker: {
                'type': 'circle',
                'r': 5,
                'stroke-width': 2,
                'fill': 'white'
            }
        }
    }
});

var link5 = new joint.shapes.standard.Link({
    source: { x: 440, y: 100 },
    target: { x: 740, y: 100 },
    vertices: [{ x: 400, y: 140 }, { x: 550, y: 100 }, { x: 600, y: 140 }],
    smooth: true,
    attrs: {
        line: {
            stroke: '#7c68fc',
            strokeWidth: 3,
            sourceMarker: {
                'stroke': '#7c68fc',
                'fill': '#7c68fc',
                'd': normalizeMarker('M24.316,5.318,9.833,13.682,9.833,5.5,5.5,5.5,5.5,25.5,9.833,25.5,9.833,17.318,24.316,25.682z')
            },
            targetMarker: {
                'stroke': '#feb663',
                'fill': '#feb663',
                'd': normalizeMarker('M14.615,4.928c0.487-0.986,1.284-0.986,1.771,0l2.249,4.554c0.486,0.986,1.775,1.923,2.864,2.081l5.024,0.73c1.089,0.158,1.335,0.916,0.547,1.684l-3.636,3.544c-0.788,0.769-1.28,2.283-1.095,3.368l0.859,5.004c0.186,1.085-0.459,1.553-1.433,1.041l-4.495-2.363c-0.974-0.512-2.567-0.512-3.541,0l-4.495,2.363c-0.974,0.512-1.618,0.044-1.432-1.041l0.858-5.004c0.186-1.085-0.307-2.6-1.094-3.368L3.93,13.977c-0.788-0.768-0.542-1.525,0.547-1.684l5.026-0.73c1.088-0.158,2.377-1.095,2.864-2.081L14.615,4.928z')
            }
        }
    }
});

var link6 = new joint.shapes.standard.DoubleLink({
    source: { x: 10, y: 200 },
    target: { x: 350, y: 200 },
    attrs: {
        line: {
            stroke: '#7c68fc'
        }
    },
    labels: [{
        attrs: { text: { text: 'Label' }},
        position: {
            offset: 15,
            distance: 0.5
        }
    }]
});

var link7 = new joint.shapes.standard.Link({
    source: { x: 400, y: 200 },
    target: { x: 740, y: 200 },
    connector: { name: 'smooth' },
    attrs: {
        line: {
            targetMarker: {
                'd': 'M 0 -5 L -10 0 L 0 5 Z'
            }
        }
    },
    labels: [{
        markup: [{
            tagName: 'rect',
            selector: 'labelBody'
        }, {
            tagName: 'text',
            selector: 'labelText'
        }],
        attrs: {
            labelText: {
                text: 'First',
                fill: '#7c68fc',
                fontFamily: 'sans-serif',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle'
            },
            labelBody: {
                ref: 'labelText',
                refX: -5,
                refY: -5,
                refWidth: '100%',
                refHeight: '100%',
                refWidth2: 10,
                refHeight2: 10,
                stroke: '#7c68fc',
                fill: 'white',
                strokeWidth: 2,
                rx: 5,
                ry: 5
            }
        },
        position: {
            distance: 0.3,
            args: {
                keepGradient: true,
                ensureLegibility: true,
            }
        }
    }, {
        markup: [{
            tagName: 'ellipse',
            selector: 'labelBody'
        }, {
            tagName: 'text',
            selector: 'labelText'
        }],
        attrs: {
            labelText: {
                text: 'Second',
                fill: '#31d0c6',
                fontFamily: 'sans-serif',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle'
            },
            labelBody: {
                ref: 'labelText',
                refRx: '70%',
                refRy: '80%',
                stroke: '#31d0c6',
                fill: 'white',
                strokeWidth: 2
            }
        },
        position: {
            distance: 0.7,
            angle: 45
        }
    }]
});

var link8 = new joint.shapes.standard.ShadowLink({
    source: { x: 10, y: 280 },
    target: { x: 440, y: 280 },
    vertices: [{ x: 150, y: 350 }, { x: 300, y: 280 }],
    smooth: true,
    markup: [{
        tagName: 'path',
        selector: 'shadow',
        attributes: {
            'fill': 'none'
        }
    }, {
        tagName: 'path',
        selector: 'line',
        attributes: {
            'fill': 'none'
        }
    }, {
        tagName: 'text',
        selector: 'label'
    }],
    attrs: {
        line: {
            stroke: '#3c4260'
        },
        label: {
            textPath: {
                selector: 'line',
                startOffset: '50%'
            },
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            text: 'Label Along Path',
            fill: '#f6f6f6',
            fontSize: 15,
            fontWeight: 'bold',
            fontFamily: 'fantasy'
        }
    }
});

// Custom Link

var link9 = new joint.dia.Link({
    markup: [{
        tagName: 'path',
        selector: 'p1'
    }, {
        tagName: 'rect',
        selector: 'sign'
    }, {
        tagName: 'circle',
        selector: 'c1',
    }, {
        tagName: 'path',
        selector: 'p2'
    }, {
        tagName: 'circle',
        selector: 'c2'
    }, {
        tagName: 'text',
        selector: 'signText'
    }],
    source: { x: 380, y: 380 },
    target: { x: 740, y: 280 },
    vertices: [{ x: 600, y: 280 }],
    attrs: {
        p1: {
            connection: true,
            fill: 'none',
            stroke: 'black',
            strokeWidth: 6,
            strokeLinejoin: 'round'
        },
        p2: {
            connection: true,
            fill: 'none',
            stroke: '#fe854f',
            strokeWidth: 4,
            pointerEvents: 'none',
            strokeLinejoin: 'round',
            targetMarker: {
                'type': 'path',
                'fill': '#fe854f',
                'stroke': 'black',
                'stroke-width': 1,
                'd': 'M 10 -3 10 -10 -2 0 10 10 10 3'
            }
        },
        sign: {
            x: -20,
            y: -10,
            width: 40,
            height: 20,
            stroke: 'black',
            fill: '#fe854f',
            atConnectionLength: 30,
            strokeWidth: 1,
            event: 'myclick:rect'
        },
        signText: {
            atConnectionLength: 30,
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            text: 'Link',
        },
        c1: {
            r: 10,
            stroke: 'black',
            fill: '#fe854f',
            atConnectionRatio: .5,
            strokeWidth: 1,
            event: 'myclick:circle',
            cursor: 'pointer'
        },
        c2: {
            r: 5,
            stroke: 'black',
            fill: 'white',
            atConnectionRatio: .5,
            strokeWidth: 1,
            pointerEvents: 'none'
        }
    }
});

var el1 = new joint.shapes.standard.Path({
    position: { x: 500, y: 430 },
    size: { width: 100, height: 100 },
    attrs: {
        body: {
            fill: '#31d0c6',
            refD: 'M 0 20 10 20 10 30 30 30 30 0 40 0 40 40 0 40 z'
        }
    }
});

var link10 = new joint.shapes.standard.Link({
    source: { x: 300, y: 400 },
    target: { id: el1.id },
    attrs: {
        line: {
            sourceMarker: {
                'd': 'M 0 0 15 0',
                'stroke': 'white',
                'stroke-width': 3
            }
        }
    }
});

// Stubs

var link11 = new joint.dia.Link({
    markup: [{
        tagName: 'path',
        selector: 'line'
    }, {
        tagName: 'g',
        selector: 'sourceReference',
        children: [{
            tagName: 'rect',
            selector: 'sourceReferenceBody',
            groupSelector: 'endReferenceBody'
        }, {
            tagName: 'text',
            selector: 'sourceReferenceLabel',
            groupSelector: 'endReferenceLabel'
        }]
    }, {
        tagName: 'g',
        selector: 'targetReference',
        children: [{
            tagName: 'rect',
            selector: 'targetReferenceBody',
            groupSelector: 'endReferenceBody'
        }, {
            tagName: 'text',
            selector: 'targetReferenceLabel',
            groupSelector: 'endReferenceLabel'
        }]
    }],
    source: { x: 120, y: 550 },
    target: { x: 120, y: 400 },
    attrs: {
        line: {
            connection: { stubs: 40 },
            fill: 'none',
            stroke: 'black',
            strokeWidth: 2,
            strokeLinejoin: 'round',
            sourceMarker: {
                'type': 'circle',
                'r': 5,
                'cx': 5,
                'fill': 'white',
                'stroke': 'black',
                'stroke-width': 2
            },
            targetMarker: {
                'type': 'circle',
                'r': 5,
                'cx': 5,
                'fill': 'white',
                'stroke': 'black',
                'stroke-width': 2
            }
        },
        endReferenceBody: {
            x: -12,
            y: -45,
            width: 24,
            height: 90,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2
        },
        sourceReference: {
            atConnectionLength: 50,
            event: 'link:source:click'
        },
        targetReference: {
            atConnectionLength: -50,
            event: 'link:target:click'
        },
        endReferenceLabel: {
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            textDecoration: 'underline',
            writingMode: 'TB',
            fontFamily: 'sans-sarif',
            fontSize: 15,
            cursor: 'pointer',
            annotations: [{
                start: 6,
                end: 12,
                attrs: {
                    'font-weight': 'bold'
                }
            }]
        },
        sourceReferenceLabel: {
            text: 'Go to Target'
        },
        targetReferenceLabel: {
            text: 'Go to Source'
        }
    }
});

paper.on({
    'link:source:click': function(linkView) {
        linkView.model.attr({
            sourceReferenceBody: { fill: 'white' },
            targetReferenceBody: { fill: '#fe854f' }
        });
    },
    'link:target:click': function(linkView) {
        linkView.model.attr({
            sourceReferenceBody: { fill: '#fe854f' },
            targetReferenceBody: { fill: 'white' }
        });
    }
});

var link12 = new joint.dia.Link({
    markup: [{
        tagName: 'path',
        selector: 'line'
    }, {
        tagName: 'path',
        selector: 'crossing',
    }],
    source: { x: 220, y: 550 },
    target: { x: 220, y: 400 },
    attrs: {
        line: {
            connection: { stubs: -30 },
            fill: 'none',
            stroke: 'black',
            strokeWidth: 2,
            strokeLinejoin: 'round',
            sourceMarker: {
                'type': 'circle',
                'r': 5,
                'cx': 5,
                'fill': 'white',
                'stroke': 'black',
                'stroke-width': 2
            },
            targetMarker: {
                'type': 'circle',
                'r': 5,
                'cx': 5,
                'fill': 'white',
                'stroke': 'black',
                'stroke-width': 2
            }
        },
        crossing: {
            atConnectionRatio: .5,
            d: 'M -10 -20 0 20 M 0 -20 10 20',
            fill: 'none',
            stroke: 'black',
            strokeWidth: 2
        }
    }
});

var link13 = new joint.shapes.standard.Link({
    source: {
        id: el1.id,
        anchor: { name: 'bottomRight' },
        connectionPoint: { name: 'anchor', args: { align: 'bottom', alignOffset: 20 }}
    },
    target: {
        id: el1.id,
        anchor: { name: 'bottomLeft' },
        connectionPoint: { name: 'anchor', args: { align: 'bottom', alignOffset: 20 }}
    },
    attrs: {
        line: {
            strokeWidth: 3,
            strokeDasharray: '3,1',
            sourceMarker: {
                'd': 'M 0 -10 0 10',
                'stroke-width': 3
            },
            targetMarker: {
                'd': 'M 0 -10 0 10',
                'stroke-width': 3
            }
        }
    }
});

var link14 = new joint.dia.Link({
    markup: [{
        tagName: 'path',
        selector: 'line1',
        groupSelector: 'lines'
    }, {
        tagName: 'path',
        selector: 'line2',
        groupSelector: 'lines'
    }, {
        tagName: 'path',
        selector: 'line3',
        groupSelector: 'lines'
    }],
    connector: { name: 'rounded' },
    source: { x: 30, y: 550 },
    target: { x: 30, y: 400 },
    attrs: {
        lines: {
            connection: true,
            strokeDasharray: '10,20',
            strokeLinejoin: 'round',
            fill: 'none'
        },
        line1: {
            stroke: '#fe854f',
            strokeWidth: 10
        },
        line2: {
            stroke: '#7c68fc',
            strokeDashoffset: 10,
            strokeWidth: 10,
        },
        line3: {
            stroke: '#222138',
            strokeDashoffset: 20,
            strokeWidth: 5,
            sourceMarker: {
                'type': 'circle',
                'r': 10,
                'cx': 5,
                'fill': '#fe854f',
                'stroke': '#222138',
                'stroke-width': 5
            },
            targetMarker: {
                'type': 'circle',
                'r': 10,
                'cx': 5,
                'fill': '#7c68fc',
                'stroke': '#222138',
                'stroke-width': 5
            }
        }
    }
});


graph.resetCells([el1, link1, link2, link3, link4, link5, link6, link7, link8, link9, link10, link11, link12, link13, link14]);

// Custom Link Tools

var RectangleSourceArrowhead = joint.linkTools.SourceArrowhead.extend({
    tagName: 'rect',
    attributes: {
        'x': -15,
        'y': -15,
        'width': 30,
        'height': 30,
        'fill': 'black',
        'fill-opacity': 0.3,
        'stroke': 'black',
        'stroke-width': 2,
        'cursor': 'move',
        'class': 'target-arrowhead'
    }
});

var CircleTargetArrowhead = joint.linkTools.TargetArrowhead.extend({
    tagName: 'circle',
    attributes: {
        'r': 20,
        'fill': 'black',
        'fill-opacity': 0.3,
        'stroke': 'black',
        'stroke-width': 2,
        'cursor': 'move',
        'class': 'target-arrowhead'
    }
});

var CustomBoundary = joint.linkTools.Boundary.extend({
    attributes: {
        'fill': '#7c68fc',
        'fill-opacity': 0.2,
        'stroke': '#33334F',
        'stroke-width': .5,
        'stroke-dasharray': '5, 5',
        'pointer-events': 'none'
    },
});

// Interactions

paper.on('link:mouseenter', function(linkView) {

    var tools;
    switch (linkView.model) {
        case link1:
        case link3:
        case link4:
            tools = [
                new joint.linkTools.Vertices({ stopPropagation: false }),
                new joint.linkTools.Segments({ stopPropagation: false })
            ];
            break;
        case link2:
            tools = [
                new joint.linkTools.Button({
                    markup: [{
                        tagName: 'circle',
                        selector: 'button',
                        attributes: {
                            'r': 7,
                            'stroke': '#fe854f',
                            'stroke-width': 3,
                            'fill': 'white',
                            'cursor': 'pointer'
                        }
                    }, {
                        tagName: 'text',
                        textContent: 'B',
                        selector: 'icon',
                        attributes: {
                            'fill': '#fe854f',
                            'font-size': 10,
                            'text-anchor': 'middle',
                            'font-weight': 'bold',
                            'pointer-events': 'none',
                            'y': '0.3em'
                        }
                    }],
                    distance: -30,
                    action: function() {
                        var link = this.model;
                        var source = link.source();
                        var target = link.target();
                        link.source(target);
                        link.target(source);
                    }
                }),
                new joint.linkTools.Button({
                    markup: [{
                        tagName: 'circle',
                        selector: 'button',
                        attributes: {
                            'r': 7,
                            'stroke': '#fe854f',
                            'stroke-width': 3,
                            'fill': 'white',
                            'cursor': 'pointer'
                        }
                    }, {
                        tagName: 'text',
                        textContent: 'A',
                        selector: 'icon',
                        attributes: {
                            'fill': '#fe854f',
                            'font-size': 10,
                            'text-anchor': 'middle',
                            'font-weight': 'bold',
                            'pointer-events': 'none',
                            'y': '0.3em'
                        }
                    }],
                    distance: -50,
                    action: function() {
                        var link = this.model;
                        link.attr({
                            line: {
                                strokeDasharray: '5,1',
                                strokeDashoffset: (link.attr('line/strokeDashoffset') | 0) + 20
                            }
                        });
                    }
                })
            ];
            break;
        case link5:
            tools = [
                new joint.linkTools.Vertices({
                    snapRadius: 0,
                    redundancyRemoval: false
                }),
                new RectangleSourceArrowhead(),
                new CircleTargetArrowhead(),
            ];
            break;
        case link6:
            tools = [
                new joint.linkTools.Vertices(),
                new CustomBoundary({ padding: 25 })
            ];
            break;
        case link7:
            tools = [
                new joint.linkTools.SourceArrowhead(),
                new joint.linkTools.TargetArrowhead(),
                new joint.linkTools.Remove({ distance: 20 })
            ];
            break;
        case link8:
            tools = [
                new joint.linkTools.Vertices({
                    snapRadius: 0,
                    redundancyRemoval: false,
                    vertexAdding: false
                })
            ];
            break;
        case link11:
        case link12:
            tools = [
                new joint.linkTools.SourceArrowhead(),
                new joint.linkTools.TargetArrowhead()
            ];
            break;
        case link14:
            tools = [
                new joint.linkTools.Vertices(),
                new joint.linkTools.SourceArrowhead(),
                new joint.linkTools.TargetArrowhead()
            ];
            break;
        default:
            return;
    }

    linkView.addTools(new joint.dia.ToolsView({
        name: 'onhover',
        tools: tools
    }));
});

paper.on('link:mouseleave', function(linkView) {
    if (!linkView.hasTools('onhover')) return;
    linkView.removeTools();
});

// Permanent Link Tool

link10.findView(paper).addTools(new joint.dia.ToolsView({
    name: 'permanent',
    tools: [
        new joint.linkTools.TargetAnchor(),
        new RectangleSourceArrowhead()
    ]
}));

link13.findView(paper).addTools(new joint.dia.ToolsView({
    name: 'permanent',
    tools: [
        new joint.linkTools.TargetAnchor({
            restrictArea: false,
            snap: function(coords) {
                var bbox = this.model.getTargetCell().getBBox();
                coords.y = bbox.bottomMiddle().y;
                coords.x = Math.min(bbox.x + bbox.width, coords.x);
                return coords;
            }
        }),
        new joint.linkTools.SourceAnchor({
            restrictArea: false,
            snap: function(coords) {
                var bbox = this.model.getSourceCell().getBBox();
                coords.x = bbox.bottomRight().x;
                coords.y = Math.max(bbox.y, coords.y);
                return coords;
            }
        }),
    ]
}));

// Attribute Event

paper.on('myclick:circle', function(linkView, evt) {
    evt.stopPropagation();
    var link = linkView.model;
    var t = (link.attr('c1/atConnectionRatio') > .2) ? .2 :.9;
    var transitionOpt = {
        delay: 100,
        duration: 2000,
        timingFunction: joint.util.timing.inout
    };
    link.transition('attrs/c1/atConnectionRatio', t, transitionOpt);
    link.transition('attrs/c2/atConnectionRatio', t, transitionOpt);
});
