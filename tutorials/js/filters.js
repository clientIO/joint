(function filters() {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper-filters'),
        model: graph,
        width: 660,
        height: 240,
        gridSize: 1
    });

    var el = new joint.shapes.standard.Rectangle();
    el.position(0, 0);
    el.resize(100, 40);
    el.attr({
        body: {
            rx: 2,
            ry: 2,
            fill: '#2ecc71',
            stroke: '#27ae60',
            strokeWidth: 2
        },
        label: {
            fontSize: 10,
            fill: '#333333'
        }
    });

    var dropShadow = el.clone();
    dropShadow.translate(20, 20);
    dropShadow.attr({
        body: {
            filter: {
                name: 'dropShadow',
                args: {
                    dx: 2,
                    dy: 2,
                    blur: 3
                }
            }
        },
        label: {
            text: 'dropShadow(2,2,3)'
        }
    });
    dropShadow.addTo(graph);

    var blur = el.clone();
    blur.translate(150, 20);
    blur.attr({
        body: {
            filter: {
                name: 'blur',
                args: {
                    x: 5
                }
            }
        },
        label: {
            text: 'blur(5)'
        }
    });
    blur.addTo(graph);

    var grayscale = el.clone();
    grayscale.translate(280, 20);
    grayscale.attr({
        body: {
            filter: {
                name: 'grayscale'
            }
        },
        label: {
            text: 'grayscale(1)'
        }
    });
    grayscale.addTo(graph);

    var sepia = el.clone();
    sepia.translate(410, 20);
    sepia.attr({
        body: {
            filter: {
                name: 'sepia'
            }
        },
        label: {
            text: 'sepia(1)'
        }
    });
    sepia.addTo(graph);

    var invert = el.clone();
    invert.translate(540, 20);
    invert.attr({
        body: {
            filter: {
                name: 'invert'
            }
        },
        label: {
            text: 'invert(1)'
        }
    });
    invert.addTo(graph);

    var saturate = el.clone();
    saturate.translate(20, 100);
    saturate.attr({
        body: {
            filter: {
                name: 'saturate',
                args: {
                    amount: 0.5
                }
            }
        },
        label: {
            text: 'saturate(0.5)'
        }
    });
    saturate.addTo(graph);

    var brightness = el.clone();
    brightness.translate(150, 100);
    brightness.attr({
        body: {
            filter: {
                name: 'brightness',
                args: {
                    amount: 0.5
                }
            }
        },
        label: {
            text: 'brightness(0.5)'
        }
    });
    brightness.addTo(graph);

    var contrast = el.clone();
    contrast.translate(280, 100);
    contrast.attr({
        body: {
            filter: {
                name: 'contrast',
                args: {
                    amount: 0.5
                }
            }
        },
        label: {
            text: 'contrast(0.5)'
        }
    });
    contrast.addTo(graph);

    var outline = el.clone();
    outline.translate(410, 100);
    outline.attr({
        body: {
            filter: {
                name: 'outline',
                args: {
                    color: 'red',
                    width: 2,
                    opacity: 1,
                    margin: 5
                }
            }
        },
        label: {
            text: 'outline(\'red\',2,1,5)'
        }
    });
    outline.addTo(graph);

    var highlight = el.clone();
    highlight.translate(540, 100);
    highlight.attr({
        body: {
            filter: {
                name: 'highlight',
                args: {
                    color: 'red',
                    width: 2,
                    opacity: 0.5,
                    blur: 5
                }
            }
        },
        label: {
            text: 'highlight(\'red\',2,0.5,5)'
        }
    });
    highlight.addTo(graph);

    var hueRotate = el.clone();
    hueRotate.translate(20, 180);
    hueRotate.attr({
        body: {
            filter: {
                name: 'hueRotate',
                args: {
                    angle: 50
                }
            }
        },
        label: {
            text: 'hueRotate(50)'
        }
    });
    hueRotate.addTo(graph);

    var link = new joint.shapes.standard.Link();
    link.source(new g.Point(150, 180));
    link.target(new g.Point(640, 220));
    link.attr({
        line: {
            sourceMarker: {
                'type': 'path',
                'd': 'M 10 -5 0 0 10 5 z',
                'fill': 'red'
            },
            targetMarker: {
                // inherits `type` from default standard link
                // inherits `d` from default standard link
                'fill': 'red'
            },
            filter: {
                name: 'dropShadow',
                args: {
                    dx: 2,
                    dy: 2,
                    blur: 3
                }
            }
        }
    });
    link.appendLabel({
        attrs: {
            filter: 'unset',
            text: {
                text: 'dropShadow(2,2,3)'
            },
        }
    })
    graph.addCell(link);
}());
