import { dia, shapes, linkTools, elementTools } from '@joint/core';

import './styles.css';

class ResizeTool extends elementTools.Control {
    getPosition(view) {
        const model = view.model;
        const { width, height } = model.size();
        return { x: width, y: height };
    }

    setPosition(view, coordinates) {
        const model = view.model;
        model.resize(
            Math.max(Math.round(coordinates.x / 10) * 10, 50),
            Math.max(Math.round(coordinates.y / 10) * 10, 50)
        );
    }
}

const graph = new dia.Graph({}, { cellNamespace: shapes });

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 800,
    height: 800,
    model: graph,
    cellViewNamespace: shapes,
    async: true,
    frozen: true,
    defaultAnchor: { name: 'midSide', args: { mode: 'right-left' } },
    defaultConnector: { name: 'rounded', args: { radius: 8 } }
});

// Router options, tuned live from the toolbar.
const options = { sourceMargin: 20, targetMargin: 20, minPathMargin: 20 };

// A rectangle with an extra rect behind the body that visualises its routing
// margin: the band's stroke width is half the margin (margin = strokeWidth * 2).
const MarginRectangle = shapes.standard.Rectangle.define('demo.MarginRectangle', {
    attrs: {
        margin: {
            x: 0,
            y: 0,
            width: 'calc(w)',
            height: 'calc(h)',
            rx: 8,
            ry: 8,
            fill: 'none',
            stroke: '#226CE0',
            strokeOpacity: 0.15,
            pointerEvents: 'none'
        },
        body: { rx: 8, ry: 8, stroke: '#226CE0', fill: '#eef4ff' }
    }
}, {
    markup: [
        { tagName: 'rect', selector: 'margin' },
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' }
    ]
});

const el1 = new MarginRectangle({
    position: { x: 200, y: 50 },
    size: { width: 110, height: 44 },
    attrs: { label: { text: 'Source', fontSize: 12 } }
});

const el2 = new MarginRectangle({
    position: { x: 220, y: 120 },
    size: { width: 110, height: 44 },
    attrs: { label: { text: 'Target', fontSize: 12 } }
});

const link = new shapes.standard.Link({
    source: { id: el1.id },
    target: { id: el2.id },
    // The rightAngle router is set explicitly on the link.
    router: { name: 'rightAngle', args: { ...options } },
    attrs: {
        line: {
            stroke: '#f43f5e',
            strokeWidth: 3,
            targetMarker: { fill: '#f43f5e' }
        },
        // The wrapper band visualises the minPathMargin corridor.
        wrapper: {
            stroke: '#f43f5e',
            strokeOpacity: 0.2,
            strokeLinecap: 'butt'
        }
    }
});

graph.addCells([el1, el2, link]);

el1.findView(paper).addTools(
    new dia.ToolsView({
        tools: [
            new ResizeTool({
                selector: 'body'
            })
        ]
    })
);

el2.findView(paper).addTools(
    new dia.ToolsView({
        tools: [
            new ResizeTool({
                selector: 'body'
            })
        ]
    })
);

link.findView(paper).addTools(
    new dia.ToolsView({
        tools: [
            new linkTools.Vertices({
                focusOpacity: 0.5
            }),
            new linkTools.TargetAnchor({
                focusOpacity: 0.5,
                scale: 1.2
            }),
            new linkTools.SourceAnchor({
                focusOpacity: 0.5,
                scale: 1.2
            })
        ]
    })
);

function render() {
    // The band straddles the element edge, so a strokeWidth of margin * 2
    // extends the margin distance outward on every side.
    el1.attr('margin/strokeWidth', options.sourceMargin * 2);
    el2.attr('margin/strokeWidth', options.targetMargin * 2);
    link.attr('wrapper/strokeWidth', options.minPathMargin * 2);
    link.router('rightAngle', { ...options });
}

function bind(id, key) {
    const input = document.getElementById(id);
    const output = document.getElementById(`${id}-val`);
    input.value = options[key];
    output.textContent = options[key];
    input.addEventListener('input', () => {
        options[key] = Number(input.value);
        output.textContent = options[key];
        render();
    });
}

bind('source-margin', 'sourceMargin');
bind('target-margin', 'targetMargin');
bind('min-path-margin', 'minPathMargin');

render();
paper.unfreeze();
