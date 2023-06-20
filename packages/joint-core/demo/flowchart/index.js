const { dia, shapes, highlighters, linkTools } = joint;

// Styles

const unit = 4;
const bevel = 2 * unit;
const spacing = 2 * unit;
const flowSpacing = unit / 2;

const rootEl = document.querySelector(':root');
rootEl.style.setProperty('--flow-spacing', `${flowSpacing}px`);

const fontAttributes = {
    fontFamily: 'PPFraktionSans, sans-serif',
    fontStyle: 'normal',
    fontSize: 14,
    lineHeight: 18
};

// Paper & Graph

const paperContainer = document.getElementById('canvas');
const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: 'transparent' },
    snapLabels: true,
    clickThreshold: 10,
    interactive: {
        linkMove: false
    },
    gridSize: 5,
    defaultConnectionPoint: {
        name: 'boundary',
        args: {
            offset: spacing,
            extrapolate: true
        }
    },
    defaultRouter: { name: 'rightAngle', args: { margin: unit * 7 }},
    defaultConnector: { name: 'straight', args: { cornerType: 'line', cornerPreserveAspectRatio: true }} // bevelled path
});
paperContainer.appendChild(paper.el);

// Flowchart content

function createStart(x, y, text) {
    return new shapes.standard.Rectangle({
        position: { x: x + 10, y: y + 5 },
        size: { width: 80, height: 50 },
        z: 1,
        attrs: {
            body: {
                class: 'jj-start-body',
                rx: 25,
                ry: 25,
            },
            label: {
                class: 'jj-start-text',
                ...fontAttributes,
                fontSize: fontAttributes.fontSize * 1.4,
                fontWeight: 'bold',
                text
            }
        }
    });
}

function createStep(x, y, text) {
    return new shapes.standard.Path({
        position: { x, y },
        size: { width: 100, height: 60 },
        z: 1,
        attrs: {
            body: {
                class: 'jj-step-body',
                d: `M 0 ${bevel} ${bevel} 0 calc(w-${bevel}) 0 calc(w) ${bevel} calc(w) calc(h-${bevel}) calc(w-${bevel}) calc(h) ${bevel} calc(h) 0 calc(h-${bevel}) Z`
            },
            label: {
                ...fontAttributes,
                class: 'jj-step-text',
                text,
                textWrap: {
                    width: -spacing,
                    height: -spacing,
                }
            }
        }
    });
}

function createDecision(x, y, text) {
    return new shapes.standard.Path({
        position: { x: x - 30, y: y - 10 },
        size: { width: 160, height: 80 },
        z: 1,
        attrs: {
            body: {
                class: 'jj-decision-body',
                d: 'M 0 calc(0.5 * h) calc(0.5 * w) 0 calc(w) calc(0.5 * h) calc(0.5 * w) calc(h) Z',
            },
            label: {
                ...fontAttributes,
                class: 'jj-decision-text',
                text
            }
        }
    });
}

function createFlow(source, target, sourceAnchor = 'right', targetAnchor = 'left') {
    return new shapes.standard.Link({
        source: { id: source.id, anchor: { name: sourceAnchor }},
        target: { id: target.id, anchor: { name: targetAnchor }},
        z: 2,
        attrs: {
            line: {
                class: 'jj-flow-line',
                targetMarker: {
                    class: 'jj-flow-arrowhead',
                    d: `M 0 0 L ${2*unit} ${unit} L ${2*unit} -${unit} Z`
                }
            },
            // The `outline` path is added to the `standard.Link` below in `markup``
            // We want to keep the `wrapper` path to do its original job,
            // which is the hit testing
            outline: {
                class: 'jj-flow-outline',
                connection: true,
            },
        },
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
            selector: 'outline',
            attributes: {
                'fill': 'none',
                'pointer-events': 'none'
            }
        }, {
            tagName: 'path',
            selector: 'line',
            attributes: {
                'fill': 'none',
                'pointer-events': 'none'
            }
        }],
        defaultLabel: {
            attrs: {
                labelBody: {
                    class: 'jj-flow-label-body',
                    ref: 'labelText',
                    d: `
                        M calc(x-${spacing}) calc(y-${spacing})
                        m 0 ${bevel} l ${bevel} -${bevel}
                        h calc(w+${2 * (spacing - bevel)}) l ${bevel} ${bevel}
                        v calc(h+${2 * (spacing - bevel)}) l -${bevel} ${bevel}
                        H calc(x-${spacing - bevel}) l -${bevel} -${bevel} Z
                    `,

                },
                labelText: {
                    ...fontAttributes,
                    class: 'jj-flow-label-text',
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fontStyle: 'italic'
                }
            },
            markup: [
                {
                    tagName: 'path',
                    selector: 'labelBody'
                }, {
                    tagName: 'text',
                    selector: 'labelText'
                }
            ],
        }
    });
}

