import { dia, shapes, highlighters, V } from '@joint/core';
import logoUrl from '../assets/jointjs-logo-black.svg';
import './styles.css';

const WIDTH = 620;
const HEIGHT = 480;
const ACCENT = '#4666E5';
// gap between a shape and its outline
const PADDING = 4;
// thickness of the outline
const OUTLINE = 3;
// space between the outermost outline and the edge of the preview rectangle
const MARGIN = 20;

// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: WIDTH,
    height: HEIGHT,
    gridSize: 10,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' }
});
paperContainer.appendChild(paper.el);

// Cells

const rectangle = new shapes.standard.Rectangle({
    position: { x: 40, y: 40 },
    size: { width: 140, height: 70 },
    attrs: {
        body: { fill: '#FFFFFF', stroke: '#333333', strokeWidth: 2, rx: 6, ry: 6 },
        label: { text: 'Rectangle', fontFamily: 'sans-serif' }
    }
});

const ellipse = new shapes.standard.Ellipse({
    position: { x: 260, y: 30 },
    size: { width: 130, height: 90 },
    attrs: {
        body: { fill: '#FFE0B2', stroke: '#E65100', strokeWidth: 2 },
        label: { text: 'Ellipse', fontFamily: 'sans-serif' }
    }
});

const star = new shapes.standard.Path({
    position: { x: 460, y: 30 },
    size: { width: 100, height: 100 },
    attrs: {
        body: {
            fill: 'none',
            stroke: '#7B1FA2',
            strokeWidth: 3,
            strokeLinejoin: 'round',
            d: 'M calc(0.5*w) 0 L calc(0.62*w) calc(0.35*h) L calc(w) calc(0.35*h) L calc(0.7*w) calc(0.57*h) L calc(0.8*w) calc(0.91*h) L calc(0.5*w) calc(0.7*h) L calc(0.2*w) calc(0.91*h) L calc(0.3*w) calc(0.57*h) L 0 calc(0.35*h) L calc(0.38*w) calc(0.35*h) Z'
        },
        label: { text: 'Hollow path', fontFamily: 'sans-serif', fontSize: 12 }
    }
});

const image = new shapes.standard.Image({
    position: { x: 40, y: 180 },
    size: { width: 160, height: 60 },
    attrs: {
        image: { href: logoUrl },
        label: { text: 'Image', fontFamily: 'sans-serif', fontSize: 12 }
    }
});

const headered = new shapes.standard.HeaderedRectangle({
    position: { x: 40, y: 330 },
    size: { width: 160, height: 100 },
    attrs: {
        body: { fill: '#FFFFFF', stroke: '#333333', strokeWidth: 2 },
        header: { fill: '#B2DFDB', stroke: '#333333', strokeWidth: 2 },
        headerText: { text: 'Header', fontFamily: 'sans-serif' },
        bodyText: { text: 'Body', fontFamily: 'sans-serif' }
    }
});

const withPorts = new shapes.standard.Rectangle({
    position: { x: 270, y: 220 },
    size: { width: 140, height: 90 },
    attrs: {
        body: { fill: '#E3F2FD', stroke: '#1565C0', strokeWidth: 2 },
        label: { text: 'Ports', fontFamily: 'sans-serif' }
    },
    ports: {
        groups: {
            in: {
                position: 'left',
                markup: [{ tagName: 'circle', selector: 'portBody' }],
                attrs: { portBody: { magnet: true, r: 8, fill: '#FFFFFF', stroke: '#1565C0', strokeWidth: 2 }}
            },
            out: {
                position: 'right',
                markup: [{ tagName: 'circle', selector: 'portBody' }],
                attrs: { portBody: { magnet: true, r: 8, fill: '#FFFFFF', stroke: '#1565C0', strokeWidth: 2 }}
            }
        },
        items: [{ group: 'in' }, { group: 'in' }, { group: 'out' }]
    }
});

const rotated = new shapes.standard.Rectangle({
    position: { x: 460, y: 320 },
    size: { width: 120, height: 60 },
    angle: 30,
    attrs: {
        body: { fill: '#F8BBD0', stroke: '#AD1457', strokeWidth: 2 },
        label: { text: 'Rotated', fontFamily: 'sans-serif' }
    }
});

const link1 = new shapes.standard.Link({
    source: { id: rectangle.id },
    target: { id: ellipse.id },
    attrs: { line: { stroke: '#333333', strokeWidth: 2 }},
    labels: [{ attrs: { text: { text: 'link', fontFamily: 'sans-serif' }}}]
});

const link2 = new shapes.standard.Link({
    source: { id: withPorts.id, port: withPorts.getPorts()[2].id },
    target: { id: rotated.id },
    vertices: [{ x: 460, y: 265 }],
    attrs: {
        line: {
            stroke: '#7B1FA2',
            strokeWidth: 2,
            strokeDasharray: '6 3',
            sourceMarker: { type: 'circle', r: 5, fill: '#7B1FA2' }
        }
    },
    labels: [{ position: 0.4, attrs: { text: { text: 'dashed', fontFamily: 'sans-serif' }}}]
});

graph.addCells([rectangle, ellipse, star, image, headered, withPorts, rotated, link1, link2]);

// Previews

// both previews are drawn at half the paper scale, stacked next to the paper
const PREVIEW_SCALE = 0.5;
const PREVIEW_WIDTH = WIDTH * PREVIEW_SCALE;
const PREVIEW_HEIGHT = HEIGHT * PREVIEW_SCALE;

