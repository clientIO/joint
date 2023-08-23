const { dia, elementTools, shapes: defaultShapes, layout, util } = joint;

const Event = dia.Element.define(
    'fta.Event',
    {
        z: 3,
        attrs: {
            root: {
                pointerEvents: 'bounding-box',
            },
            body: {
                strokeWidth: 2,
                stroke: '#ed2637',
                fill: {
                    type: 'pattern',
                    attrs: {
                        width: 12,
                        height: 12,
                        'stroke-width': 2,
                        'stroke-opacity': 0.3,
                        stroke: '#ed2637',
                        fill: 'none',
                    },
                    markup: util.svg`
                        <rect width="12" height="12" fill="#131e29" stroke="none" />
                        <path d="M 0 0 L 12 12 M 6 -6 L 18 6 M -6 6 L 6 18" />
                    `,
                },
            },
            label: {
                textWrap: {
                    height: -20,
                    width: -20,
                    ellipsis: true,
                },
                x: 'calc(w / 2)',
                y: 'calc(h / 2)',
                fontSize: 16,
                fontFamily: 'sans-serif',
                fill: '#ffffff',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
            },
        },
    },
    {
        // Prototype
    },
    {
        // Static
        create: function(text) {
            return new this({
                attrs: {
                    label: { text: text },
                },
            });
        },
    }
);

const IntermediateEvent = Event.define(
    'fta.IntermediateEvent',
    {
        size: {
            width: 120,
            height: 150,
        },
        attrs: {
            root: {
                title: 'Intermediate Event',
            },
            body: {
                d: 'M 10 0 H calc(w-10) l 10 10 V calc(h - 90) l -10 10 H 10 l -10 -10 V 10 Z',
                stroke: '#ed2637',
                fill: '#131e29',
            },
            label: {
                textWrap: {
                    height: -90,
                    width: -20,
                },
                fontSize: 16,
                y: 'calc(h / 2 - 40)',
                fill: '#ffffff',
            },
            idBody: {
                width: 'calc(w - 20)',
                height: 30,
                y: 'calc(h - 70)',
                x: 10,
                fill: '#131e29',
                stroke: '#dde6ed',
                strokeWidth: 2,
            },
            idLabel: {
                y: 'calc(h - 55)',
                x: 'calc(w / 2)',
                fontSize: 14,
                fontFamily: 'sans-serif',
                fill: '#ffffff',
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
            },
            gate: {
                event: 'element:gate:click',
                gateType: 'xor',
                stroke: '#dde6ed',
                fill: {
                    type: 'pattern',
                    attrs: {
                        width: 6,
                        height: 6,
                        'stroke-width': 1,
                        'stroke-opacity': 0.3,
                        stroke: '#dde6ed',
                        fill: 'none',
                    },
                    markup: [
                        {
                            tagName: 'rect',
                            attributes: {
                                width: 6,
                                height: 6,
                                fill: '#131e29',
                                stroke: 'none',
                            },
                        },
                        {
                            tagName: 'path',
                            attributes: {
                                d: 'M 3 0 L 3 6',
                            },
                        },
                    ],
                },
                strokeWidth: 2,
                transform: 'translate(calc(w / 2), calc(h))',
                fillRule: 'nonzero',
                cursor: 'pointer',
            },
        },
    },
    {
        markup: util.svg`
            <path @selector="gate" />
            <path @selector="body" />
            <rect @selector="idBody" />
            <text @selector="label" />
            <text @selector="idLabel" />
        `,
        gateTypes: {
            or: 'M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0',
            xor: 'M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0 M -20 0 0 -30 M 0 -30 20 0',
            and: 'M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z',
            priority_and:
                'M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z M -20 0 0 -30 20 0',
            inhibit: 'M -10 0 -20 -15 -10 -30 10 -30 20 -15 10 0 Z',
            transfer: 'M -20 0 20 0 0 -30 z',
        },
        gate: function(type) {
            if (type === undefined) return this.attr(['gate', 'gateType']);
            return this.attr(['gate'], {
                gateType: type,
                title: type.toUpperCase() + ' Gate',
            });
        },
    },
    {
        attributes: {
            gateType: {
                set: function(type) {
                    const data = this.model.gateTypes[type];
                    return { d: data ? data + ' M 0 -30 0 -80' : 'M 0 0 0 0' };
                },
            },
        },

        create: function(text) {
            const id = Math.random().toString(36).substring(2, 8);
            return new this({
                id,
                attrs: {
                    label: { text },
                    idLabel: {
                        text: `id: ${id}`,
                        annotations: [
                            { start: 4, end: 10, attrs: { fill: '#f6f740' }},
                        ],
                    },
                },
            });
        },
    }
);

const ExternalEvent = Event.define(
    'fta.ExternalEvent',
    {
        size: {
            width: 80,
            height: 100,
        },
        attrs: {
            root: {
                title: 'External Event',
            },
            body: {
                d: 'M 0 20 calc(w / 2) 0 calc(w) 20 calc(w) calc(h) 0 calc(h) Z',
            },
        },
    },
    {
        markup: util.svg`
            <path @selector="body" />
            <text @selector="label" />
        `,
    }
);

