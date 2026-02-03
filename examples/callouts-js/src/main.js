import { g, dia, shapes, elementTools } from '@joint/core';
import './styles.css';

// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 5,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' }
});

paperContainer.appendChild(paper.el);

function getOvalPath(cx, cy, rx, ry) {
    return `
        M ${cx - rx} ${cy}
        a ${rx} ${ry} 0 1 1 ${rx * 2} 0
        a ${rx} ${ry} 0 1 1 ${-rx * 2} 0
    `;
}

function getOvalCalloutPath(size, delta) {
    const { width, height } = size;
    const rx = width / 2;
    const ry = height / 2;
    const center = new g.Point(rx, ry);
    const ellipse = new g.Ellipse(center, rx, ry);
    if (ellipse.containsPoint(delta)) {
        return getOvalPath(rx, ry, rx, ry);
    }
    const angle = 10;
    const line = new g.Line(center, delta);
    line.setLength(1e6);
    const [{ x: x1, y: y1 }] = ellipse.intersectionWithLine(line.clone().rotate(center, -angle));
    const [{ x: x2, y: y2 }] = ellipse.intersectionWithLine(line.clone().rotate(center, angle));
    return `
        M ${x1} ${y1}
        L ${delta.x} ${delta.y}
        L ${x2} ${y2}
        A ${rx} ${ry} 0 1 0 ${x1} ${y1}
    `;
}

function getRectangleCalloutPath(size, delta, r = 10) {
    const { width: w, height: h } = size;
    const rect = new g.Rect(size);
    const rectPathArray = [
        `M 0 ${r}`,
        `V ${h - r}`, // LEFT
        `a ${r} ${r} 0 0 0 ${r} ${r}`,
        `H ${w - r}`, // BOTTOM
        `a ${r} ${r} 0 0 0 ${r} -${r}`,
        `V ${r}`, // RIGHT
        `a ${r} ${r} 0 0 0 -${r} -${r}`,
        `H ${r}`, // TOP
        `a ${r} ${r} 0 0 0 -${r} ${r}`
    ];
    if (rect.containsPoint(delta)) {
        return rectPathArray.join(' ');
    }
    switch (rect.sideNearestToPoint(delta)) {
        case 'left': {
            const y1 = h / 2 - 10;
            const y2 = h / 2 + 10;
            rectPathArray[1] = `V ${y1} L ${delta.x} ${delta.y} 0 ${y2} 0 ${h - r}`;
            break;
        }
        case 'right': {
            const y1 = h / 2 - 10;
            const y2 = h / 2 + 10;
            rectPathArray[5] = `V ${y2} L ${delta.x} ${delta.y} ${w} ${y1} ${w} ${r}`;
            break;
        }
        case 'bottom':
        case 'top': {
            let x1, x2;
            if (delta.x > w / 2) {
                x2 = 3 * w / 4 + 10;
                x1 = 3 * w / 4 - 10;
            } else {
                x2 = w / 4 + 10;
                x1 = w / 4 - 10;
            }
            if (delta.y < 0) {
                rectPathArray[7] = `L ${x2} 0 ${delta.x} ${delta.y} ${x1} 0 ${r} 0`;
                break;
            } else {
                rectPathArray[3] = `L ${x1} ${h} ${delta.x} ${delta.y} ${x2} ${h} ${w - r} ${h}`;
                break;
            }
        }
    }
    return rectPathArray.join(' ');
}

function getThoughtCalloutPath(size, delta) {
    const { width: w, height: h } = size;
    const rx = w / 2;
    const ry = h / 2;
    const center = new g.Point(rx, ry);
    const ellipse = new g.Ellipse(center, rx, ry);
    if (ellipse.containsPoint(delta)) {
        return getOvalPath(rx, ry, rx, ry);
    }
    const lineAnchor = new g.Point(w / 4, ry);
    const [intersection] = ellipse.intersectionWithLine(new g.Line(lineAnchor, delta));
    const distance = delta.distance(intersection);
    const bubbles = [getOvalPath(rx, ry, rx, ry)];
    const p = delta.clone();
    const count = Math.min(Math.floor(distance / 40), 6);
    for (let i = 0; i <= count; i++) {
        p.move(intersection, - distance / (count + 2));
        const cx = p.x;
        const cy = p.y;
        const rx = i * 4;
        const ry = i * 2;
        bubbles.push(getOvalPath(cx, cy, rx, ry));
    }
    return bubbles.join(' ');
}

