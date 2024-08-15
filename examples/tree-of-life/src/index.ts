import { getStroke } from 'perfect-freehand';
import {
    dia,
    shapes,
    g,
    linkTools,
    connectors,
    attributes,
    elementTools,
    highlighters,
} from '@joint/core';

import '../index.css'

const { TangentDirections } = connectors.curve;
const borderWidth = 4;
const speciesSize = 100;
const colors = {
    fg: '#ed2637',
    bg: '#131e29',
    text: '#dde6ed',
    border: '#ed2637',
    link: '#f6f740',
    highlight: '#f7a1a8',
};

class Species extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'Species',
            z: 2,
            size: {
                width: speciesSize,
                height: speciesSize,
            },
            attrs: {
                root: {
                    magnetSelector: 'border',
                },
                border: {
                    fill: colors.bg,
                    stroke: colors.bg,
                    strokeWidth: 2,
                    rx: 'calc(w/2)',
                    ry: 'calc(h/2)',
                    cx: 'calc(w/2)',
                    cy: 'calc(h/2)',
                },
                innerBorder: {
                    fill: colors.bg,
                    stroke: colors.fg,
                    strokeWidth: 4,
                    rx: `calc(w/2 - ${borderWidth})`,
                    ry: `calc(h/2 - ${borderWidth})`,
                    cx: 'calc(w/2)',
                    cy: 'calc(h/2)',
                },
                icon: {
                    width: 'calc(3 * w / 4)',
                    height: 'calc(3 * h / 4)',
                    x: 'calc(w / 8)',
                    y: 'calc(h / 8)',
                },
                labelPath: {
                    d: 'M -10 calc(h/2) A 20 20 0 0 0 calc(w + 10) calc(h / 2)',
                    stroke: 'none',
                    fill: 'none',
                },
                label: {
                    textPath: { selector: 'labelPath' },
                    text: '',
                    fontWeight: 'bold',
                    fontSize: 16,
                    fontFamily: 'sans-serif',
                    fill: colors.text,
                    stroke: colors.bg,
                    strokeWidth: 5,
                    paintOrder: 'stroke',
                    textVerticalAnchor: 'top',
                    textAnchor: 'middle',
                    letterSpacing: 5,
                    // Quarter of the circumference of the circle
                    // 2 * π * (r + border) / 4
                    // Moves the anchor of the text to the center of the `labelPath`.
                    x: (2 * Math.PI * (speciesSize / 2 + 10)) / 4,
                },
            },
        };
    }

    preinitialize() {
        this.markup = [
            {
                tagName: 'ellipse',
                selector: 'border',
            },
            {
                tagName: 'ellipse',
                selector: 'innerBorder',
            },
            {
                tagName: 'image',
                selector: 'icon',
            },
            {
                tagName: 'path',
                selector: 'labelPath',
            },
            {
                tagName: 'text',
                selector: 'label',
            },
        ];
    }
}

class Branch extends dia.Link {
    defaults() {
        return {
            ...super.defaults,
            type: 'Branch',
            z: 1,
            attrs: {
                line: {
                    // Native SVG Attributes
                    fill: colors.link,
                    stroke: colors.link,
                    strokeWidth: 1,
                    // Custom attributes
                    organicStroke: true,
                    organicStrokeSize: 20,
                },
            },
        };
    }

    preinitialize() {
        this.markup = [
            {
                tagName: 'path',
                selector: 'line',
            },
        ];
        this.defaultLabel = {
            attrs: {
                labelText: {
                    fontSize: 14,
                    fontFamily: 'sans-serif',
                    letterSpacing: 5,
                    fill: colors.text,
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                },
                labelBackground: {
                    fill: colors.bg,
                    stroke: colors.border,
                    strokeWidth: 3,
                    rx: 4,
                    ry: 4,
                    ref: 'labelText',
                    x: 'calc(x - 10)',
                    y: 'calc(y - 10)',
                    width: 'calc(w + 20)',
                    height: 'calc(h + 20)',
                },
                line: {
                    d: 'M 0 0 Q 0 50 -60 60',
                    fill: 'none',
                    stroke: colors.border,
                    strokeWidth: 2,
                    targetMarker: {
                        type: 'circle',
                        r: 4,
                    },
                },
            },
            position: {
                distance: 0.5,
                offset: {
                    x: 70,
                    y: -50,
                },
            },
            markup: [
                {
                    tagName: 'path',
                    selector: 'line',
                },
                {
                    tagName: 'rect',
                    selector: 'labelBackground',
                },
                {
                    tagName: 'text',
                    selector: 'labelText',
                },
            ],
        };
    }

