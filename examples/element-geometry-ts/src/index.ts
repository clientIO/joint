import { dia, g, shapes, V } from '@joint/core';
import './styles.css';

const PORT_RADIUS = 7;

// The geometry of the elements and of their ports, defined on the model.
// An element geometry is relative to the top-left corner of the element,
// a port geometry is relative to the center of the port. The graph applies
// the position and the rotation of the element.
function getElementGeometry({ model, port }: dia.Graph.ElementGeometryCallbackArgs): g.Shape {
    if (port !== null) {
        return new g.Ellipse(new g.Point(0, 0), PORT_RADIUS, PORT_RADIUS);
    }
    const { width, height } = model.size();
    const rect = new g.Rect(0, 0, width, height);
    switch (model.get('type')) {
        case 'standard.Ellipse':
            return g.Ellipse.fromRect(rect);
        case 'standard.Polygon':
            return new g.Polygon([rect.topMiddle(), rect.rightMiddle(), rect.bottomMiddle(), rect.leftMiddle()]);
        default:
            return rect;
    }
}

// A connection point that uses the model geometry instead of measuring the DOM.
function modelGeometryConnectionPoint(line: g.Line, view: dia.CellView, magnet: SVGElement): g.Point {
    const { model } = view;
    if (model.isElement()) {
        const portId = view.findAttribute('port', magnet);
        const point = (portId !== null && model.hasPort(portId))
            ? model.getPortGeometryIntersection(portId, line)
            : model.getGeometryIntersection(line);
        if (point) return point;
    }
    return line.end.clone();
}

const graph = new dia.Graph({}, { cellNamespace: shapes, getElementGeometry });

const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: 900,
    height: 560,
    gridSize: 1,
    defaultAnchor: { name: 'modelCenter' },
    defaultConnectionPoint: modelGeometryConnectionPoint,
    interactive: { linkMove: false, labelMove: false }
});
document.getElementById('canvas')!.appendChild(paper.el);

const portCircle = {
    size: { width: PORT_RADIUS * 2, height: PORT_RADIUS * 2 },
    markup: [{ tagName: 'circle', selector: 'portBody' }],
    attrs: {
        portBody: {
            r: PORT_RADIUS,
            magnet: true,
            fill: '#ffffff',
            stroke: '#131e29',
            strokeWidth: 2
        }
    }
};

const ports = {
    groups: {
        left: { position: { name: 'left' }, ...portCircle },
        right: { position: { name: 'right' }, ...portCircle }
    },
    items: [
        { id: 'in', group: 'left' },
        { id: 'out', group: 'right' }
    ]
};

const bodyAttributes = { fill: '#dde6ed', stroke: '#131e29', strokeWidth: 2 };

const rhombus = new shapes.standard.Polygon({
    position: { x: 80, y: 60 },
    size: { width: 140, height: 100 },
    ports,
    attrs: {
        body: {
            ...bodyAttributes,
            points: 'calc(0.5*w),0 calc(w),calc(0.5*h) calc(0.5*w),calc(h) 0,calc(0.5*h)'
        },
        label: { text: 'Rhombus' }
    }
});

const ellipse = new shapes.standard.Ellipse({
    position: { x: 400, y: 40 },
    size: { width: 160, height: 100 },
    ports,
    attrs: {
        body: bodyAttributes,
        label: { text: 'Ellipse' }
    }
});

const rectangle = new shapes.standard.Rectangle({
    position: { x: 680, y: 220 },
    size: { width: 140, height: 80 },
    ports,
    attrs: {
        body: bodyAttributes,
        label: { text: 'Rectangle' }
    }
});

const rotatedRhombus = rhombus.clone() as shapes.standard.Polygon;
rotatedRhombus.position(360, 380);
rotatedRhombus.rotate(30);
rotatedRhombus.attr('label/text', 'Rotated');

const rotatedEllipse = ellipse.clone() as shapes.standard.Ellipse;
rotatedEllipse.position(60, 360);
rotatedEllipse.rotate(-20);
rotatedEllipse.attr('label/text', 'Rotated');

function createLink(source: dia.Link.EndJSON, target: dia.Link.EndJSON, vertices: dia.Link.Vertex[] = []) {
    return new shapes.standard.Link({
        source,
        target,
        vertices,
        attrs: { line: { stroke: '#131e29', strokeWidth: 2 }}
    });
}

graph.resetCells([
    rhombus,
    ellipse,
    rectangle,
    rotatedRhombus,
    rotatedEllipse,
    // element to element
    createLink({ id: rhombus.id }, { id: rotatedRhombus.id }),
    createLink({ id: ellipse.id }, { id: rotatedRhombus.id }),
    createLink({ id: rotatedEllipse.id }, { id: rhombus.id }),
    // port to port
    createLink({ id: rhombus.id, port: 'out' }, { id: ellipse.id, port: 'in' }),
    createLink({ id: rotatedRhombus.id, port: 'out' }, { id: rectangle.id, port: 'in' }),
    // element to port, through a vertex
    createLink({ id: ellipse.id }, { id: rectangle.id, port: 'out' }, [{ x: 860, y: 90 }]),
    // port to element
    createLink({ id: rotatedEllipse.id, port: 'out' }, { id: rotatedRhombus.id })
]);

// The model end points and bounding boxes of the links, drawn over the diagram.

const overlay = V('g', { class: 'model-overlay' });
paper.getLayerView(dia.Paper.Layers.FRONT).el.appendChild(overlay.node);

const showModelCheckbox = document.getElementById('show-model') as HTMLInputElement;

function updateOverlay() {
    overlay.empty();
    if (!showModelCheckbox.checked) return;
    graph.getLinks().forEach((link) => {
        const { x, y, width, height } = link.getBBox();
        overlay.append(V('rect', { x, y, width, height }));
        [link.getSourcePoint(), link.getTargetPoint()].forEach((point) => {
            overlay.append(V('circle', { cx: point.x, cy: point.y, r: 4 }));
        });
    });
}

graph.on('add remove change', updateOverlay);
showModelCheckbox.addEventListener('change', updateOverlay);
updateOverlay();
