import { V, g, dia, shapes, mvc } from '@joint/core';
import './styles.css';

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 20,
    drawGrid: { name: 'mesh' },
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    defaultLink: () => new shapes.standard.Link({ z: -1 }),
    defaultConnectionPoint: { name: 'boundary' },
    clickThreshold: 10,
    magnetThreshold: 'onleave',
    linkPinning: false,
    validateConnection: (sourceView, _, targetView) => sourceView !== targetView,
    snapLinks: true
});

paperContainer.appendChild(paper.el);

const r1 = new shapes.standard.Rectangle({
    layer: 'group1',
    position: { x: 100, y: 100 },
    size: { width: 200, height: 200 },
    attrs: {
        root: {
            magnet: false
        },
        body: {
            stroke: '#333333',
            fill: '#fff',
            rx: 10,
            ry: 10
        }
    },
    portMarkup: [
        {
            tagName: 'circle',
            selector: 'portBody',
            attributes: {
                r: 10,
                fill: '#FFFFFF',
                stroke: '#333333'
            }
        }
    ],
    portLabelMarkup: [
        {
            tagName: 'rect',
            selector: 'portLabelBackground'
        },
        {
            tagName: 'text',
            selector: 'portLabel',
            attributes: {
                fill: '#333333'
            }
        }
    ],
    ports: {
        groups: {
            left: {
                position: 'left',
                label: {
                    position: {
                        name: 'outside',
                        args: {
                            offset: 30
                        }
                    }
                },
                attrs: {
                    portLabelBackground: {
                        ref: 'portLabel',
                        fill: '#FFFFFF',
                        fillOpacity: 0.8,
                        x: 'calc(x - calc(w + 2))',
                        y: 'calc(y - 2)',
                        width: 'calc(w + 4)',
                        height: 'calc(h + 4)'
                    },
                    portLabel: {
                        fontFamily: 'sans-serif'
                    },
                    portBody: {
                        strokeWidth: 2,
                        magnet: 'active'
                    }
                }
            },
            right: {
                position: 'right',
                label: {
                    position: {
                        name: 'outside',
                        args: {
                            offset: 30
                        }
                    }
                },
                attrs: {
                    portLabelBackground: {
                        ref: 'portLabel',
                        fill: '#FFFFFF',
                        fillOpacity: 0.8,
                        x: 'calc(x - 2)',
                        y: 'calc(y - 2)',
                        width: 'calc(w + 4)',
                        height: 'calc(h + 4)'
                    },
                    portLabel: {
                        fontFamily: 'sans-serif'
                    },
                    portBody: {
                        strokeWidth: 2,
                        magnet: 'active'
                    }
                }
            }
        },
        items: [
            {
                id: 'p1',
                group: 'left',
                attrs: {
                    portLabel: {
                        text: 'Port 1'
                    }
                }
            },
            {
                id: 'p2',
                group: 'left',
                attrs: {
                    portLabel: {
                        text: 'Port 2'
                    }
                }
            },
            {
                id: 'p3',
                group: 'left',
                attrs: {
                    portLabel: {
                        text: 'Port 3'
                    }
                }
            },
            {
                id: 'p4',
                group: 'left',
                attrs: {
                    portLabel: {
                        text: 'Port 4'
                    }
                }
            },
            {
                id: 'out1',
                group: 'right',
                attrs: {
                    portLabel: {
                        text: 'Out 1'
                    }
                }
            },
            {
                id: 'out2',
                group: 'right',
                attrs: {
                    portLabel: {
                        text: 'Out 2'
                    }
                }
            },
            {
                id: 'out3',
                group: 'right',
                attrs: {
                    portLabel: {
                        text: 'Out 3'
                    }
                }
            }
        ]
    }
});

const r2 = r1.clone().translate(400);
const l1 = new shapes.standard.Link({ z: -1 });
const l2 = l1.clone();
l1.source(r1, { port: 'out2' }).target(r2, { port: 'p3' });
l2.source(r1, { port: 'out1' }).target(r2, { port: 'p1' });
graph.addCells([r1, r2, l1, l2]);

