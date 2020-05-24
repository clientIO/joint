(function(standard) {

    standard.Rectangle.define('sd.Role', {
        size: { width: 100, height: 80 },
        attrs: {
            body: {
                stroke: '#A0A0A0',
                strokeWidth: 1,
                rx: 3,
                ry: 3
            },
            label: {
                fontSize: 18,
                fontFamily: 'sans-serif',
                textWrap: {
                    width: -10
                }
            }
        }
    }, {
        setName: function(name) {
            this.attr(['label', 'text'], name);
        }
    });

    standard.Link.define('sd.Lifeline', {
        attrs: {
            line: {
                stroke: '#A0A0A0',
                strokeWidth: 1,
                strokeDasharray: '5,2',
                targetMarker: null
            }
        }
    }, {
        attachToRole: function(role, maxY) {
            const roleCenter = role.getBBox().center();
            this.set({
                source: { id: role.id },
                target: { x: roleCenter.x, y: maxY }
            });
            role.embed(this);
        }
    });

    standard.Link.define('sd.Message', {
        source: { anchor: { name: 'connectionLength' }},
        target: { anchor: { name: 'connectionPerpendicular' }},
        attrs: {
            line: {
                stroke: '#4666E5',
                sourceMarker: {
                    'type': 'path',
                    'd': 'M 0 -6 0 6',
                    'stroke-width': 3
                }
            },
            wrapper: {
                strokeWidth: 20,
                cursor: 'grab'
            },
        }
    }, {
        defaultLabel: {
            markup: [{
                tagName: 'rect',
                selector: 'labelBody'
            }, {
                tagName: 'text',
                selector: 'labelText'
            }],
            attrs: {
                labelBody: {
                    ref: 'labelText',
                    refWidth: '100%',
                    refHeight: '100%',
                    refWidth2: 20,
                    refHeight2: 10,
                    refX: -10,
                    refY: -5,
                    rx: 3,
                    ry: 3,
                    fill: '#22222'
                },
                labelText: {
                    refY: 10,
                    fill: '#FFFFFF',
                    fontSize: 12,
                    fontFamily: 'sans-serif',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'top',
                    cursor: 'grab'
                }
            }
        },
        setStart: function(y) {
            this.prop(['source', 'anchor', 'args', 'length'], y);
        },
        setFromTo: function(from, to) {
            this.prop({
                source: { id: from.id },
                target: { id: to.id }
            });
        },
        setDescription: function(description) {
            this.labels([{ attrs: { labelText: { text: description }}}]);
        }
    });

    standard.Rectangle.define('sd.RoleGroup', {
        z: -1,
        attrs: {
            body: {
                stroke: '#A0A0A0',
                strokeWidth: 1,
                strokeDasharray: '1,1',
                fill: '#F9FBFA'
            }
        }
    }, {
        fitRoles: function() {
            this.fitEmbeds({ padding: 10 });
        }
    });

})(joint.shapes.standard);
