(function(joint) {

    const PADDING = 10;
    const HEADER_HEIGHT = 30;

    joint.dia.Element.define('container.Base', {
        // (no default attributes)
    }, {
        // (no custom markup)

        // prototype methods:
        fitAncestorElements: function() {
            this.fitParent({
                deep: true,
                padding: {
                    top: HEADER_HEIGHT + PADDING,
                    left: PADDING,
                    right: PADDING,
                    bottom: PADDING
                }
            });
        }
    }, {
        // (no static methods)
    });

    const childMarkup = joint.util.svg/* xml */`
        <rect @selector="shadow"/>
        <rect @selector="body"/>
        <text @selector="label"/>
    `;

    joint.shapes.container.Base.define('container.Child', {
        // default attributes:
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
        // custom markup:
        markup: childMarkup

        // (no prototype methods)
    }, {
        // static methods:
        isChild: function(obj) {
            return obj instanceof joint.shapes.container.Child;
        }
    });

    const containerMarkup = joint.util.svg/* xml */`
        <rect @selector="shadow"/>
        <rect @selector="body"/>
        <rect @selector="header"/>
        <text @selector="headerText"/>
    `;

    joint.shapes.container.Base.define('container.Parent', {
        // default attributes:
        size: { width: 10, height: 10 },
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
                height: HEADER_HEIGHT,
                strokeWidth: 0.5,
                stroke: '#4666E5',
                fill: '#4666E5'
            },
            headerText: {
                textVerticalAnchor: 'middle',
                textAnchor: 'start',
                refX: 8,
                refY: HEADER_HEIGHT / 2,
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
            }
        }
    }, {
        // custom markup:
        markup: containerMarkup,

        // prototype methods:
        toggle: function(shouldCollapse) {
            this.set(
                'collapsed',
                typeof shouldCollapse === 'boolean'
                    ? shouldCollapse
                    : !this.get('collapsed')
            );
        },

        isCollapsed: function() {
            return Boolean(this.get('collapsed'));
        },

        getFilteredChildren: function() {
            return this.get("filteredSources") || [];
        },

        isChildFiltered: function(child) {
            const sourceId = child.get("sourceId");
            if (!sourceId) return false;
            return this.getFilteredChildren().includes(sourceId);
        },

        fitToChildElements: function(flags) {
            if (this.getEmbeddedCells().length === 0) {
                this.resize(140, 100, flags);
            }
            this.fitToChildren({
                padding: {
                    top: HEADER_HEIGHT + PADDING,
                    left: PADDING,
                    right: PADDING,
                    bottom: PADDING
                },
                flags
            });
        }
    }, {
        // static methods:
        isContainer: function(obj) {
            return obj instanceof joint.shapes.container.Parent;
        }
    });

    joint.shapes.standard.Link.define('container.Link', {
        // default attributes:
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
    }, {
        // (no custom markup)

        // (no prototype methods)
    }, {
        // (no static methods)
    });

})(joint);