const PortHandle = mvc.View.extend({
    tagName: 'circle',
    svgElement: true,
    className: 'port-handle',
    events: {
        mousedown: 'onPointerDown',
        touchstart: 'onPointerDown',
        dblclick: 'onDoubleClick',
        dbltap: 'onDoubleClick'
    },
    documentEvents: {
        mousemove: 'onPointerMove',
        touchmove: 'onPointerMove',
        mouseup: 'onPointerUp',
        touchend: 'onPointerUp',
        touchcancel: 'onPointerUp'
    },
    attributes: {
        r: 13,
        fill: 'transparent',
        stroke: 'gray',
        'stroke-width': 2,
        cursor: 'grab'
    },
    position: function(x, y) {
        this.vel.attr({ cx: x, cy: y });
    },
    color: function(color) {
        this.el.style.stroke = color || this.attributes.stroke;
    },
    onPointerDown: function(evt) {
        if (this.options.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        this.options.paper.undelegateEvents();
        this.delegateDocumentEvents(null, evt.data);
        this.trigger('will-change', this, evt);
    },
    onPointerMove: function(evt) {
        this.trigger('changing', this, evt);
    },
    onDoubleClick: function(evt) {
        this.trigger('remove', this, evt);
    },
    onPointerUp: function(evt) {
        this.trigger('changed', this, evt);
        this.undelegateDocumentEvents();
        this.options.paper.delegateEvents();
    }
});

const Ports = dia.ToolView.extend({
    name: 'ports',
    options: {
        handleClass: PortHandle,
        activeColor: '#4666E5'
    },
    children: [
        {
            tagName: 'path',
            selector: 'preview',
            className: 'joint-ports-preview',
            attributes: {
                d:
                    'M -30 -5 -20 0 -30 5 M -20 -5 -10 0 -20 5 M 20 -5 10 0 20 5 M 30 -5 20 0 30 5',
                'stroke-width': 2,
                fill: 'none'
            }
        }
    ],
    handles: null,
    onRender: function() {
        this.renderChildren();
        this.updatePreview(null);
        this.resetHandles();
        this.renderHandles();
        return this;
    },
    update: function() {
        const positions = this.getPositions();
        if (positions.length === this.handles.length) {
            this.updateHandles();
        } else {
            this.resetHandles();
            this.renderHandles();
        }
        this.updatePreview(null);
        return this;
    },
    resetHandles: function() {
        const handles = this.handles;
        this.handles = [];
        this.stopListening();
        if (!Array.isArray(handles)) return;
        for (let i = 0, n = handles.length; i < n; i++) {
            handles[i].remove();
        }
    },
    renderHandles: function() {
        const positions = this.getPositions();
        for (let i = 0, n = positions.length; i < n; i++) {
            const position = positions[i];
            const handle = new this.options.handleClass({
                index: i,
                portId: position.id,
                paper: this.paper,
                guard: (evt) => this.guard(evt)
            });
            handle.render();
            handle.position(position.x, position.y);
            this.simulateRelatedView(handle.el);
            handle.vel.appendTo(this.el);
            this.handles.push(handle);
            this.startHandleListening(handle);
        }
    },
    updateHandles: function() {
        const positions = this.getPositions();
        for (let i = 0, n = positions.length; i < n; i++) {
            const position = positions[i];
            const handle = this.handles[i];
            if (!handle) return;
            handle.position(position.x, position.y);
        }
    },
    updatePreview: function(candidateIndex) {
        const { preview } = this.childNodes;
        if (!preview) return;
        if (!Number.isFinite(candidateIndex)) {
            preview.setAttribute('display', 'none');
        } else {
            preview.removeAttribute('display');
            preview.setAttribute('stroke', this.options.activeColor);
            const positions = this.getPositions();
            const position = positions[candidateIndex];
            const lastPosition = positions[positions.length - 1];
            const distance =
                new g.Line(positions[0], lastPosition).length() /
                (positions.length - 1);
            let x, y;
            if (position) {
                x = position.x;
                y = position.y - distance / 2;
            } else {
                x = lastPosition.x;
                y = lastPosition.y + distance / 2;
            }
            preview.setAttribute('transform', `translate(${x},${y})`);
        }
    },
    startHandleListening: function(handle) {
        this.listenTo(handle, 'will-change', this.onHandleWillChange);
        this.listenTo(handle, 'changing', this.onHandleChanging);
        this.listenTo(handle, 'changed', this.onHandleChanged);
    },
    getPositions: function() {
        const { relatedView } = this;
        const translateMatrix = relatedView.getRootTranslateMatrix();
        const rotateMatrix = relatedView.getRootRotateMatrix();
        const matrix = translateMatrix.multiply(rotateMatrix);
        const portsPositions = this.relatedView.model.getPortsPositions(
            this.options.group
        );
        const positions = [];
        for (const id in portsPositions) {
            const point = V.transformPoint(portsPositions[id], matrix);
            positions.push({
                x: point.x,
                y: point.y,
                id
            });
        }
        return positions;
    },
    getPortIndex: function(handle, x, y) {
        const positions = this.getPositions();
        let candidateIndex = positions.findIndex((position) => position.y > y);
        const index = handle.options.index;
        if (
            candidateIndex === index ||
            candidateIndex === index + 1 ||
            (candidateIndex === -1 && index === positions.length - 1)
        ) {
            candidateIndex = index;
        }
        return candidateIndex;
    },
    onHandleWillChange: function(handle, evt) {
        this.focus();
        handle.color(this.options.activeColor);
        const portNode = this.relatedView.findPortNode(
            handle.options.portId,
            'root'
        );
        portNode.style.opacity = 0.2;
    },
    onHandleChanging: function(handle, evt) {
        const { relatedView } = this;
        const [, x, y] = relatedView.paper.getPointerArgs(evt);
        const index = handle.options.index;
        const candidateIndex = this.getPortIndex(handle, x, y);
        this.updatePreview(candidateIndex !== index ? candidateIndex : null);
    },
    onHandleChanged: function(handle, evt) {
        const { relatedView } = this;
        const { model, paper } = relatedView;
        handle.color(null);
        const portNode = this.relatedView.findPortNode(
            handle.options.portId,
            'root'
        );
        portNode.style.opacity = '';
        const [, x, y] = paper.getPointerArgs(evt);
        this.updatePreview(null);
        const index = handle.options.index;
        const newIndex = this.getPortIndex(handle, x, y);
        if (newIndex !== index) {
            const positions = this.getPositions();
            const position = positions[index];
            const newPosition = positions[newIndex];
            const portsPath = ['ports', 'items'];
            const ports = model.prop(portsPath);
            const positionIndex = ports.findIndex((port) => port.id === position.id);
            const port = ports[positionIndex];
            const newPositionIndex = newPosition
                ? ports.findIndex((port) => port.id === newPosition.id)
                : ports.length;
            const newPorts = ports.slice();
            newPorts.splice(positionIndex, 1);
            newPorts.splice(newPositionIndex - (index < newIndex ? 1 : 0), 0, port);
            model.prop(portsPath, newPorts, { rewrite: true, tool: this.cid });
            this.resetHandles();
            this.renderHandles();
        }
    },
    onRemove: function() {
        this.resetHandles();
    }
});

paper.on('element:magnet:pointerclick', (elementView, evt, magnet) => {
    paper.removeTools();
    const group = elementView.findAttribute('port-group', magnet);
    elementView.addTools(
        new dia.ToolsView({
            tools: [new Ports({ group })]
        })
    );
});

paper.on('blank:pointerdown cell:pointerdown', () => {
    paper.removeTools();
});

r2.findView(paper).addTools(
    new dia.ToolsView({
        tools: [new Ports({ group: 'left' })]
    })
);