    static attributes = {
        // The `organicStroke` attribute is used to set the `d` attribute of the `<path>` element.
        // It works similarly to the `connection` attribute of JointJS.
        'organic-stroke': {
            set: function (
                _value: any,
                _refBBox: g.Rect,
                _node: SVGElement,
                attrs: attributes.NativeSVGAttributes
            ) {
                if (!this.model.isLink()) {
                    throw new Error('The `organicStroke` attribute can only be used with links.');
                }
                // The path of the link as returned by the `connector`.
                const path = this.getConnection();
                const segmentSubdivisions = this.getConnectionSubdivisions();
                // Convert polylines to points and add the pressure value to each point.
                const polylines = path.toPolylines({ segmentSubdivisions });
                let points = [];
                polylines.forEach((polyline) => {
                    const maxIndex = polyline.points.length - 1;
                    polyline.points.forEach((point, index) => {
                        points.push([
                            point.x,
                            point.y,
                            organicStyle(index, maxIndex),
                        ]);
                    });
                });
                // Using the `getStroke` function from the `perfect-freehand` library,
                // we get the points that represent the outline of the stroke.
                const outlinePoints = getStroke(points, {
                    size: attrs['organic-stroke-size'] || 20,
                    thinning: 0.5,
                    simulatePressure: false,
                    last: true,
                });
                // How to interpolate the points to get the outline?
                const d = quadraticInterpolation(outlinePoints);
                // The `d` attribute is set on the `node` element.
                return { d };
            },
            unset: 'd'
        },
        // Empty attributes definition to prevent the attribute from being set on the element.
        // They are only meant to be used in the `organicStroke` function.
        'organic-stroke-size': {},
    };
}

// Stroke Style
// ------------

const time = (index: number, maxIndex: number) => index / maxIndex;

// It gradually decrease the pressure from 1 to 0. This means that the stroke
// will be thinner at the end.
const organicStyle = (index: number, maxIndex: number) => {
    return 1 - time(index, maxIndex);
};

// Points Interpolation
// --------------------

const average = (a: number, b: number) => (a + b) / 2;

// Alternatively, a linear or a cubic interpolation can be used.
function quadraticInterpolation(points) {
    const len = points.length;
    if (len < 4) {
        return '';
    }
    let [a, b, c] = points;
    let result = `
        M${a[0].toFixed(2)},${a[1].toFixed(2)}
        Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(
        2
    )},${average(b[1], c[1]).toFixed(2)}
        T
    `;
    for (let i = 2, max = len - 1; i < max; i++) {
        a = points[i];
        b = points[i + 1];
        result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
    }
    result += 'Z';
    return result;
}

// Rotate Tool
// -----------

const RotateTool = elementTools.Control.extend({
    children: [
        {
            tagName: 'g',
            selector: 'handle',
            children: [
                {
                    tagName: 'circle',
                    attributes: {
                        r: 15,
                        fill: colors.bg,
                    },
                },
                {
                    tagName: 'image',
                    attributes: {
                        cursor: 'pointer',
                        x: -10,
                        y: -10,
                        width: 20,
                        height: 20,
                        'xlink:href': 'assets/rotate.svg',
                    },
                },
            ],
        },
    ],
    getPosition: function (view: dia.ElementView) {
        const { model } = view;
        const { width } = model.size();
        return new g.Point(width, 0);
    },
    setPosition: function (view: dia.ElementView, coordinates: g.Point) {
        const { model } = view;
        const { width, height } = model.size();
        const center = new g.Point(width / 2, height / 2);
        const angle = center.angleBetween(coordinates, this.getPosition(view));
        model.rotate(Math.round(angle));
    },
});

