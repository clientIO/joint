(function(joint, Rough, g) {

    var WIDTH = 800;
    var HEIGHT = 800;

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: WIDTH,
        height: HEIGHT,
        gridSize: 1,
        model: graph,
        clickThreshold: 5,
        async: true,
        sorting: joint.dia.Paper.sorting.APPROX,
        connectionStrategy: joint.connectionStrategies.pinAbsolute,
        defaultConnectionPoint: { name: 'boundary' },
        defaultLink: function() {
            return new RoughLink();
        },
        validateMagnet: function(_view, magnet, evt) {
            return magnet.getAttribute('magnet') === 'on-shift' && evt.shiftKey;
        }
    });

    var rough = Rough.svg(paper.svg);
    var padding = 4;
    var borderEl = rough.rectangle(padding, padding, WIDTH - 2 * padding, HEIGHT - 2 * padding);
    paper.svg.appendChild(borderEl);
    paper.rough = rough;

    paper.on({
        'element:pointerdblclick': function(elementView) {
            var element = elementView.model;
            var text = prompt('Shape Text', element.attr(['label', 'text']));
            if (text !== null) {
                element.attr({
                    label: { text: text },
                    root: { title: text }
                });
            }
        },
        'link:mouseenter': function(linkView) {
            linkView.addTools(new joint.dia.ToolsView({
                tools: [
                    new joint.linkTools.Vertices({ snapRadius: 0 }),
                    new joint.linkTools.SourceArrowhead(),
                    new joint.linkTools.TargetArrowhead(),
                    new joint.linkTools.Remove({
                        distance: 20
                    })
                ]
            }));
        },
        'element:mouseenter': function(elementView) {
            elementView.addTools(new joint.dia.ToolsView({
                tools: [
                    new joint.elementTools.Remove({
                        useModelGeometry: true,
                        y: '0%',
                        x: '100%',
                        offset: { x: -3, y: 3 }
                    })
                ]
            }));
        },
        'cell:mouseleave': function(cellView) {
            cellView.removeTools();
        },
        'blank:pointerdown': function(evt, x, y) {
            var data = evt.data = {};
            var cell;
            if (evt.shiftKey) {
                cell = new RoughLink({
                    attrs: {
                        line: {
                            rough: {
                                bowing: g.random(1,3)
                            }
                        }
                    }
                });
                cell.source({ x: x, y: y });
                cell.target({ x: x, y: y });
            } else {
                var type = ['rectangle', 'ellipse'][g.random(0, 1)];
                cell = new RoughElement({
                    attrs: {
                        body: {
                            rough: {
                                type: type,
                            }
                        },
                        border: {
                            rough: {
                                type: type
                            }
                        }
                    }
                });
                cell.position(x, y);
                data.x = x;
                data.y = y;
            }
            cell.addTo(this.model);
            data.cell = cell;
        },
        'blank:pointermove': function(evt, x, y) {
            var data = evt.data;
            var cell = data.cell;
            if (cell.isLink()) {
                cell.target({ x: x, y: y });
            } else {
                var bbox = new g.Rect(data.x, data.y, x - data.x, y - data.y);
                bbox.normalize();
                cell.set({
                    position: { x: bbox.x, y: bbox.y },
                    size: { width: Math.max(bbox.width, 1), height: Math.max(bbox.height, 1) }
                });
            }
        },
        'blank:pointerup': function(evt) {
            var cell = evt.data.cell;
            if (cell.isLink()) return;
            var fillStyle = ['hachure', 'starburst', 'zigzag-line', 'dots', 'solid'][g.random(0,4)];
            var color = ['#31d0c6', '#7c68fc', '#fe854f', '#feb663', '#c6c7e2'][g.random(0,4)];
            cell.attr({
                body: {
                    rough: {
                        hachureGap: g.random(8, 15),
                        hachureAngle: g.random(0, 180),
                        fillStyle: fillStyle
                    },
                    stroke: color,
                    fill: color
                }
            });
        }
    });

    var RoughElement = joint.dia.Element.define('rough.Rectangle', {
        z: 2,
        attrs: {
            root: {
                magnet: false
            },
            border: {
                rough: {
                    fillSketch: false
                },
                stroke: '#333333',
                strokeWidth: 2,
                fill: 'none'
            },
            body: {
                rough: {
                    fillSketch: true
                },
                strokeWidth: 2,
                stroke: '#c6c7e2',
                fill: 'none'
            },
            label: {
                textWrap: {
                    ellipsis: true,
                    width: '200%',
                    height: 200
                },
                textVerticalAnchor: 'top',
                textAnchor: 'middle',
                fontFamily: 'fantasy',
                refX: '50%',
                refY: '100%',
                refY2: 10,
                fontSize: 20,
                fontWeight: 'bold',
                fill: '#FFFFFF',
                stroke: '#333333',
                strokeWidth: 0.8,
                pointerEvents: 'none'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'body'
        }, {
            tagName: 'path',
            selector: 'border',
            attributes: {
                'pointer-events': 'bounding-box',
                'magnet': 'on-shift'
            }
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    }, {
        attributes: {
            rough: {
                set: function(opt, bbox) {
                    var r = this.paper.rough;
                    if (!r) return;
                    var rOpt = {
                        fill: 'dummy',
                        hachureAngle: opt.hachureAngle,
                        hachureGap: opt.hachureGap,
                        fillStyle: opt.fillStyle
                    };
                    var shape;
                    switch (opt.type) {
                        case 'ellipse':
                            shape = r.generator.ellipse(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2, bbox.width, bbox.height, rOpt);
                            break;
                        case 'rectangle':
                        default:
                            shape = r.generator.rectangle(bbox.x, bbox.y, bbox.width, bbox.height, rOpt);
                            break;
                    }
                    var sets = shape.sets;
                    return { d: r.opsToPath(sets[opt.fillSketch ? 0 : 1]) };
                }
            }
        }
    });

    var RoughLink = joint.dia.Link.define('rough.Link', {
        z: 1,
        source: {
            selector: 'border',
        },
        target: {
            selector: 'border'
        },
        attrs: {
            line: {
                rough: { bowing: 2 },
                stroke: '#333333',
                strokeWidth: 2,
                strokeLinejoin: 'round',
                targetMarker: {
                    'type': 'path',
                    'd': 'M 10 -5 0 0 10 5 z'
                }
            },
            wrapper: {
                connection: true,
                strokeWidth: 10,
                strokeLinejoin: 'round'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'wrapper',
            attributes: {
                'fill': 'none',
                'cursor': 'pointer',
                'stroke': 'transparent',
                'stroke-linecap': 'round'
            }
        }, {
            tagName: 'path',
            selector: 'line',
            attributes: {
                'fill': 'none',
                'pointer-events': 'none'
            }
        }]
    }, {
        attributes: {
            rough: {
                set: function(opt) {
                    var r = this.paper.rough;
                    if (!r) return;
                    var rOpt = {
                        bowing: opt.bowing || 1
                    };
                    return { d: r.opsToPath(r.generator.path(this.getSerializedConnection(), rOpt).sets[0]) };
                }
            }
        }
    });

    // Elements

    var r1 = new RoughElement({
        size: { width: 100, height: 50 },
        position: { x: 50, y: 50 },
        attrs: {
            body: {
                rough: {
                    hachureAngle: 60,
                    hachureGap: 8
                }
            },
            border: {
                rough: {
                    hachureAngle: 60,
                    hachureGap: 8
                }
            },
            label: {
                text: 'RoughJS'
            }
        }
    });

    var r2 = new RoughElement({
        size: { width: 80, height: 80 },
        position: { x: 380, y: 120 },
        attrs: {
            body: {
                rough: {
                    hachureAngle: 20,
                    hachureGap: 4,
                    fillStyle: 'zigzag-line',
                    type: 'ellipse'
                },
                stroke: '#fe854f'
            },
            border: {
                rough: {
                    type: 'ellipse'
                }
            },
            label: {
                text: 'Zigzag Line'
            }
        }
    });

    var r3 = new RoughElement({
        size: { width: 100, height: 85 },
        position: { x: 300, y: 230 },
        attrs: {
            body: {
                rough: {
                    hachureGap: 10,
                    fillStyle: 'starburst',
                    type: 'ellipse'
                },
                stroke: '#7c68fc',
                pointerEvents: 'bounding-box'
            },
            border: {
                rough: {
                    type: 'ellipse'
                }
            },
            label: {
                text: 'Starburst'
            }
        }
    });

    var r4 = new RoughElement({
        size: { width: 75, height: 75 },
        position: { x: 280, y: 20 },
        attrs: {
            body: {
                rough: {
                    hachureGap: 5,
                    fillStyle: 'dots',
                    type: 'ellipse'
                },
                stroke: '#31d0c6'
            },
            border: {
                rough: {
                    type: 'ellipse'
                }
            },
            label: {
                text: 'Dots'
            }
        }
    });

    var r5 = new RoughElement({
        size: { width: 70, height: 70 },
        position: { x: 190, y: 250 },
        attrs: {
            body: {
                rough: {
                    hachureGap: 5,
                    fillStyle: 'solid',
                    type: 'ellipse'
                },
                stroke: '#feb663',
                fill: '#feb663'
            },
            border: {
                rough: {
                    type: 'ellipse'
                }
            },
            label: {
                text: 'Solid'
            }
        }
    });
    // Links

    var rl1 = new RoughLink();
    rl1.source(r1, { selector: 'border' });
    rl1.target(r2, { selector: 'border' });

    var rl2 = new RoughLink();
    rl2.source(r1, { selector: 'border' });
    rl2.target(r3, { selector: 'border' });

    var rl3 = new RoughLink();
    rl3.source(r1, { selector: 'border' });
    rl3.target(r4, { selector: 'border' });

    var rl4 = new RoughLink();
    rl4.source(r1, { selector: 'border' });
    rl4.target(r5, { selector: 'border' });

    graph.resetCells([r1, r2, r3, r4, r5, rl1, rl2, rl3, rl4]);

})(joint, rough, g);
