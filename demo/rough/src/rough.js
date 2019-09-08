(function(joint, rough, g) {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 800,
        height: 400,
        gridSize: 1,
        model: graph,
        clickThreshold: 5,
        async: true,
        connectionStrategy: joint.connectionStrategies.pinAbsolute,
        defaultConnectionPoint: { name: 'boundary' },
        defaultLink: function() {
            return new RoughLink();
        },
        validateMagnet: function(_view, _magnet, evt) {
            return evt.shiftKey;
        }
    });

    paper.rough = rough.svg(paper.svg);

    paper.on({
        'link:mouseenter': function(linkView) {
            linkView.addTools(new joint.dia.ToolsView({
                tools: [
                    new joint.linkTools.Vertices({ snapRadius: 0 }),
                    new joint.linkTools.SourceArrowhead(),
                    new joint.linkTools.TargetArrowhead(),
                    new joint.linkTools.Remove({ distance: 20 }),
                ]
            }));
        },
        'link:mouseleave': function(linkView) {
            linkView.removeTools();
        },
        'blank:pointerdown': function(evt, x, y) {
            var data = evt.data = {};
            var cell;
            if (evt.shiftKey) {
                cell = new RoughLink();
                cell.source({ x: x, y: y });
                cell.target({ x: x, y: y });
            } else {
                var type = ['rectangle','ellipse'][g.random(0, 1)];
                var fillStyle = ['hachure', 'starburst', 'zigzag-line', 'dots', 'solid'][g.random(0,4)];
                var color = ['#31d0c6', '#7c68fc', '#fe854f', '#feb663', '#c6c7e2'][g.random(0,4)];
                cell = new RoughElement({
                    attrs: {
                        body: {
                            rough: {
                                type: type,
                                hachureGap: g.random(8, 15),
                                hachureAngle: g.random(0, 180),
                                fillStyle: fillStyle
                            },
                            stroke: color,
                            fill: color
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
        }
    });

    var RoughElement = joint.dia.Element.define('rough.Rectangle', {
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
                textVerticalAnchor: 'top',
                textAnchor: 'middle',
                fontFamily: 'fantasy',
                refX: '50%',
                refY: '100%',
                refY2: 10,
                fontSize: 15,
                fill: '#c6c7e2'
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
        source: {
            selector: 'border',
        },
        target: {
            selector: 'border'
        },
        attrs: {
            line: {
                rough: true,
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
                    return { d: r.opsToPath(r.generator.path(this.getSerializedConnection(), { bowing: opt.bowing || 1 }).sets[0]) };
                }
            }
        }
    });

    // Elements

    var r1 = new RoughElement({
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
            }
        }
    });
    r1.resize(100, 100);
    r1.position(50, 50);

    var r2 = new RoughElement({
        size: { width: 80, height: 80 },
        position: { x: 350, y: 100 },
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
                text: 'Zigzag Line',
                fill: '#fe854f'
            }
        }
    });

    var r3 = new RoughElement({
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
                text: 'Starburst',
                fill: '#7c68fc'
            }
        }
    });

    r3.resize(100, 100);
    r3.position(250, 200);

    var r4 = new RoughElement({
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
                text: 'Dots',
                fill: '#31d0c6'
            }
        }
    });

    r4.resize(120, 120);
    r4.position(80, 250);

    // Links

    var rl1 = new RoughLink();
    rl1.source(r1, { selector: 'border' });
    rl1.target(r2, { selector: 'border' });

    var rl2 = new RoughLink({ attrs: { line: { rough: { bowing: 4 }}}});
    rl2.source(r1, { selector: 'border' });
    rl2.target(r3, { selector: 'border' });

    var rl3 = new RoughLink();
    rl3.source(r1, { selector: 'border' });
    rl3.target(r4, { selector: 'border' });

    graph.resetCells([r1, r2, r3, r4, rl1, rl2, rl3]);

})(joint, rough, g);