function getBraceCalloutPath(size, delta) {
    const { height: h } = size;
    const s = 10;
    const bracePath = `
        M 0 0
        A ${s} ${s} 0 0 0 -${s} ${s}
        V ${h / 2 - s}
        l ${-s} ${s}
        l ${s} ${s}
        V ${h - s}
        A ${s} ${s} 0 0 0 0 ${h}
    `;
    const rect = new g.Rect(size);
    if (rect.containsPoint(delta) || delta.x > 0) {
        return bracePath;
    }
    const y = Math.max(Math.min(delta.y, h), 0);
    const lineY = (Math.abs(y - h / 2) < s) ? Math.sign(y - h / 2) * s + h / 2 : y;
    return `${bracePath} M ${-2 * s} ${lineY} L ${delta.x} ${delta.y}`;
}

function updateElementCallout(el) {
    const anchor = new g.Point(el.get('calloutAnchor'));
    const delta = (el.get('isCalloutAnchorRelative'))
        ? anchor : anchor.difference(el.position());
    updateElementCalloutPath(el, delta);
}


const CalloutType = {
    Rectangle: 'rectangle',
    Oval: 'oval',
    Thought: 'thought',
    Brace: 'brace',
};

function updateElementCalloutPath(el, delta) {
    let d;
    const size = el.size();
    switch (el.get('calloutType')) {
        case CalloutType.Oval: {
            d = getOvalCalloutPath(size, delta);
            break;
        }
        case CalloutType.Thought: {
            d = getThoughtCalloutPath(size, delta);
            break;
        }
        case CalloutType.Brace: {
            d = getBraceCalloutPath(size, delta);
            break;
        }
        case CalloutType.Rectangle:
        default: {
            d = getRectangleCalloutPath(size, delta, el.get('radius'));
            break;
        }
    }
    el.attr('body/d', d);
}

const CalloutRelativeAnchorTool = elementTools.Control.extend({
    getPosition: function(view) {
        const { x = 0, y = 0 } = view.model.get('calloutAnchor') || {};
        return { x, y };
    },
    setPosition: function(view, coordinates) {
        view.model.set('calloutAnchor', { x: coordinates.x, y: coordinates.y });
    }
});

const CalloutAbsoluteAnchorTool = elementTools.Control.extend({
    getPosition: function(view) {
        const anchor = new g.Point(view.model.get('calloutAnchor'));
        const position = view.model.position();
        return anchor.difference(position);
    },
    setPosition: function(view, coordinates) {
        const { x, y } = view.model.position().offset(coordinates);
        view.model.set('calloutAnchor', { x, y });
    }
});

const r = new shapes.standard.Path({
    size: {
        width: 150,
        height: 100
    },
    position: {
        x: 200,
        y: 50
    },
    calloutType: CalloutType.Rectangle,
    calloutAnchor: { x: 0, y: 150 },
    isCalloutAnchorRelative: true,
    radius: 10,
    attrs: {
        body: {
            refD: null,
            stroke: '#ff4468',
            fill: {
                type: 'linearGradient',
                stops: [
                    { offset: 0, color: '#fbf5d0' },
                    { offset: 1, color: '#fcfef4' },
                ]
            }
        },
        label: {
            text: 'Rounded Rectangle\n(Relative)',
            textWrap: {
                width: -10,
                height: -10,
                preserveSpaces: true
            },
            fill: '#ff4468',
            fontSize: 14,
            fontFamily: 'sans-serif'
        }
    }
});

