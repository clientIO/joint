import { dia, shapes, util, V } from '@joint/core';
import './styles.css';

import bgImage from '../assets/background-image.png';

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    el: document.getElementById('paper-container'),
    width: 600,
    height: 400,
    gridSize: 10,
    drawGrid: true,
    model: graph,
    cellViewNamespace: shapes,
    defaultConnectionPoint: { name: 'anchor' }
});

const elements = [

    new shapes.standard.Path({
        position: { x: 75, y: 175 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'joint' },
            body: { d: 'M 0 0 L calc(w) 0 calc(0.8 * w) calc(h / 2) calc(w) calc(h) 0 calc(h) Z' }
        }
    }),

    new shapes.standard.Path({
        position: { x: 200, y: 275 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'dia' },
            body: { d: 'M calc(0.2 * w) 0 L calc(w) 0 calc(0.8 * w) calc(h / 2) calc(w) calc(h) calc(0.2 * w) calc(h) 0 calc(h / 2) Z' }
        }
    }),

    new shapes.standard.Path({
        position: { x: 200, y: 75 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'util' },
            body: { d: 'M calc(0.2 * w) 0 L calc(w) 0 calc(0.8 * w) calc(h / 2) calc(w) calc(h) calc(0.2 * w) calc(h) 0 calc(h / 2) Z' }
        }
    }),

    new shapes.standard.Path({
        position: { x: 200, y: 175 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'shapes' },
            body: { d: 'M calc(0.2 * w) 0 L calc(w) 0 calc(0.8 * w) calc(h / 2) calc(w) calc(h) calc(0.2 * w) calc(h) 0 calc(h / 2) Z' }
        }
    }),

    new shapes.standard.Path({
        position: { x: 325, y: 175 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'basic' },
            body: { d: 'M calc(0.2 * w) 0 L calc(w) 0 calc(0.8 * w) calc(h / 2) calc(w) calc(h) calc(0.2 * w) calc(h) 0 calc(h / 2) Z' }
        }
    }),

    new shapes.standard.Path({
        position: { x: 450, y: 150 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'Path' },
            body: { d: 'M calc(0.2 * w) 0 L calc(w) 0 calc(w) calc(h) calc(0.2 * w) calc(h) 0 calc(h / 2) Z' }
        }
    }),

    new shapes.standard.Path({
        position: { x: 450, y: 200 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'Text' },
            body: { d: 'M calc(0.2 * w) 0 L calc(w) 0 calc(w) calc(h) calc(0.2 * w) calc(h) 0 calc(h / 2) Z' }
        }
    }),

    new shapes.standard.Path({
        position: { x: 325, y: 250 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'Paper' },
            body: { d: 'M calc(0.2 * w) 0 L calc(w) 0 calc(w) calc(h) calc(0.2 * w) calc(h) 0 calc(h / 2) Z' }
        }
    }),

    new shapes.standard.Path({
        position: { x: 325, y: 300 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'Graph' },
            body: { d: 'M calc(0.2 * w) 0 L calc(w) 0 calc(w) calc(h) calc(0.2 * w) calc(h) 0 calc(h / 2) Z' }
        }
    }),

    new shapes.standard.Path({
        position: { x: 325, y: 100 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'getByPath' },
            body: { d: 'M calc(0.2 * w) 0 L calc(w) 0 calc(w) calc(h) calc(0.2 * w) calc(h) 0 calc(h / 2) Z' }
        }
    }),

    new shapes.standard.Path({
        position: { x: 325, y: 50 },
        size: { width: 100, height: 40 },
        attrs: {
            label: { text: 'setByPath' },
            body: { d: 'M calc(0.2 * w) 0 L calc(w) 0 calc(w) calc(h) calc(0.2 * w) calc(h) 0 calc(h / 2) Z' }
        }
    })
];

// add all elements to the graph
graph.resetCells(elements);

const linkEnds = [
    { source: 0, target:  1 }, { source: 0, target: 2 }, { source: 0, target: 3 },
    { source: 1, target:  7 }, { source: 1, target: 8 },
    { source: 2, target:  9 }, { source: 2, target: 10 },
    { source: 3, target:  4 },
    { source: 4, target:  5 }, { source: 4, target:  6 }
];

// add all links to the graph
linkEnds.forEach(function(ends) {
    new shapes.standard.Link({
        source: { id: elements[ends.source].id },
        target: { id: elements[ends.target].id },
        z: -1 // make sure all links are displayed under the elements
    }).addTo(graph);
});

