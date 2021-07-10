const { dia, g: geometry, V: vectorizer } = joint;

const y = 200;
const x1 = 100;
const x2 = 700;

const graph = new dia.Graph();
const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 800,
    height: 300,
    model: graph,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color:  '#F3F7F6' },
    defaultConnectionPoint: {
        name: 'boundary',
    },
    restrictTranslate: (elementView) => {
        // Restrict the element movement along the line only
        const { height } = elementView.model.size();
        return new geometry.Rect(x1, y - height, x2 - x1, 0);
    }
});

paper.el.style.border = '1px solid #E5E5E5';

// Draw a line behind all cells into the paper
const line = vectorizer('line', {
    'x1': x1,
    'y1': y,
    'x2': x2,
    'y2': y,
    'stroke': '#333',
    'stroke-width': 2
});
line.appendTo(paper.getLayerNode(dia.Paper.Layers.BACK));

// The style can be added in an external CSS file too
const style = vectorizer.createSVGStyle(`
    .joint-type-bandwidth .bandwidth__halo,
    .joint-type-bandwidth:hover .bandwidth__sideband {
        stroke: #FC3465;
    }
    .joint-type-bandwidth.bandwidth--resizing .bandwidth__halo,
    .joint-type-bandwidth:hover .bandwidth__halo {
        opacity: 0.5;
    }
`);
paper.svg.appendChild(style);

// Bandwidth shape definition
const Bandwidth = dia.Element.define('Bandwidth', {
    size: {
        width: 100,
        height: 50
    },
    attrs: {
        body: {
            width: 'calc(w)',
            height: 'calc(h)',
            strokeWidth: 4,
            stroke: '#A0A0A0',
            fill: '#FFFFFF'
        },
        topLabel: {
            x: 'calc(0.5*w)',
            y: -20,
            textVerticalAnchor: 'bottom',
            textAnchor: 'middle',
            text: 'Carrier\nFrequency',
            fontSize: 12,
            fontFamily: 'sans-serif',
            stroke: '#222222',
        },
        bottomLabel: {
            x: 'calc(0.5*w)',
            y: 'calc(h+20)',
            textVerticalAnchor: 'top',
            textAnchor: 'middle',
            text: '50 MHz',
            fontSize: 14,
            fontFamily: 'sans-serif',
            stroke: '#222222'
        },
        frequencyMarkers: {
            fill: 'none',
            stroke: '#4666E5',
            strokeWidth: 4
        },
        carrierFrequencyBandwidth: {
            d: 'M 10 calc(0.5*h) L calc(w-10) calc(0.5*h)',
            pointerEvents: 'none',
            sourceMarker: {
                'type': 'path',
                'd': 'M 10 -5 -1 0 10 5 z'
            },
            targetMarker: {
                'type': 'path',
                'd': 'M 10 -5 -1 0 10 5 z'
            }
        },
        carrierFrequency: {
            d: 'M calc(.5*w) calc(h+10) calc(.5*w) -20'
        },
        sidebands: {
            fill: 'none',
            stroke: '#222222',
            strokeWidth: 5,
            strokeLinecap: 'round',
            cursor: 'col-resize',
            event: 'bandwidth:resize'
        },
        lowerSideband: {
            d: 'M 0 0 0 calc(h)',
        },
        upperSideband: {
            d: 'M calc(w) 0 calc(w) calc(h)',
        },
        halo: {
            opacity: 0,
            fill: 'white',
            pointerEvents: 'none',
            r: 'calc(0.5*d+20)',
            cx: 'calc(0.5*w)',
            cy: 'calc(0.5*h)',

        }
    }
}, {
    markup: [{
        tagName: 'circle',
        className: 'bandwidth__halo',
        selector: 'halo'
    }, {
        tagName: 'rect',
        selector: 'body',
    }, {
        tagName: 'text',
        selector: 'topLabel'
    }, {
        tagName: 'text',
        selector: 'bottomLabel'
    }, {
        tagName: 'path',
        className: 'bandwidth__sideband',
        selector: 'lowerSideband',
        groupSelector: 'sidebands'
    }, {
        tagName: 'path',
        className: 'bandwidth__sideband',
        selector: 'upperSideband',
        groupSelector: 'sidebands'
    }, {
        tagName: 'path',
        selector: 'carrierFrequencyBandwidth',
        groupSelector: 'frequencyMarkers'
    }, {
        tagName: 'path',
        selector: 'carrierFrequency',
        groupSelector: 'frequencyMarkers',
    }],

    updateFrequencyLabel(opt) {
        const { x } = this.getBBox().center();
        this.attr('bottomLabel/text', `${x} MHz`, opt);
        return this;
    }
});

const b1 = new Bandwidth();
b1.position(200, y - 50).updateFrequencyLabel().addTo(graph);

const b2 = new Bandwidth();
b2.position(400, y - 50).updateFrequencyLabel().addTo(graph);

// Update the bandwidth label upon the position or size change
graph.on('change', (bandwidth) => {
    if ('size' in bandwidth.changed || 'position' in bandwidth.changed) {
        bandwidth.updateFrequencyLabel();
    }
});

paper.on('element:pointerdown', function(elementView) {
    elementView.model.toFront();
});

// Drag & drop bandwidth resize
paper.on('bandwidth:resize', function(bandwidthView, evt) {
    evt.stopPropagation();
    bandwidthView.model.toFront();
    bandwidthView.el.classList.add('bandwidth--resizing');
    bandwidthView.delegateDocumentEvents({
        'mousemove': function(evt) {
            const { paper, bandwidthView, center } = evt.data;
            const { model: bandwidth } = bandwidthView;
            const bbox = bandwidth.getBBox();
            const point = paper.clientToLocalPoint(evt.clientX, evt.clientY);
            const dx = Math.max(Math.abs(point.x - center.x), 1);
            const width = 2 * dx;
            const x = center.x - dx;
            if ((x >= x1) && (x + width <= x2 )) {
                bandwidth.set({
                    size: { width, height: bbox.height  },
                    position: { x, y: bbox.y }
                });
            }
        },
        'mouseup': function(evt) {
            const { bandwidthView } = evt.data;
            bandwidthView.undelegateDocumentEvents();
            bandwidthView.el.classList.remove('bandwidth--resizing');
        }
    }, {
        center: bandwidthView.model.getBBox().center(),
        paper,
        bandwidthView
    });
});