const UndevelopedEvent = Event.define(
    'fta.UndevelopedEvent',
    {
        size: {
            width: 140,
            height: 80,
        },
        attrs: {
            root: {
                title: 'Undeveloped Event',
            },
            body: {
                d: 'M 0 calc(h / 2) calc(w / 2) calc(h) calc(w) calc(h / 2) calc(w / 2) 0 Z',
            },
        },
    },
    {
        markup: util.svg`
            <path @selector="body" />
            <text @selector="label" />
        `,
    }
);

const BasicEvent = Event.define(
    'fta.BasicEvent',
    {
        size: {
            width: 80,
            height: 80,
        },
        z: 3,
        attrs: {
            root: {
                title: 'Basic Event',
            },
            body: {
                cx: 'calc(w / 2)',
                cy: 'calc(h / 2)',
                r: 'calc(w / 2)',
            },
        },
    },
    {
        markup: util.svg`
            <circle @selector="body" />
            <text @selector="label" />
        `,
    }
);

const ConditioningEvent = Event.define(
    'fta.ConditioningEvent',
    {
        size: {
            width: 140,
            height: 80,
        },
        z: 2,
        attrs: {
            root: {
                title: 'Conditioning Event',
            },
            body: {
                cx: 'calc(w / 2)',
                cy: 'calc(h / 2)',
                rx: 'calc(w / 2)',
                ry: 'calc(h / 2)',
            },
        },
    },
    {
        markup: util.svg`
            <ellipse @selector="body" />
            <text @selector="label" />
        `,
    }
);

const Link = dia.Link.define(
    'fta.Link',
    {
        attrs: {
            line: {
                connection: true,
                stroke: '#ed2637',
                strokeWidth: 2,
                strokeLinejoin: 'round',
            },
        },
    },
    {
        markup: util.svg`
            <path @selector="line" fill="none" pointer-events="none" />
        `,
    },
    {
        create: function(event1, event2) {
            const source = {
                id: event1.id,
            };
            if (event1.get('type') === 'fta.IntermediateEvent') {
                source.selector = 'gate';
            } else {
                source.selector = 'body';
            }
            if (event2.get('type') === 'fta.ConditioningEvent') {
                source.anchor = { name: 'perpendicular' };
            }
            return new this({
                z: 1,
                source,
                target: {
                    id: event2.id,
                    selector: 'body',
                },
            });
        },
    }
);

const shapes = {
    ...defaultShapes,
    fta: {
        Event,
        ExternalEvent,
        UndevelopedEvent,
        BasicEvent,
        ConditioningEvent,
        Link,
    },
};

// Custom element tools for collapsing and expanding elements.
const ExpandButton = elementTools.Button.extend({
    options: {
        x: 'calc(w / 2 - 35)',
        y: 'calc(h - 15)',
        action: (evt, view, tool) => {
            view.paper.trigger('element:expand', view, evt);
        },
    },
    children() {
        return util.svg`
                <rect @selector="button" fill="#cad8e3" x="-8" y="-8" width="16" height="16" cursor="pointer" />
                <path @selector="icon" fill="none" stroke="#131e29" stroke-width="2" pointer-events="none" />
            `;
    },
    update() {
        elementTools.Button.prototype.update.call(this, arguments);
        this.childNodes.icon.setAttribute('d', this.getIconPath());
    },
    getIconPath() {
        if (this.relatedView.model.get('collapsed')) {
            return 'M -4 0 4 0 M 0 -4 0 4';
        } else {
            return 'M -4 0 4 0';
        }
    },
});

// Custom highlighter that renders a bevelled frame around the highlighted element
const BevelledFrame = dia.HighlighterView.extend({
    tagName: 'path',
    attributes: {
        stroke: '#f6f740',
        'stroke-width': 2,
        fill: 'none',
        'pointer-events': 'none',
    },
    // Method called to highlight a CellView
    highlight({ model }) {
        const { padding = 0, bevel = 10 } = this.options;
        const bbox = model.getBBox();
        // Highlighter is always rendered relatively to the CellView origin
        bbox.x = bbox.y = 0;
        // Increase the size of the highlighter
        bbox.inflate(padding);
        const { x, y, width, height } = bbox;
        this.vel.attr(
            'd',
            `
                M ${x} ${y + bevel}
                L ${x} ${y + height - bevel}
                L ${x + bevel} ${y + height}
                L ${x + width - bevel} ${y + height}
                L ${x + width} ${y + height - bevel}
                L ${x + width} ${y + bevel}
                L ${x + width - bevel} ${y}
                L ${x + bevel} ${y}
                Z
            `
        );
    },
});

const graph = new dia.Graph({}, { cellNamespace: shapes });

const paper = new dia.Paper({
    width: '100%',
    height: '100%',
    model: graph,
    defaultConnectionPoint: { name: 'boundary', args: { offset: 5 }},
    defaultConnector: {
        name: 'straight',
        args: { cornerType: 'line', cornerRadius: 10 },
    },
    defaultRouter: { name: 'orthogonal' },
    async: true,
    interactive: false,
    frozen: true,
    sorting: dia.Paper.sorting.APPROX,
    cellViewNamespace: shapes,
    background: { color: '#131e29' },
    viewport: function(view) {
        const { model } = view;
        if (!view) return true;
        return !model.get('hidden');
    },
});

