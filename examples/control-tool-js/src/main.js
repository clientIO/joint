import { dia, shapes, elementTools } from '@joint/core';
import './styles.css';

// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 20,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' }
});
paperContainer.appendChild(paper.el);

paper.setGrid('mesh');

const CylinderTiltTool = elementTools.Control.extend({
    getPosition: function(view) {
        const model = view.model;
        const size = model.size();
        const tilt = model.topRy();
        return { x: size.width / 2, y: 2 * tilt };
    },
    setPosition: function(view, coordinates) {
        const model = view.model;
        const size = model.size();
        const tilt = Math.min(Math.max(coordinates.y, 0), size.height) / 2;
        model.topRy(tilt, { ui: true, tool: this.cid });
    }
});

const RadiusTool = elementTools.Control.extend({
    getPosition: function(view) {
        const model = view.model;
        const radius = model.attr(['body', 'ry']) || 0;
        return { x: 0, y: radius };
    },
    setPosition: function(view, coordinates) {
        const model = view.model;
        const size = model.size();
        const ry = Math.min(Math.max(coordinates.y, 0), size.height) / 2;
        model.attr(['body'], { rx: ry, ry: ry }, { ui: true, tool: this.cid });
    }
});

const rectangle = new shapes.standard.Rectangle();
rectangle.resize(100, 100);
rectangle.position(100, 100);
rectangle.addTo(graph);
rectangle.findView(paper).addTools(
    new dia.ToolsView({
        tools: [
            new RadiusTool({
                selector: 'body',
                handleAttributes: {
                    fill: '#4666E5'
                }
            })
        ]
    })
);

const cylinder = new shapes.standard.Cylinder();
cylinder.resize(100, 200);
cylinder.position(300, 50);
cylinder.addTo(graph);
cylinder.findView(paper).addTools(
    new dia.ToolsView({
        tools: [
            new CylinderTiltTool({
                selector: 'body',
                handleAttributes: {
                    fill: '#4666E5'
                }
            })
        ]
    })
);