const ignoreLabelsCheckbox = document.getElementById('ignore-labels');

// element labels are `<text>`, link labels are `<g label-idx="...">` groups
function getAlphaOptions() {
    return ignoreLabelsCheckbox.checked ? { ignore: 'text, [label-idx]' } : {};
}

// Grows every shape by `padding + outline`, then cuts out the shape grown
// by `padding` only, leaving a ring around it.
function outlineMaskContent(alpha) {
    alpha.attr({ 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    return [
        alpha.clone().attr({ 'stroke-width': 2 * (PADDING + OUTLINE) }),
        alpha.clone().attr({ fill: 'black', stroke: 'black', 'stroke-width': 2 * PADDING })
    ];
}

// A single filled silhouette: the alpha copy as-is.
function fillMaskContent(alpha) {
    return [alpha];
}

function createPreview(containerId, getMaskContent) {
    const container = document.getElementById(containerId);
    const mask = V('mask', { id: `${containerId}-mask` });
    const rect = V('rect', { fill: ACCENT, mask: `url(#${mask.id})`, display: 'none' });
    const viewport = V('g').append(rect);
    const svg = V('svg', { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }).append([
        V('defs').append(mask),
        viewport
    ]);
    container.appendChild(svg.node);

    // The preview is always drawn with the selection's top-left corner at (0,0),
    // so it can be positioned anywhere with a single translate.
    function update() {
        mask.empty();
        const content = [];
        let area = null;
        selection.forEach(cell => {
            const view = cell.findView(paper);
            // `toAlpha()` returns a plain SVG element. We wrap it in a vectorizer
            // to make the attribute changes below easier to write.
            const alpha = view.toAlpha(view.el, getAlphaOptions());
            if (!alpha) return;
            content.push(...getMaskContent(V(alpha)));
            const bbox = paper.paperToLocalRect(view.getBBox());
            area = area ? area.union(bbox) : bbox;
        });
        if (!area) {
            rect.attr('display', 'none');
            return;
        }
        area.inflate(PADDING + OUTLINE + MARGIN);
        mask.append(V('g', { transform: `translate(${-area.x},${-area.y})` }).append(content));
        rect.attr({ x: 0, y: 0, width: area.width, height: area.height }).removeAttr('display');
    }

    function syncTransform() {
        const { sx, sy } = paper.scale();
        viewport.attr('transform', `scale(${sx * PREVIEW_SCALE},${sy * PREVIEW_SCALE})`);
    }

    syncTransform();

    return { update, syncTransform };
}

const previews = [
    createPreview('preview-outline', outlineMaskContent),
    createPreview('preview-fill', fillMaskContent)
];

function updatePreview() {
    previews.forEach(preview => preview.update());
}

function syncPreviewTransform() {
    previews.forEach(preview => preview.syncTransform());
}

ignoreLabelsCheckbox.addEventListener('change', updatePreview);

// Selection

const HIGHLIGHTER_ID = 'selection';
const selection = new Set();

function highlight(cell) {
    highlighters.mask.add(cell.findView(paper), 'root', HIGHLIGHTER_ID, {
        deep: true,
        layer: dia.Paper.Layers.FRONT,
        attrs: { stroke: ACCENT, 'stroke-width': 2 }
    });
}

function unhighlight(cell) {
    highlighters.mask.remove(cell.findView(paper), HIGHLIGHTER_ID);
}

function toggleSelection(cell, extend) {
    if (!extend) {
        selection.forEach(selected => {
            if (selected !== cell) unhighlight(selected);
        });
        selection.clear();
    }
    if (selection.has(cell)) {
        selection.delete(cell);
        unhighlight(cell);
    } else {
        selection.add(cell);
        highlight(cell);
    }
    updatePreview();
}

function clearSelection() {
    selection.forEach(unhighlight);
    selection.clear();
    updatePreview();
}

paper.on('element:pointerclick link:pointerclick', (cellView, evt) => {
    toggleSelection(cellView.model, evt.shiftKey);
});

paper.on('blank:pointerclick', () => clearSelection());

// Rebuild the preview only after the paper rendered a change of a selected
// cell, or of a cell a selected link is connected to.
// The paper is async: the initial selection is previewed after the first render.
let isPreviewDirty = true;

graph.on('change', (cell) => {
    if (isPreviewDirty || selection.size === 0) return;
    isPreviewDirty = selection.has(cell) || graph.getConnectedLinks(cell).some(link => selection.has(link));
});

paper.on('render:done', () => {
    if (!isPreviewDirty) return;
    isPreviewDirty = false;
    updatePreview();
});

paper.on('transform', syncPreviewTransform);

graph.on('remove', (cell) => {
    if (!selection.has(cell)) return;
    selection.delete(cell);
    updatePreview();
});

// Zoom

function zoom(evt, x, y, delta) {
    evt.preventDefault();
    const { sx } = paper.scale();
    const scale = Math.min(Math.max(sx + delta * 0.1, 0.4), 3);
    paper.scaleUniformAtPoint(scale, { x, y });
}

paper.on('blank:mousewheel', zoom);
paper.on('cell:mousewheel', (_cellView, ...args) => zoom(...args));

// Initial state

toggleSelection(rectangle, true);
toggleSelection(link1, true);
toggleSelection(ellipse, true);