// Application
// -----------

const shapeNamespace = {
    ...shapes,
    Species,
    Branch,
};

const graph = new dia.Graph({}, { cellNamespace: shapeNamespace });

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: '100%',
    height: '100%',
    model: graph,
    frozen: true,
    async: true,
    overflow: true,
    cellViewNamespace: shapeNamespace,
    clickThreshold: 5,
    interactive: {
        labelMove: true,
        linkMove: false,
        stopDelegation: false,
    },
    snapLabels: true,
    labelsLayer: true,
    background: {
        color: colors.bg,
    },
    defaultConnector: {
        name: 'curve',
        args: {
            sourceDirection: TangentDirections.OUTWARDS,
            targetDirection: TangentDirections.OUTWARDS,
        },
    },
    defaultConnectionPoint: {
        name: 'boundary',
        args: {
            selector: false,
        },
    },
});

// Move the labels layer to the front so that the labels are not covered
// by the link tools.
const labelLayerEl = paper.getLayerNode('labels');
labelLayerEl.parentElement.appendChild(labelLayerEl);

// Events

function onPaperLinkMouseEnter(linkView: dia.LinkView) {
    // Scale the tools based on the width of the link.
    const branchWidth = linkView.model.attr('line/organicStrokeSize') || 5;
    const scale = Math.max(1, Math.min(2, branchWidth / 5));
    const toolsView = new dia.ToolsView({
        tools: [
            new linkTools.Vertices(),
            new linkTools.SourceAnchor({ restrictArea: false, scale }),
            new linkTools.Remove({ scale }),
        ],
    });
    linkView.addTools(toolsView);
}

function onPaperLinkMouseLeave(linkView: dia.LinkView) {
    linkView.removeTools();
}

function onPaperElementPointerclick(elementView: dia.ElementView) {
    paper.removeTools();
    highlighters.mask.removeAll(paper);
    highlighters.mask.add(elementView, 'border', 'node-hgl', {
        attrs: {
            stroke: colors.highlight,
            'stroke-width': 2,
        },
    });
    elementView.addTools(
        new dia.ToolsView({
            tools: [
                new RotateTool({
                    selector: 'border',
                }),
            ],
        })
    );
}

function onBlankPointerclick() {
    paper.removeTools();
    highlighters.mask.removeAll(paper);
}

paper.on({
    'link:mouseenter': onPaperLinkMouseEnter,
    'link:mouseleave': onPaperLinkMouseLeave,
    'element:pointerclick': onPaperElementPointerclick,
    'blank:pointerclick': onBlankPointerclick,
});

// Species
// -------

const porifera = new Species({
    id: 'Porifera',
    position: { x: 696, y: 552 },
    attrs: {
        label: {
            text: 'Porifera',
        },
        icon: {
            xlinkHref: 'assets/porifera.svg',
        },
    },
});

const cnidaria = new Species({
    id: 'Cnidaria',
    position: { x: 264, y: 432 },
    attrs: {
        label: {
            text: 'Cnidaria',
        },
        icon: {
            xlinkHref: 'assets/cnidaria.svg',
        },
    },
});

const cnidaria2 = new Species({
    id: 'Cnidaria2',
    position: { x: 330, y: 396 },
    z: -1,
    angle: 15,
    attrs: {
        icon: {
            xlinkHref: 'assets/cnidaria2.svg',
        },
    },
});

const platyhelmintha = new Species({
    id: 'platyhelmintha',
    position: { x: 768, y: 400 },
    angle: -25,
    attrs: {
        label: {
            text: 'Platyhelmintha',
        },
        icon: {
            xlinkHref: 'assets/platyhelmintha.svg',
        },
    },
});