// cache important html elements
const elOx = document.getElementById('ox');
const elOy = document.getElementById('oy');
const elSx = document.getElementById('sx');
const elSy = document.getElementById('sy');
const elW = document.getElementById('width');
const elH = document.getElementById('height');
const elFtcPadding = document.getElementById('ftc-padding');
const elFtcGridW = document.getElementById('ftc-grid-width');
const elFtcGridH = document.getElementById('ftc-grid-height');
const elFtcNewOrigin = document.getElementById('ftc-new-origin');
const elStfPadding = document.getElementById('stf-padding');
const elStfMinScale = document.getElementById('stf-min-scale');
const elStfMaxScale = document.getElementById('stf-max-scale');
const elStfScaleGrid = document.getElementById('stf-scale-grid');
const elStfRatio = document.getElementById('stf-ratio');
const elStfVerticalAlign = document.getElementById('stf-vertical-align');
const elStfHorizontalAlign = document.getElementById('stf-horizontal-align');
const elBboxX = document.getElementById('bbox-x');
const elBboxY = document.getElementById('bbox-y');
const elBboxW = document.getElementById('bbox-width');
const elBboxH = document.getElementById('bbox-height');
const elGrid = document.getElementById('grid');

// cache important svg elements
const svg = V(paper.svg);
const svgVertical = V('path').attr('d', 'M -10000 -1 L 10000 -1');
const svgHorizontal = V('path').attr('d', 'M -1 -10000 L -1 10000');
const svgRect = V('rect');
const svgAxisX = svgVertical.clone().addClass('axis');
const svgAxisY = svgHorizontal.clone().addClass('axis');
const svgBBox = svgRect.clone().addClass('bbox');

svgBBox.hide = util.debounce(function() {
    svgBBox.removeClass('active');
}, 500);

// svg Container - contains all non-jointjs svg elements
const svgContainer = [];

svgContainer.showAll = function() {
    this.forEach(function(v) { v.addClass('active'); });
};

svgContainer.hideAll = function() {
    this.forEach(function(v) { v.removeClass('active'); });
};

svgContainer.removeAll = function() {
    while (this.length > 0) {
        this.pop().remove();
    }
};

// Axis has to be appended to the svg, so it won't affect the viewport.
svg.append([svgAxisX, svgAxisY, svgBBox]);

function fitToContent() {

    svgContainer.removeAll();

    const padding = parseInt(elFtcPadding.value, 10);
    const gridW = parseInt(elFtcGridW.value, 10);
    const gridH = parseInt(elFtcGridH.value, 10);
    const allowNewOrigin = elFtcNewOrigin.value;

    paper.fitToContent({
        padding: padding,
        gridWidth: gridW,
        gridHeight: gridH,
        allowNewOrigin: allowNewOrigin
    });

    const bbox = paper.getContentBBox();
    const { tx, ty } = paper.translate();

    const translatedX = allowNewOrigin == 'any' || (allowNewOrigin == 'positive' && bbox.x - tx >= 0) || (allowNewOrigin == 'negative' && bbox.x - tx < 0);
    const translatedY = allowNewOrigin == 'any' || (allowNewOrigin == 'positive' && bbox.y - ty >= 0) || (allowNewOrigin == 'negative' && bbox.y - ty < 0);
    if (padding) {

        const svgPaddingRight = svgHorizontal.clone().addClass('padding')
            .translate(paper.options.width - padding / 2, 0, { absolute: true })
            .attr('stroke-width', padding);

        const svgPaddingBottom = svgVertical.clone().addClass('padding')
            .translate(0, paper.options.height - padding / 2, { absolute: true })
            .attr('stroke-width', padding);

        svg.append([svgPaddingBottom, svgPaddingRight]);
        svgContainer.push(svgPaddingBottom, svgPaddingRight);
    }

    if (padding && (translatedX || translatedY)) {

        const paddings = [];

        if (translatedY) {

            const svgPaddingTop = svgVertical.clone().addClass('padding')
                .translate(0, padding / 2, { absolute: true })
                .attr('stroke-width', padding);

            paddings.push(svgPaddingTop);
        }

        if (translatedX) {

            const svgPaddingLeft = svgHorizontal.clone().addClass('padding')
                .translate(padding / 2, 0, { absolute: true })
                .attr('stroke-width', padding);

            paddings.push(svgPaddingLeft);
        }

        if (paddings.length) {
            svg.append(paddings);
            svgContainer.push.apply(svgContainer, paddings);
        }
    }

    if (gridW > 2) {

        let x = gridW;

        if (translatedX) x += padding;

        do {

            var svgGridX = svgHorizontal.clone().translate(x, 0, { absolute: true }).addClass('grid');
            svg.append(svgGridX);
            svgContainer.push(svgGridX);

            x += gridW;

        } while (x < paper.options.width - padding);
    }

    if (gridH > 2) {

        let y = gridH;

        if (translatedY) y += padding;

        do {

            var svgGridY = svgVertical.clone().translate(0, y, { absolute: true }).addClass('grid');
            svg.append(svgGridY);
            svgContainer.push(svgGridY);
            y += gridH;

        } while (y < paper.options.height - padding);
    }

    svgContainer.showAll();
}

