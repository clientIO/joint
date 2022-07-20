(function(joint) {

    var Event = joint.dia.Element.define('fta.Event', {
        z: 3,
        attrs: {
            root: {
                pointerEvents: 'bounding-box'
            },
            body: {
                strokeWidth: 2,
                fillOpacity: 0.2
            },
            label: {
                textWrap: {
                    height: -20,
                    width: -20,
                    ellipsis: true
                },
                x: 'calc(0.5 * w)',
                y: 'calc(0.5 * h)',
                fontSize: 16,
                fontFamily: 'sans-serif',
                fill: '#333333',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle'
            }
        }
    }, {
        // Prototype
    }, {
        // Static
        create: function(text) {
            return new this({
                attrs: {
                    label: { text: text }
                }
            });
        }
    });

    Event.define('fta.IntermediateEvent', {
        size: {
            width: 100,
            height: 100
        },
        attrs: {
            root: {
                title: 'Intermediate Event'
            },
            body: {
                width: 'calc(w)',
                height: 'calc(h - 40)',
                stroke: '#3c4260',
                fill: '#3c4260'
            },
            gate: {
                event: 'element:gate:click',
                gateType: 'xor',
                stroke: '#7c68fc',
                fill: '#7c68fc',
                fillOpacity: 0.2,
                strokeWidth: 2,
                fillRule: 'nonzero',
                cursor: 'pointer'
            },
            label: {
                textWrap: {
                    height: -40,
                    width: -10,
                },
                y: 30
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
            or: 'M calc(0.5 * w - 20) calc(h - 10) C calc(0.5 * w - 20) calc(0.6 * h - 10) calc(0.5 * w + 20) calc(0.6 * h - 10) calc(0.5 * w + 20) calc(h - 10) C calc(0.5 * w + 20) calc(h - 15) calc(0.5 * w - 20) calc(h - 15) calc(0.5 * w - 20) calc(h - 10)',
            xor: 'M calc(0.5 * w - 20) calc(h - 10) C calc(0.5 * w - 20) calc(0.6 * h - 10) calc(0.5 * w + 20) calc(0.6 * h - 10) calc(0.5 * w + 20) calc(h - 10) C calc(0.5 * w + 20) calc(h - 15) calc(0.5 * w - 20) calc(h - 15) calc(0.5 * w - 20) calc(h - 10) M calc(0.5 * w - 20) calc(h - 10) calc(0.5 * w) calc(0.6 * h) M calc(0.5 * w + 20) calc(h - 10) calc(0.5 * w) calc(0.6 * h)',
            and: 'M calc(0.5 * w - 20) calc(h - 10) C calc(0.5 * w - 20) calc(0.6 * h - 10) calc(0.5 * w + 20) calc(0.6 * h - 10) calc(0.5 * w + 20) calc(h - 10) Z',
            priority_and: 'M calc(0.5 * w - 20) calc(h - 10) C calc(0.5 * w - 20) calc(0.6 * h - 10) calc(0.5 * w + 20) calc(0.6 * h - 10) calc(0.5 * w + 20) calc(h - 10) Z M calc(0.5 * w - 20) calc(h - 10) calc(0.5 * w) calc(0.6 * h) M calc(0.5 * w + 20) calc(h - 10) calc(0.5 * w) calc(0.6 * h)',
            inhibit: 'M calc(0.5 * w - 10) calc(0.6 * h) L calc(0.5 * w - 20) calc(0.75 * h) L calc(0.5 * w - 10) calc(0.9 * h) calc(0.5 * w + 10) calc(0.9 * h) L calc(0.5 * w + 20) calc(0.75 * h) L calc(0.5 * w + 10) calc(0.6 * h) Z',
            transfer: 'M calc(0.5 * w) calc(0.6 * h) L calc(0.5 * w - 20) calc(0.9 * h) L calc(0.5 * w + 20) calc(0.9 * h) Z',
        },
        gate: function(type) {
            if (type === undefined) return this.attr(['gate', 'gateType']);
            return this.attr(['gate'], {
                gateType: type,
                d: this.gateTypes[type],
                title: type.toUpperCase() + ' Gate',
            });
        }
    });

    Event.define('fta.ExternalEvent', {
        size: {
            width: 80,
            height: 100
        },
        attrs: {
            root: {
                title: 'External Event'
            },
            body: {
                d: 'M 0 20 calc(0.5 * w) 0 calc(w) 20 calc(w) calc(h) 0 calc(h) Z',
                stroke: '#fe854f',
                fill: '#fe854f'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Event.define('fta.UndevelopedEvent', {
        size: {
            width: 140,
            height: 80
        },
        attrs: {
            root: {
                title: 'Undeveloped Event'
            },
            body: {
                d: 'M 0 calc(0.5 * h) calc(0.5 * w) calc(h) calc(w) calc(0.5 * h) calc(0.5 * w) 0 Z',
                stroke: '#feb663',
                fill: '#feb663'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Event.define('fta.BasicEvent', {
        size: {
            width: 80,
            height: 80
        },
        z: 3,
        attrs: {
            root: {
                title: 'Basic Event'
            },
            body: {
                cx: 'calc(0.5 * w)',
                cy: 'calc(0.5 * h)',
                r: 'calc(0.5 * w)',
                stroke: '#30d0c6',
                fill: '#30d0c6'
            }
        }
    }, {
        markup: [{
            tagName: 'circle',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    Event.define('fta.ConditioningEvent', {
        size: {
            width: 140,
            height: 80
        },
        z: 2,
        attrs: {
            root: {
                title: 'Conditioning Event'
            },
            body: {
                cx: 'calc(0.5 * w)',
                cy: 'calc(0.5 * h)',
                rx: 'calc(0.5 * w)',
                ry: 'calc(0.5 * h)',
                stroke: '#7c68fc',
                fill: '#7c68fc',
                fillOpacity: 0.2
            }
        }
    }, {
        markup: [{
            tagName: 'ellipse',
            selector: 'body'
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    joint.dia.Link.define('fta.Link', {
        attrs: {
            line: {
                connection: true,
                stroke: '#333333',
                strokeWidth: 2,
                strokeLinejoin: 'round'
            }
        }
    }, {
        markup: [{
            tagName: 'path',
            selector: 'line',
            attributes: {
                'fill': 'none',
                'pointer-events': 'none'
            }
        }]
    }, {
        create: function(event1, event2) {
            return new this({
                z: 1,
                source: {
                    id: event1.id,
                    selector: event1.get('type') === 'fta.IntermediateEvent' ? 'gate' : 'body'
                },
                target: {
                    id: event2.id,
                    selector: 'body'
                }
            });
        }
    });


})(joint);
