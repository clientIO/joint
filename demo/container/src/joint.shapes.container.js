(function(joint) {

    joint.shapes.standard.Link.define('container.Link', {
        attrs: {
            line: {
                stroke: '#222222',
                strokeWidth: 1,
                targetMarker: {
                    'd': 'M 4 -4 0 0 4 4 M 7 -4 3 0 7 4 M 10 -4 6 0 10 4',
                    'fill': 'none'
                }
            }
        }
    });

    joint.dia.Element.define('container.Child', {
        size: { width: 50, height: 50 },
        attrs: {
            root: {
                magnetSelector: 'body'
            },
            shadow: {
                refWidth: '100%',
                refHeight: '100%',
                x: 3,
                y: 3,
                fill: '#000000',
                opacity: 0.2
            },
            body: {
                refWidth: '100%',
                refHeight: '100%',
                strokeWidth: 1,
                stroke: '#FF4365',
                fill: '#F9DBDF'
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '50%',
                fontSize: 14,
                fontFamily: 'sans-serif',
                fill: '#222222'
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'shadow',
        }, {
            tagName: 'rect',
            selector: 'body',
        }, {
            tagName: 'text',
            selector: 'label'
        }]
    });

    var headerHeight = 30;
    var buttonSize = 14;

    joint.dia.Element.define('container.Parent', {
        collapsed: false,
        attrs: {
            root: {
                magnetSelector: 'body'
            },
            shadow: {
                refWidth: '100%',
                refHeight: '100%',
                x: 3,
                y: 3,
                fill: '#000000',
                opacity: 0.05
            },
            body: {
                refWidth: '100%',
                refHeight: '100%',
                strokeWidth: 1,
                stroke: '#DDDDDD',
                fill: '#FCFCFC'
            },
            header: {
                refWidth: '100%',
                height: headerHeight,
                strokeWidth: 0.5,
                stroke: '#4666E5',
                fill: '#4666E5'
            },
            headerText: {
                textVerticalAnchor: 'middle',
                textAnchor: 'start',
                refX: 8,
                refY: headerHeight / 2,
                fontSize: 16,
                fontFamily: 'sans-serif',
                letterSpacing: 1,
                fill: '#FFFFFF',
                textWrap: {
                    width: -40,
                    maxLineCount: 1,
                    ellipsis: '*'
                },
                style: {
                    textShadow: '1px 1px #222222',
                }
            },
            button: {
                refDx: - buttonSize - (headerHeight - buttonSize) / 2,
                refY: (headerHeight - buttonSize) / 2,
                cursor: 'pointer',
                event: 'element:button:pointerdown',
                title: 'Collapse / Expand'
            },
            buttonBorder: {
                width: buttonSize,
                height: buttonSize,
                fill: '#000000',
                fillOpacity: 0.2,
                stroke: '#FFFFFF',
                strokeWidth: 0.5,
            },
            buttonIcon: {
                fill: 'none',
                stroke: '#FFFFFF',
                strokeWidth: 1
            }
        }
    }, {

        markup: [{
            tagName: 'rect',
            selector: 'shadow'
        }, {
            tagName: 'rect',
            selector: 'body'
        }, {
            tagName: 'rect',
            selector: 'header'
        }, {
            tagName: 'text',
            selector: 'headerText'
        }, {
            tagName: 'g',
            selector: 'button',
            children: [{
                tagName: 'rect',
                selector: 'buttonBorder'
            }, {
                tagName: 'path',
                selector: 'buttonIcon'
            }]
        }],

        toggle: function(shouldCollapse) {
            var buttonD;
            var collapsed = (shouldCollapse === undefined) ? !this.get('collapsed') : shouldCollapse;
            if (collapsed) {
                buttonD = 'M 2 7 12 7 M 7 2 7 12';
                this.resize(140, 30);
            } else {
                buttonD = 'M 2 7 12 7';
                this.fitChildren();
            }
            this.attr(['buttonIcon','d'], buttonD);
            this.set('collapsed', collapsed);
        },

        isCollapsed: function() {
            return Boolean(this.get('collapsed'));
        },

        fitChildren: function() {
            var padding = 10;
            this.fitEmbeds({
                padding: {
                    top: headerHeight + padding,
                    left: padding,
                    right: padding,
                    bottom: padding
                }
            });
        }
    });

})(joint);