function transformToFitContent() {

    svgContainer.removeAll();

    const padding = parseInt(elStfPadding.value, 10);

    paper.transformToFitContent({
        padding: padding,
        minScale: parseFloat(elStfMinScale.value),
        maxScale: parseFloat(elStfMaxScale.value),
        scaleGrid: parseFloat(elStfScaleGrid.value),
        preserveAspectRatio: elStfRatio.checked,
        verticalAlign: elStfVerticalAlign.value,
        horizontalAlign: elStfHorizontalAlign.value,
    });

    paper.layers.getBoundingClientRect(); // MS Edge hack to fix the invisible text.

    if (padding) {

        const svgPaddingRight = svgHorizontal.clone().addClass('padding')
            .translate(paper.options.width - padding / 2, 0, { absolute: true })
            .attr('stroke-width', padding);

        const svgPaddingBottom = svgVertical.clone().addClass('padding')
            .translate(0, paper.options.height - padding / 2, { absolute: true })
            .attr('stroke-width', padding);

        const svgPaddingLeft = svgVertical.clone().addClass('padding')
            .translate(0, padding / 2, { absolute: true })
            .attr('stroke-width', padding);

        const svgPaddingTop = svgHorizontal.clone().addClass('padding')
            .translate(padding / 2, 0, { absolute: true })
            .attr('stroke-width', padding);

        svg.append([svgPaddingBottom, svgPaddingRight, svgPaddingTop, svgPaddingLeft]);
        svgContainer.push(svgPaddingBottom, svgPaddingRight, svgPaddingTop, svgPaddingLeft);
    }

    svgContainer.showAll();
}

function updateBBox() {

    const bbox = paper.getContentBBox();
    const { tx, ty } = paper.translate();

    elBboxX.textContent = Math.round(bbox.x - tx);
    elBboxY.textContent = Math.round(bbox.y - ty);
    elBboxW.textContent = Math.round(bbox.width);
    elBboxH.textContent = Math.round(bbox.height);

    svgBBox.attr(bbox).addClass('active').hide();
}

/* events */

function addInputChangeListener(el, fn) {
    el.addEventListener('input', fn);
    el.addEventListener('change', fn);
}

document.querySelectorAll('#fit-to-content input, #fit-to-content select').forEach(function(el) {
    addInputChangeListener(el, fitToContent);
});
document.getElementById('scale-to-fit').addEventListener('change', transformToFitContent);
document.getElementById('stf-scale-to-fit').addEventListener('click', transformToFitContent);

addInputChangeListener(elOx, function() {
    paper.translate(parseInt(this.value, 10), parseInt(elOy.value, 10));
});
addInputChangeListener(elOy, function() {
    paper.translate(parseInt(elOx.value, 10), parseInt(this.value, 10));
});
addInputChangeListener(elSx, function() {
    paper.scale(parseFloat(this.value), parseFloat(elSy.value));
});
addInputChangeListener(elSy, function() {
    paper.scale(parseFloat(elSx.value), parseFloat(this.value));
});
addInputChangeListener(elW, function() {
    paper.setDimensions(parseInt(this.value, 10), parseInt(elH.value,10));
});
addInputChangeListener(elH, function() {
    paper.setDimensions(parseInt(elW.value, 10), parseInt(this.value, 10));
});
addInputChangeListener(elGrid, function() {
    paper.setGridSize(this.value);
});
document.querySelectorAll('.range').forEach(function(el) {
    addInputChangeListener(el, function() {
        this.nextElementSibling.textContent = this.value;
    });
});

paper.on({

    scale: function(sx, sy) {

        elSx.value = sx;
        elSx.nextElementSibling.textContent = sx.toFixed(2);
        elSy.value = sy;
        elSy.nextElementSibling.textContent = sy.toFixed(2);

        svgContainer.hideAll();
    },

    translate: function(ox, oy) {

        elOx.value = ox;
        elOx.nextElementSibling.textContent = Math.round(ox);
        elOy.value = oy;
        elOy.nextElementSibling.textContent = Math.round(oy);

        // translate axis
        svgAxisX.translate(0, oy, { absolute: true });
        svgAxisY.translate(ox, 0, { absolute: true });

        svgContainer.hideAll();
    },

    resize: function(width, height) {

        elW.value = width;
        elW.nextElementSibling.textContent = Math.round(width);
        elH.value = height;
        elH.nextElementSibling.textContent = Math.round(height);

        svgContainer.hideAll();
    }
});

graph.on('change', function() {
    svgContainer.hideAll();
    setTimeout(() => {
        updateBBox();
    }, 0);
});

updateBBox();