const brachiopoda = new Species({
    id: 'Brachiopoda',
    position: { x: 840, y: 248 },
    angle: -25,
    attrs: {
        label: {
            text: 'Brachiopoda',
        },
        icon: {
            xlinkHref: 'assets/brachiopoda.svg',
        },
    },
});

const annelida = new Species({
    id: 'Annelida',
    position: { x: 936, y: 112 },
    attrs: {
        label: {
            text: 'Annelida',
        },
        icon: {
            xlinkHref: 'assets/annelida.svg',
        },
    },
});

const mollusca = new Species({
    id: 'Mollusca',
    position: { x: 856, y: 8 },
    angle: -20,
    attrs: {
        label: {
            text: 'Mollusca',
        },
        icon: {
            xlinkHref: 'assets/mollusca.svg',
        },
    },
});

const tarigrada = new Species({
    id: 'Tarigrada',
    position: { x: 560, y: -136 },
    angle: 15,
    attrs: {
        label: {
            text: 'Tarigrada',
        },
        icon: {
            xlinkHref: 'assets/tarigrada.svg',
        },
    },
});

const arthropoda = new Species({
    id: 'Arthropoda',
    position: { x: 784, y: -105 },
    angle: -45,
    attrs: {
        label: {
            text: 'Arthropoda',
        },
        icon: {
            xlinkHref: 'assets/arthropoda.svg',
        },
    },
});

const nematoda = new Species({
    id: 'Nematoda',
    position: { x: 432, y: -56 },
    attrs: {
        label: {
            text: 'Nematoda',
        },
        icon: {
            xlinkHref: 'assets/nematoda.svg',
        },
    },
});

const echinodermata = new Species({
    id: 'Echinodermata',
    position: { x: 56, y: 128 },
    angle: 30,
    attrs: {
        label: {
            text: 'Echinodermata',
        },
        icon: {
            xlinkHref: 'assets/echinodermata.svg',
        },
    },
});

const chordata = new Species({
    id: 'Chordata',
    position: { x: 256, y: 8 },
    angle: 45,
    attrs: {
        label: {
            text: 'Chordata',
        },
        icon: {
            xlinkHref: 'assets/chordata.svg',
        },
    },
});

const chordata2 = new Species({
    id: 'Chordata2',
    position: { x: 290, y: -70 },
    z: -1,
    angle: 15,
    attrs: {
        icon: {
            xlinkHref: 'assets/chordata2.svg',
        },
    },
});

const chordata3 = new Species({
    id: 'Chordata3',
    position: { x: 206, y: -60 },
    z: -1,
    angle: -20,
    attrs: {
        icon: {
            xlinkHref: 'assets/chordata3.svg',
        },
    },
});

chordata.embed([chordata2, chordata3]);
cnidaria.embed([cnidaria2]);

graph.addCells([
    porifera,
    cnidaria,
    cnidaria2,
    platyhelmintha,
    brachiopoda,
    annelida,
    mollusca,
    tarigrada,
    arthropoda,
    nematoda,
    echinodermata,
    chordata,
    chordata2,
    chordata3,
]);

// Branches
// --------

const origin = { x: 500, y: 750 };

const chordataLink = new Branch({
    source: origin,
    target: { id: 'Chordata' },
    vertices: [{ x: 456, y: 328 }],
    attrs: {
        line: {
            organicStrokeSize: 25,
        },
    },
    labels: [
        {
            attrs: {
                labelText: {
                    text: 'Deuterostomia',
                },
            },
            position: {
                distance: 0.65,
                angle: 10,
            },
        },
    ],
});

const arthropodaLink = new Branch({
    source: {
        id: chordataLink.id,
        anchor: { name: 'connectionRatio', args: { ratio: 0.2 } },
    },
    target: { id: 'Arthropoda' },
    vertices: [
        { x: 632, y: 328 },
        { x: 632, y: 120 },
    ],
    attrs: {
        line: {
            organicStrokeSize: 20,
        },
    },
    labels: [
        {
            attrs: {
                labelText: {
                    text: 'Protostomia',
                },
            },
            position: {
                distance: 0.45,
                angle: 10,
            },
        },
    ],
});

