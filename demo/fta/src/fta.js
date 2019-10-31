(function(joint) {

    var graph = new joint.dia.Graph;

    var paper = new joint.dia.Paper({
        el: document.getElementById('paper'),
        width: 1000,
        height: 800,
        model: graph,
        defaultConnectionPoint: { name: 'boundary', args: { extrapolate: true }},
        defaultConnector: { name: 'rounded' },
        defaultRouter: { name: 'orthogonal' },
        async: true,
        interactive: false,
        frozen: true,
        sorting: joint.dia.Paper.sorting.APPROX
    });

    var boundary = new joint.elementTools.Boundary();
    boundary.el.setAttribute('stroke-dasharray', 'none');
    boundary.el.setAttribute('stroke-width', 2);
    boundary.el.setAttribute('stroke', '#2cbe4e');
    boundary.el.setAttribute('rx', 5);
    boundary.el.setAttribute('ry', 5);

    paper.on({
        'element:mouseenter': function(elementView) {
            var tools = new joint.dia.ToolsView({
                tools: [boundary]
            });
            elementView.addTools(tools);
        },
        'element:mouseleave': function(elementView) {
            elementView.removeTools();
        },
        'element:gate:click': function(elementView) {
            var element = elementView.model;
            var gateType = element.attr(['gate', 'gateType']);
            var gateTypes = Object.keys(element.gateTypes);
            var index = gateTypes.indexOf(gateType);
            var newIndex = (index + 1) % gateTypes.length;
            element.setGateType(gateTypes[newIndex]);
        }
    });

    joint.dia.Element.define('fta.IntermediateEvent', {
        size: {
            width: 100,
            height: 100
        },
        z: 2,
        attrs: {
            root: {
                pointerEvents: 'bounding-box',
                title: 'Intermediate Event'
            },
            body: {
                refWidth: '100%',
                refHeight: -40,
                stroke: '#333333',
                fill: '#333333',
                fillOpacity: 0.2
            },
            gate: {
                event: 'element:gate:click',
                gateType: 'xor',
                fill: '#4C65DD',
                stroke: '#4C65DD',
                fillOpacity: 0.2,
                strokeWidth: 2,
                refX: '50%',
                refY: '100%',
                fillRule: 'nonzero',
                cursor: 'pointer'
            },
            label: {
                textWrap: {
                    height: -40,
                    width: -10,
                    ellipsis: true
                },
                refX: '50%',
                refY: '50%',
                refY2: -20,
                fontSize: 16,
                fontFamily: 'sans-serif',
                fill: '#333333',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'gate'
        }, {
            tagName: 'rect',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }],
        gateTypes: {
            or: 'M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0',
            xor: 'M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0 M -20 0 0 -30 M 0 -30 20 0',
            and: 'M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z',
            priority_and: 'M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z M -20 0 0 -30 20 0',
            inhibit: 'M -10 0 -20 -15 -10 -30 10 -30 20 -15 10 0 Z',
            transfer: 'M -20 0 20 0 0 -30 z',
        },
        setGateType: function(type) {
            this.attr(['gate'], {
                gateType: type,
                title: type
            });

        }
    }, {
        attributes: {
            gateType: {
                set: function(type) {
                    var data = this.model.gateTypes[type];
                    return { d: data ? data + 'M 0 -30 0 -40' : 'M 0 0 0 0' };
                }
            }
        }
    });

    joint.shapes.standard.Path.define('fta.ExternalEvent', {
        size: {
            width: 80,
            height: 100
        },
        z: 2,
        attrs: {
            root: {
                pointerEvents: 'bounding-box',
                title: 'External Event'
            },
            body: {
                refD: 'M 0 0 10 -10 20 0 20 40 0 40 Z',
                stroke: 'orange',
                fill: 'orange',
                fillOpacity: 0.2

            },
            label: {
                textWrap: {
                    width: -20,
                    height: -20,
                    ellipsis: true
                },
                fontSize: 13,
                fontFamily: 'sans-serif'
            },
        }
    });

    joint.shapes.standard.Path.define('fta.UndevelopedEvent', {
        size: {
            width: 140,
            height: 80
        },
        attrs: {
            root: {
                pointerEvents: 'bounding-box',
                title: 'Undeveloped Event'
            },
            z: 2,
            body: {
                refD: 'M -1 0 0 1 1 0 0 -1 Z',
                stroke: 'red',
                fill: 'red',
                fillOpacity: 0.2
            },
            label: {
                textWrap: {
                    width: -20,
                    height: -20,
                    ellipsis: true
                },
                fontSize: 13,
                fontFamily: 'sans-serif'
            },
        }
    });

    joint.shapes.standard.Circle.define('fta.BasicEvent', {
        size: {
            width: 80,
            height: 80
        },
        z: 2,
        attrs: {
            root: {
                pointerEvents: 'bounding-box',
                title: 'Basic Event'
            },
            body: {
                stroke: 'purple',
                fill: 'purple',
                fillOpacity: 0.2
            },
            label: {
                textWrap: {
                    width: -20,
                    height: -20,
                    ellipsis: true
                },
                fontSize: 13,
                fontFamily: 'sans-serif'
            }
        }
    });

    joint.shapes.standard.Ellipse.define('fta.ConditioningEvent', {
        size: {
            width: 140,
            height: 80
        },
        z: 2,
        attrs: {
            root: {
                pointerEvents: 'bounding-box',
                title: 'Conditioning Event'
            },
            body: {
                stroke: 'blue',
                fill: 'blue',
                fillOpacity: 0.2
            },
            label: {
                textWrap: {
                    width: -20,
                    height: -20,
                    ellipsis: true
                },
                fontSize: 13,
                fontFamily: 'sans-serif'
            }
        }
    });

    function event(text, type) {
        var event = new joint.shapes.fta.IntermediateEvent({
            attrs: {
                label: { text: text }
            }
        });
        event.setGateType(type);
        return event.addTo(graph);
    }

    function undeveloped(text) {
        var undevelopedEvent = new joint.shapes.fta.UndevelopedEvent({
            attrs: {
                label: { text: text }
            }
        });
        return undevelopedEvent.addTo(graph);
    }

    function basic(text) {
        var basicEvent = new joint.shapes.fta.BasicEvent({
            attrs: {
                label: { text: text }
            }
        });
        return basicEvent.addTo(graph);
    }

    function external(text) {
        var externalEvent = new joint.shapes.fta.ExternalEvent({
            attrs: {
                label: { text: text },
            }
        });
        return externalEvent.addTo(graph);
    }

    function conditioning(text) {
        var conditioningEvent = new joint.shapes.fta.ConditioningEvent({
            attrs: {
                label: { text: text },
            }
        });
        return conditioningEvent.addTo(graph);
    }


    function connect(e1, e2) {
        var link = new joint.shapes.standard.Link({
            z: -1,
            source: { id: e1.id, selector: 'gate' },
            target: { id: e2.id, selector: 'body' },
            attrs: {
                line: {
                    targetMarker: null
                }
            }
        });
        return link.addTo(graph);
    }

    function layout(graph) {
        var autoLayoutElements = [];
        var manualLayoutElements = [];
        graph.getElements().forEach(function(el) {
            if (el.get('type') === 'fta.ConditioningEvent') {
                manualLayoutElements.push(el);
            } else {
                autoLayoutElements.push(el);
            }
        });
        // Automatic Layout
        joint.layout.DirectedGraph.layout(graph.getSubgraph(autoLayoutElements), {
            setVertices: true,
            marginX: 20,
            marginY: 20
        });
        // Manual Layout
        manualLayoutElements.forEach(function(el) {
            var neighbor = graph.getNeighbors(el, { inbound: true })[0];
            if (!neighbor) return;
            var neighborPosition = neighbor.getBBox().bottomRight();
            el.position(neighborPosition.x + 20, neighborPosition.y - 20 - 40);
        });
    }

    var event1 = event('Fall from Scaffolding', 'inhibit');
    var event2 = event('Fall from the Scaffolding', 'and');
    var event3 = event('Safety Belt Not Working', 'or');
    var event4 = event('Fall By Accident', 'or');
    var event5 = event('Broken By Equipment', 'or');
    var event6 = event('Did not Wear Safety Belt', 'or');
    var event7 = undeveloped('Slip and Fall');
    var event8 = undeveloped('Lose Balance');
    var event10 = undeveloped('Upholder Broken');
    var event11 = basic('Safety Belt Broken');
    var event12 = basic('Forgot to Wear');
    var event13 = external('Take off When Walking');
    var event14 = conditioning('Height and Ground Condition');

    connect(event1, event2);
    connect(event2, event3);
    connect(event2, event4);
    connect(event3, event5);
    connect(event3, event6);
    connect(event4, event7);
    connect(event4, event8);
    connect(event5, event10);
    connect(event5, event11);
    connect(event6, event13);
    connect(event6, event12);
    connect(event1, event14);

    layout(graph);

    paper.unfreeze();

})(joint);