document.querySelectorAll('#bg-toggle, #bg-color, #bg-repeat, #bg-opacity, #bg-size, #bg-position').forEach(function(el) {
    addInputChangeListener(el, function() {
        paper.drawBackground({
            color: document.getElementById('bg-color').value,
            image: document.getElementById('bg-toggle').checked ? bgImage : '',
            position: JSON.parse(document.getElementById('bg-position').value.replace(/'/g, '"')),
            size: JSON.parse(document.getElementById('bg-size').value.replace(/'/g, '"')),
            repeat: document.getElementById('bg-repeat').value,
            opacity: document.getElementById('bg-opacity').value
        });
    });
});

const _inputRenderer = function(gridTypes, onChange) {

    const currentOpt = {};
    const formTypes = {
        'color': function(inputDef, container) {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = inputDef.value;
            addInputChangeListener(input, function() {
                inputDef.onChange(this.value, currentOpt);
                onChange(currentOpt);
            });
            input.dispatchEvent(new Event('change'));
            const label = document.createElement('label');
            label.textContent = inputDef.name;
            container.appendChild(label);
            container.appendChild(input);
        },
        'number': function(inputDef, container) {
            const input = document.createElement('input');
            input.type = 'range';
            input.value = inputDef.value;
            input.step = inputDef.step;
            input.min = inputDef.min;
            input.max = inputDef.max;
            addInputChangeListener(input, function() {
                const value = parseFloat(this.value).toFixed(2);
                this.parentElement.querySelector('output').textContent = value;
                inputDef.onChange(value, currentOpt);
                onChange(currentOpt);
            });
            input.dispatchEvent(new Event('change'));
            const label = document.createElement('label');
            label.textContent = inputDef.name;
            container.appendChild(label);
            container.appendChild(input);
            const output = document.createElement('output');
            output.textContent = input.value;
            container.appendChild(output);
        }
    };

    const renderInput =  function(formType, container) {
        return formTypes[formType.type](formType, container);
    };

    return {
        renderSettings: function(gridTypeName) {
            currentOpt.name = gridTypeName;
            currentOpt.args = [{}, {}];
            gridTypes[gridTypeName].inputs.forEach(function(x) {
                const element = document.createElement('div');
                element.className = 'form-group';
                gridTypesOpt.appendChild(element);
                renderInput(x, element);
            });
            onChange(currentOpt);
        }
    };
};

const gridTypes = {
    'dot': {
        inputs: [{
            type: 'color', name: 'Color', value: '#000000',
            onChange: function(value, ref) {
                ref.args[0].color = value;
            }
        }, {
            type: 'number', name: 'Thickness', value: 1, step: 0.5, min: 0.5, max: 10,
            onChange: function(value, ref) {
                ref.args[0].thickness = value;
            }
        }]
    },
    'fixedDot': {
        inputs: [{
            type: 'color', name: 'Color', value: '#000000',
            onChange: function(value, ref) {
                ref.args[0].color = value;
            }
        }, {
            type: 'number', name: 'Thickness', value: 1, step: 0.5, min: 0.5, max: 10,
            onChange: function(value, ref) {
                ref.args[0].thickness = value;
            }
        }]
    },
    'mesh': {
        inputs: [{
            type: 'color', name: 'Color', value: '#000000',
            onChange: function(value, ref) {
                ref.args[0].color = value;
            }
        }, {
            type: 'number', prop: 'thickness', name: 'Thickness', value: 1, step: 0.5, min: 0.5, max: 10,
            onChange: function(value, ref) {
                ref.args[0].thickness = value;
            }
        }]
    },
    'doubleMesh': {
        inputs: [{
            type: 'color', name: 'Primary Color', value: '#AAAAAA',
            onChange: function(value, ref) {
                ref.args[0].color = value;
            }
        }, {
            type: 'number', name: 'Primary Thickness', value: 1, step: 0.5, min: 0.5, max: 5,
            onChange: function(value, ref) {
                ref.args[0].thickness = value;
            }
        }, {
            type: 'color', name: 'Secondary Color', value: '#000000',
            onChange: function(value, ref) {
                ref.args[1].color = value;
            }
        }, {
            type: 'number', name: 'Secondary Thickness', value: 3, step: 0.5, min: 0.5, max: 5,
            onChange: function(value, ref) {
                ref.args[1].thickness = value;
            }
        }, {
            type: 'number', name: 'Scale Factor', value: 5, step: 1, min: 1, max: 10,
            onChange: function(value, ref) {
                ref.args[1].scaleFactor = value;
            }
        }]
    }
};
const renderer = _inputRenderer(gridTypes, function(gridOpt) {

    paper.setGrid(gridOpt);
});

const gridTypesOpt = document.querySelector('.grid-types-opt');

const elGridType = document.getElementById('grid-type');
addInputChangeListener(elGridType, function() {
    gridTypesOpt.innerHTML = '';
    renderer.renderSettings(this.value);
});

renderer.renderSettings(elGridType.value);
