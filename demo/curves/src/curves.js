const { dia, shapes, linkTools, connectors } = joint;

// Theme

const highlighterAttributes = {
    'stroke': '#4666E5',
    'stroke-width': 2,
    'stroke-linecap': 'butt',
    'stroke-linejoin': 'miter',
};

const connectToolAttributes = {
    'fill': 'none',
    'stroke-width': 10,
    'stroke-opacity': 0.4,
    'stroke': '#4666E5',
    'cursor': 'cell',
};

const lineAttributes = {
    stroke: '#333333',
    strokeWidth: 2,
};

const labelAttributes = {
    textVerticalAnchor: 'middle',
    textAnchor: 'middle',
    x: 'calc(.5*w)',
    y: 'calc(.5*h)',
    fill: '#333333',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
    fontVariant: 'small-caps',
    pointerEvents: 'none',
};

const bodyAttributes = {
    fill: '#FCFCFC',
    stroke: '#333333',
    strokeWidth: 2,
    cursor: 'grab',
};

const ShapeTypes = {
    BASE: 'Base',
    RHOMBUS: 'Rhombus',
    RECTANGLE: 'Rectangle',
    ELLIPSE: 'Ellipse',
    LINK: 'Link',
};

// Setup

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    cellViewNamespace: shapes,
    width: 1000,
    height: 600,
    gridSize: 1,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    snapLinks: true,
    highlighting: {
        default: {
            name: 'mask',
            options: {
                attrs: {
                    ...highlighterAttributes
                }
            }
        }
    },
    // This demo does not use the connection points
    defaultConnectionPoint: { name: 'anchor' },
    connectionStrategy: function(end, view, _, coords) {
        const { x, y } = view.model.getBoundaryPoint(coords);
        end.anchor = {
            name: 'topLeft',
            args: {
                dx: x,
                dy: y,
                rotate: true
            }
        };
    },
    defaultConnector: function(sourcePoint, targetPoint, route, _, linkView) {
        const { model: link } = linkView;
        const targetElement = link.getTargetElement();
        const sourceElement = link.getSourceElement();
        const options = {
            targetDirection: targetElement ? targetElement.getCurveDirection(targetPoint) : 'auto',
            sourceDirection:  sourceElement ? sourceElement.getCurveDirection(sourcePoint) : 'auto',
            algorithm: 'new'
        };
        return connectors.smooth.call(linkView, sourcePoint, targetPoint, route, options, linkView);
    },
    defaultLink: () => new Link()
});

paper.svg.style.overflow = 'visible';
paper.el.style.border = '1px solid #E5E5E5';
paper.on({
    'cell:mouseenter': (view) => {
        addTools(view);
    },
    'cell:mouseleave': (view) => {
        removeTools(view);
    }
});

graph.on({
    'add': (cell) => {
        addTools(cell.findView(paper));
    }
});

const Base = dia.Element.define(ShapeTypes.BASE, {
    z: 1
}, {
    getConnectToolMarkup() {
        return [{
            tagName: 'rect',
            attributes: {
                ...this.size(),
                ...connectToolAttributes
            }
        }];
    },

    getCurveDirection() {
        return 'auto';
    },

    getBoundaryPoint(point, snapRadius = 20) {
        const bbox = this.getBBox();
        const angle = this.angle();
        // Relative to the element's position
        const relPoint = point.clone().rotate(bbox.center(), angle).difference(bbox.topLeft());
        const relBBox = new g.Rect(0, 0, bbox.width, bbox.height);
        if (!relBBox.containsPoint(relPoint)) {
            const relCenter = relBBox.center();
            const relTop = relBBox.topMiddle();
            const relLeft = relBBox.leftMiddle();
            if (Math.abs(relTop.x - relPoint.x) < snapRadius) {
                return (relCenter.y > relPoint.y) ? relTop : relBBox.bottomMiddle();
            }
            if (Math.abs(relLeft.y - relPoint.y) < snapRadius) {
                return (relCenter.x > relPoint.x) ? relLeft : relBBox.rightMiddle();
            }
        }
        return this.getClosestBoundaryPoint(relBBox, relPoint);
    },

    getClosestBoundaryPoint(bbox, point) {
        return bbox.pointNearestToPoint(point);
    },

    getTools() {
        return [
            new linkTools.Connect({
                focusOpacity: 0,
                markup: this.getConnectToolMarkup()
            })
        ];
    }
});

const Link = shapes.standard.Link.define(ShapeTypes.LINK, {
    attrs: {
        line: {
            ...lineAttributes
        }
    },
    z: 2
}, {
    getTools() {
        return [
            new linkTools.Vertices(),
            new linkTools.Remove(),
            new linkTools.SourceArrowhead(),
            new linkTools.TargetArrowhead(),
        ];
    }
});