const rr = new shapes.standard.Path({
    size: {
        width: 150,
        height: 100
    },
    position: {
        x: 500,
        y: 50
    },
    calloutType: CalloutType.Rectangle,
    calloutAnchor: { x: 400, y: 170 },
    isCalloutAnchorRelative: false,
    radius: 0,
    attrs: {
        body: {
            stroke: '#330800',
            fill: {
                type: 'linearGradient',
                stops: [
                    { offset: 0, color: '#ffd4cc' },
                    { offset: 1, color: '#ffeae5' },
                ]
            },
            refD: null,
        },
        label: {
            text: 'Rectangle\n(Absolute)',
            textWrap: {
                width: -10,
                height: -10,
                preserveSpaces: true
            },
            fill: '#330800',
            fontSize: 14,
            fontFamily: 'sans-serif'
        }
    }
});

const c = new shapes.standard.Path({
    size: {
        width: 150,
        height: 100
    },
    position: {
        x: 300,
        y: 230
    },
    calloutType: CalloutType.Thought,
    calloutAnchor: { x: -50, y: 200 },
    isCalloutAnchorRelative: true,
    attrs: {
        body: {
            stroke: '#c7afc0',
            fill: {
                type: 'linearGradient',
                stops: [
                    { offset: 0, color: '#f3eef2' },
                    { offset: 1, color: '#ddcfd8' },
                ]
            },
            refD: null,
        },
        label: {
            text: 'Thought\n(Relative)',
            textWrap: {
                width: -10,
                height: -10
            },
            fill: '#330800',
            fontSize: 14,
            fontFamily: 'sans-serif'
        }
    }
});

const o = new shapes.standard.Path({
    size: {
        width: 150,
        height: 100
    },
    position: {
        x: 500,
        y: 300
    },
    calloutType: CalloutType.Oval,
    calloutAnchor: { x: 680, y: 250 },
    isCalloutAnchorRelative: false,
    attrs: {
        body: {
            refD: null,
            stroke: '#330800',
            fill: {
                type: 'linearGradient',
                stops: [
                    { offset: 0, color: '#b3f2ff' },
                    { offset: 1, color: '#e5fbff' },
                ]
            }
        },
        label: {
            text: 'Oval\n(Absolute)',
            textWrap: {
                width: -10,
                height: -10
            },
            fill: '#330800',
            fontSize: 14,
            fontFamily: 'sans-serif'
        }
    }
});

const b = new shapes.standard.Path({
    size: {
        width: 150,
        height: 100
    },
    position: {
        x: 100,
        y: 300
    },
    calloutType: CalloutType.Brace,
    calloutAnchor: { x: 0, y: 480 },
    isCalloutAnchorRelative: false,
    attrs: {
        body: {
            refD: null,
            stroke: '#4e628d',
            fill: 'transparent'
        },
        label: {
            text: 'Callouts',
            fill: '#4e628d',
            fontSize: 20,
            fontFamily: 'sans-serif',
            refX: null,
            refY: null,
            x: -30,
            y: 'calc(h/2)',
            textVerticalAnchor: 'middle',
            textAnchor: 'end'
        }
    }
});

graph.on('change:position change:calloutAnchor', (el) => updateElementCallout(el));

graph.on('change:position', (el) => {
    if (el === b) return;
    b.fitEmbeds({ padding: bracePadding });
    updateElementCallout(b);
});

const bracePadding = { vertical: 20, horizontal: 50 };
const callouts = [o, r, rr, c, b];
graph.addCells(callouts);
b.embed([o, r, rr, c]);
b.fitEmbeds({ padding: bracePadding });

callouts.forEach((el) => {
    updateElementCallout(el);
    el.findView(paper).addTools(
        new dia.ToolsView({
            tools: (el.get('isCalloutAnchorRelative'))
                ? [new CalloutRelativeAnchorTool({
                    handleAttributes: {
                        'fill': 'transparent',
                        'stroke': '#666',
                        'stroke-width': 1,
                        'stroke-dasharray': '3,3',
                    }
                })]
                : [new CalloutAbsoluteAnchorTool({
                    handleAttributes: {
                        'fill-opacity': 0.2,
                        'fill': '#666',
                        'stroke': '#666',
                        'stroke-width': 1,
                    }
                })]
        })
    );
});