const start = createStart(50, 40, 'Start');
const addToCart = createStep(200, 40, 'Add to Cart');
const checkoutItems = createStep(350, 40, 'Checkout Items');
const addShippingInfo = createStep(500, 40, 'Add Shipping Info');
const addPaymentInfo = createStep(500, 140, 'Add Payment Info');
const validPayment = createDecision(500, 250, 'Valid Payment?');
const presentErrorMessage = createStep(750, 250, 'Present Error Message');
const sendOrderToWarehouse = createStep(200, 250, 'Send Order to Warehouse');
const packOrder = createStep(200, 350, 'Pack Order');
const qualityCheck = createDecision(200, 460, 'Quality Check?');
const shipItemsToCustomer = createStep(500, 460, 'Ship Items to Customer');

graph.addCells([
    start,
    addToCart,
    checkoutItems,
    addShippingInfo,
    addPaymentInfo,
    validPayment,
    presentErrorMessage,
    sendOrderToWarehouse,
    packOrder,
    qualityCheck,
    shipItemsToCustomer,
    createFlow(start, addToCart, 'right', 'left'),
    createFlow(addToCart, checkoutItems, 'right', 'left'),
    createFlow(checkoutItems, addShippingInfo, 'right', 'left'),
    createFlow(addShippingInfo, addPaymentInfo, 'bottom', 'top'),
    createFlow(addPaymentInfo, validPayment, 'bottom', 'top'),
    createFlow(validPayment, presentErrorMessage, 'right', 'left')
        .labels([{ attrs: { labelText: { text: 'No' }}}]),
    createFlow(presentErrorMessage, addPaymentInfo, 'top', 'right')
        .vertices([{ x: 800, y: 170 }]),
    createFlow(validPayment, sendOrderToWarehouse, 'left', 'right')
        .labels([{ attrs: { labelText: { text: 'Yes' }}}]),
    createFlow(sendOrderToWarehouse, packOrder, 'bottom', 'top'),
    createFlow(packOrder, qualityCheck, 'bottom', 'top'),
    createFlow(qualityCheck, shipItemsToCustomer, 'right', 'left')
        .labels([{ attrs: { labelText: { text: 'Ok' }}}]),
    createFlow(qualityCheck, sendOrderToWarehouse, 'left', 'left')
        .labels([{ attrs: { labelText: { text: 'Not Ok' }}}])
        .vertices([{ x: 100, y: 490 }, { x: 100, y: 280 }])
]);

// Automatically scale the content to fit the paper.

const graphBBox = graph.getBBox();

function transformToFitContent() {
    paper.transformToFitContent({
        padding: 30,
        contentArea: graphBBox,
        verticalAlign: 'middle',
        horizontalAlign: 'middle',
    });
}

window.addEventListener('resize', () => transformToFitContent());
transformToFitContent();

// Theme switcher.

document.querySelector('.theme-switch').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
}, false);

// Add a frame around the element when the mouse enters the element.

const { mask: MaskHighlighter, stroke: StrokeHighlighter } = highlighters;

paper.on('cell:mouseenter', (cellView, evt) => {
    let selector, padding;
    if (cellView.model.isLink()) {
        if (StrokeHighlighter.get(cellView, 'selection')) return;
        // In case of a link, the frame is added around the label.
        selector = { label: 0, selector: 'labelBody' };
        padding = unit / 2;
    } else {
        selector = 'body';
        padding = unit;
    }
    const frame = MaskHighlighter.add(cellView, selector, 'frame', {
        padding,
        layer: dia.Paper.Layers.FRONT,
        attrs: {
            'stroke-width': 1.5,
            'stroke-linejoin': 'round',
        }
    });
    frame.el.classList.add('jj-frame');
});

paper.on('cell:mouseleave', cellView => {
    MaskHighlighter.removeAll(paper, 'frame');
});

paper.on('link:pointerclick', cellView => {
    paper.removeTools();
    dia.HighlighterView.removeAll(paper);
    const snapAnchor = function(coords, endView) {
        const bbox = endView.model.getBBox();
        // Find the closest point on the bbox border.
        const point = bbox.pointNearestToPoint(coords);
        const center = bbox.center();
        // Snap the point to the center of the bbox if it's close enough.
        const snapRadius = 10;
        if (Math.abs(point.x - center.x) < snapRadius) {
            point.x = center.x;
        }
        if (Math.abs(point.y - center.y) < snapRadius) {
            point.y = center.y;
        }
        return point;
    };
    const toolsView = new dia.ToolsView({
        tools: [
            new linkTools.TargetAnchor({
                snap: snapAnchor,
                resetAnchor: cellView.model.prop(['target', 'anchor'])
            }),
            new linkTools.SourceAnchor({
                snap: snapAnchor,
                resetAnchor: cellView.model.prop(['source', 'anchor'])
            }),
        ]
    });
    toolsView.el.classList.add('jj-flow-tools');
    cellView.addTools(toolsView);
    // Add copy of the link <path> element behind the link.
    // The selection link frame should be behind all elements and links.
    const strokeHighlighter = StrokeHighlighter.add(cellView, 'root', 'selection', {
        layer: dia.Paper.Layers.BACK,
    });
    strokeHighlighter.el.classList.add('jj-flow-selection');
});

paper.on('blank:pointerdown', () => {
    paper.removeTools();
    dia.HighlighterView.removeAll(paper);
});