const Rhombus = Base.define(ShapeTypes.RHOMBUS, {
    size: { width: 140, height: 70 },
    attrs: {
        root: {
            highlighterSelector: 'body'
        },
        body: {
            d: 'M calc(.5*w) 0 calc(w) calc(.5*h) calc(.5*w) calc(h) 0 calc(.5*h) Z',
            ...bodyAttributes
        },
        label: {
            text: 'Rhombus',
            ...labelAttributes
        }
    }
}, {
    markup: [{
        tagName: 'path',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }],

    getConnectToolMarkup() {
        const { width, height } = this.size();
        return [{
            tagName: 'path',
            attributes: {
                d: `M ${width/2} 0 ${width} ${height/2} ${width/2} ${height} 0 ${height/2} Z`,
                ...connectToolAttributes
            }
        }];
    },

    getCurveDirection(point) {
        const bbox = this.getBBox();
        const angle = bbox.center().angleBetween(point, bbox.topMiddle());
        if (angle % 90 === 0) {
            return 'auto';
        }
        let ratio = bbox.height / bbox.width;
        if ((angle % 180) < 90) {
            ratio = 1 / ratio;
        }
        const directionAngle = 360 - Math.floor(angle / 90) * 90 + g.toDeg(Math.atan(ratio));
        return g.Point(1,0).rotate(g.Point(0,0), directionAngle);
    },

    getClosestBoundaryPoint(bbox, point) {
        const rhombus = new g.Polyline([
            bbox.topMiddle(),
            bbox.rightMiddle(),
            bbox.bottomMiddle(),
            bbox.leftMiddle(),
            bbox.topMiddle()
        ]);
        return rhombus.closestPoint(point);
    }
});

const Rectangle = Base.define(ShapeTypes.RECTANGLE, {
    size: { width: 140, height: 70 },
    attrs: {
        root: {
            highlighterSelector: 'body'
        },
        body: {
            width: 'calc(w)',
            height: 'calc(h)',
            ...bodyAttributes
        },
        label: {
            text: 'Rectangle',
            ...labelAttributes
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'body',
    }, {
        tagName: 'text',
        selector: 'label'
    }]
});

const Ellipse = Base.define(ShapeTypes.ELLIPSE, {
    size: { width: 140, height: 70 },
    attrs: {
        root: {
            highlighterSelector: 'body'
        },
        body: {
            cx: 'calc(.5*w)',
            cy: 'calc(.5*h)',
            rx: 'calc(.5*w)',
            ry: 'calc(.5*h)',
            ...bodyAttributes
        },
        label: {
            text: 'Ellipse',
            ...labelAttributes
        }
    }
}, {
    markup: [{
        tagName: 'ellipse',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }],

    getConnectToolMarkup() {
        const { width, height } = this.size();
        return [{
            tagName: 'ellipse',
            attributes: {
                'rx': width / 2,
                'ry': height / 2,
                'cx': width / 2,
                'cy': height / 2,
                ...connectToolAttributes
            }
        }];
    },

    getCurveDirection() {
        return 'outwards';
    },

    getClosestBoundaryPoint(bbox, point) {
        const ellipse = g.Ellipse.fromRect(bbox);
        return ellipse.intersectionWithLineFromCenterToPoint(point);
    }

});

const rhombus = new Rhombus({
    position: { x: 250, y: 250 }
});

const rectangle = new Rectangle({
    position: { x: 650, y: 50 }
});

const ellipse = new Ellipse({
    position: { x: 650, y: 450 }
});

const link1 = new Link({
    source: {
        id: rectangle.id,
        anchor: {
            name: 'bottom'
        }
    },
    target: {
        id: rhombus.id,
        anchor: {
            name: 'topLeft',
            args: {
                dx: 113.6,
                dy: 48.2,
                rotate: true
            }
        }
    }
});

const link2 = new Link({
    source: {
        id: rectangle.id,
        anchor: {
            name: 'bottom'
        }
    },
    target: {
        id: ellipse.id,
        anchor: {
            name: 'topLeft',
            args: {
                dx: 112.2,
                dy: 7,
                rotate: true
            }
        }
    }
});

const link3 = new Link({
    source: {
        id: ellipse.id,
        anchor: {
            name: 'topLeft',
            args: {
                dx: 8.893956250391483,
                dy: 52.07374751827297,
                rotate: true
            }
        }
    },
    target: {
        id: rhombus.id,
        anchor: {
            name: 'topLeft',
            args: {
                dx: 98.00000000000001,
                dy: 56,
                rotate: true
            }
        }
    }
});

graph.resetCells([
    rectangle,
    ellipse,
    rhombus,
    link1,
    link2,
    link3
]);

// Tools

function addTools(view) {
    const { paper, model } = view;
    paper.removeTools();
    const tools = new dia.ToolsView({ tools: model.getTools() });
    view.el.classList.add('active');
    view.addTools(tools);
}

function removeTools(view) {
    view.el.classList.remove('active');
    view.removeTools();
}