const echinodermataLink = new Branch({
    source: {
        id: chordataLink.id,
        anchor: { name: 'connectionRatio', args: { ratio: 0.8 } },
    },
    target: { id: 'Echinodermata' },
    vertices: [{ x: 216, y: 213.4 }],
    attrs: {
        line: {
            organicStrokeSize: 8,
        },
    },
});

const cnidariaLink = new Branch({
    source: {
        id: chordataLink.id,
        anchor: { name: 'connectionRatio', args: { ratio: 0.1 } },
    },
    target: { id: 'Cnidaria' },
    vertices: [{ x: 440, y: 560 }],
    attrs: {
        line: {
            organicStrokeSize: 8,
        },
    },
});

const poriferaLink = new Branch({
    source: {
        id: chordataLink.id,
        anchor: { name: 'connectionRatio', args: { ratio: 0.05 } },
    },
    target: { id: 'Porifera' },
    vertices: [{ x: 608, y: 632 }],
    attrs: {
        line: {
            organicStrokeSize: 8,
        },
    },
});

const nematodaLink = new Branch({
    source: {
        id: arthropodaLink.id,
        anchor: { name: 'connectionRatio', args: { ratio: 0.8 } },
    },
    target: { id: 'Nematoda' },
    vertices: [{ x: 608, y: 32 }],
    attrs: {
        line: {
            organicStrokeSize: 8,
        },
    },
});

const platyhelminthaLink = new Branch({
    source: {
        id: arthropodaLink.id,
        anchor: { name: 'connectionRatio', args: { ratio: 0.2 } },
    },
    target: { id: 'platyhelmintha' },
    vertices: [{ x: 696, y: 462.54 }],
    attrs: {
        line: {
            organicStrokeSize: 8,
        },
    },
});

const tarigradaLink = new Branch({
    source: {
        id: arthropodaLink.id,
        anchor: { name: 'connectionRatio', args: { ratio: 0.9 } },
    },
    target: { id: 'Tarigrada' },
    vertices: [{ x: 674, y: -32 }],
    attrs: {
        line: {
            organicStrokeSize: 6,
        },
    },
});

const brachiopodaLink = new Branch({
    source: {
        id: arthropodaLink.id,
        anchor: { name: 'connectionRatio', args: { ratio: 0.4 } },
    },
    target: { id: 'Brachiopoda' },
    vertices: [{ x: 776, y: 352 }],
    attrs: {
        line: {
            organicStrokeSize: 8,
        },
    },
});

const molluscaLink = new Branch({
    source: {
        id: arthropodaLink.id,
        anchor: { name: 'connectionRatio', args: { ratio: 0.6 } },
    },
    target: { id: 'Mollusca' },
    vertices: [{ x: 784, y: 152 }],
    attrs: {
        line: {
            organicStrokeSize: 11,
        },
    },
});

const annelidaLink = new Branch({
    source: {
        id: molluscaLink.id,
        anchor: { name: 'connectionRatio', args: { ratio: 0.5 } },
    },
    target: { id: 'Annelida' },
    vertices: [{ x: 856, y: 199.31 }],
    attrs: {
        line: {
            organicStrokeSize: 6,
        },
    },
});

graph.addCells([
    chordataLink,
    echinodermataLink,
    arthropodaLink,
    cnidariaLink,
    poriferaLink,
    nematodaLink,
    platyhelminthaLink,
    tarigradaLink,
    brachiopodaLink,
    molluscaLink,
    annelidaLink,
]);

// Fit the content of the paper to the viewport.
// ---------------------------------------------

paper.transformToFitContent({
    horizontalAlign: 'middle',
    verticalAlign: 'middle',
    padding: 50,
    useModelGeometry: true,
});

paper.unfreeze();