document.getElementById('paper-container').appendChild(paper.el);

paper.on({
    'element:mouseenter': (elementView) => {
        BevelledFrame.add(elementView, 'root', 'frame', { padding: 10 });
    },
    'element:mouseleave': (elementView) => {
        BevelledFrame.remove(elementView, 'frame');
    },
    'element:gate:click': (elementView) => {
        const element = elementView.model;
        const gateType = element.gate();
        const gateTypes = Object.keys(element.gateTypes);
        const index = gateTypes.indexOf(gateType);
        const newIndex = (index + 1) % gateTypes.length;
        element.gate(gateTypes[newIndex]);
    },
    'element:expand': (elementView) => {
        const element = elementView.model;
        const successorElements = graph.getSuccessors(element);
        const [successor] = successorElements;
        const shouldExpand = !successor.get('hidden');
        const successorCells = graph.getSubgraph([
            element,
            ...successorElements,
        ]);
        successorCells.forEach((cell) => {
            if (cell === element) {
                cell.set({
                    hidden: false,
                    collapsed: shouldExpand,
                });
            } else {
                cell.set({ hidden: shouldExpand });
                if (cell.isElement()) {
                    cell.set({ collapsed: false });
                }
            }
        });
        runLayout(graph);
    },
});

// Original FTA Diagram: https://www.edrawsoft.com/templates/pdf/scaffolding-fall-fault-tree.pdf

const events = [
    IntermediateEvent.create('Fall from Scaffolding').gate('inhibit'),
    IntermediateEvent.create('Fall from the Scaffolding', 'and').gate('and'),
    IntermediateEvent.create('Safety Belt Not Working', 'or').gate('or'),
    IntermediateEvent.create('Fall By Accident', 'or').gate('or'),
    IntermediateEvent.create('Broken By Equipment', 'or').gate('or'),
    IntermediateEvent.create('Did not Wear Safety Belt', 'or').gate('or'),
    UndevelopedEvent.create('Slip and Fall'),
    UndevelopedEvent.create('Lose Balance'),
    UndevelopedEvent.create('Upholder Broken'),
    BasicEvent.create('Safety Belt Broken'),
    BasicEvent.create('Forgot to Wear'),
    ExternalEvent.create('Take off When Walking'),
    ConditioningEvent.create('Height and Ground Condition'),
];

const links = [
    Link.create(events[0], events[1]),
    Link.create(events[1], events[2]),
    Link.create(events[1], events[3]),
    Link.create(events[2], events[4]),
    Link.create(events[2], events[5]),
    Link.create(events[3], events[6]),
    Link.create(events[3], events[7]),
    Link.create(events[4], events[8]),
    Link.create(events[4], events[9]),
    Link.create(events[5], events[10]),
    Link.create(events[5], events[11]),
    Link.create(events[0], events[12]),
];

graph.resetCells(events.concat(links));

runLayout(graph);
addTools(paper, events);

paper.transformToFitContent({
    padding: 15,
    contentArea: graph.getBBox(),
    verticalAlign: 'middle',
    horizontalAlign: 'middle',
});

paper.unfreeze();

// Functions

function runLayout(graph) {
    const autoLayoutElements = [];
    const manualLayoutElements = [];
    graph.getElements().forEach((el) => {
        if (el.get('hidden')) return;
        if (el.get('type') === 'fta.ConditioningEvent') {
            manualLayoutElements.push(el);
        } else {
            autoLayoutElements.push(el);
        }
    });
    // Automatic Layout
    layout.DirectedGraph.layout(graph.getSubgraph(autoLayoutElements), {
        rankDir: 'TB',
        setVertices: true,
    });
    // Manual Layout
    manualLayoutElements.forEach((el) => {
        const [neighbor] = graph.getNeighbors(el, { inbound: true });
        if (!neighbor) return;
        const neighborPosition = neighbor.getBBox().bottomRight();
        el.position(
            neighborPosition.x + 20,
            neighborPosition.y - el.size().height / 2 - 15
        );
    });
    // Make sure the root element of the graph is always at the same position after the layout.
    const rootCenter = { x: 500, y: 100 };
    const [source] = graph.getSources();
    const { width, height } = source.size();
    const diff = source
        .position()
        .difference({
            x: rootCenter.x - width / 2,
            y: rootCenter.y - height / 2,
        });
    graph.translate(-diff.x, -diff.y);
}

function addTools(paper, elements) {
    const toolName = 'expand-tools';
    elements.forEach(function(element) {
        if (element.get('type') !== 'fta.IntermediateEvent') return;
        const view = element.findView(paper);
        if (view.hasTools(toolName)) return;
        const toolsView = new dia.ToolsView({
            name: toolName,
            tools: [new ExpandButton()],
        });
        view.addTools(toolsView);
    });
}
