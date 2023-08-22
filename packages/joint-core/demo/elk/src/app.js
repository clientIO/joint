import * as joint from '../../../build/joint';
import ELK from 'elkjs/lib/elk-api.js';
import elkWorker from 'elkjs/lib/elk-worker.js';
import { Child, Label, Edge } from './shapes';
import elkGraph from '../elkGraph.json';

const fullViewThreshold = 0.7;
const minimalViewThreshold = 0.4;

export const init = () => {
    const canvas = document.getElementById('canvas');

    const graph = new joint.dia.Graph();

    const paper = new joint.dia.Paper({
        model: graph,
        width: 1000,
        height: 600,
        gridSize: 1,
        interactive: false,
        async: true,
        frozen: true,
        sorting: joint.dia.Paper.sorting.APPROX,
        background: { color: '#F3F7F6' },
        viewport: (view) => {
            const { sx } = paper.scale();
            const cell = view.model;
            if (!cell) return true;
            if (sx <= fullViewThreshold) {
                switch (cell.get('type')) {
                    case 'app.Label': {
                        if (sx < minimalViewThreshold) return false;
                        return !cell.getParentCell().isEmbedded() && cell.get('simplifiedViewLabel');
                    }
                    case 'app.Edge': {
                        return !cell.getTargetCell().isEmbedded() && !cell.getSourceCell().isEmbedded();
                    }
                    case 'standard.Circle': {
                        // Junction Points
                        return false;
                    }
                    default: {
                        return !cell.isEmbedded();
                    }
                }
            }
            return true;
        }
    });

    function toggleViewClass() {
        const { sx } = paper.scale();
        paper.el.classList.toggle('full-view', sx > fullViewThreshold);
        paper.el.classList.toggle('minimal-view', sx < minimalViewThreshold);
    }

    paper.on('scale', () => toggleViewClass());
    toggleViewClass();

    const elk = new ELK({
        workerFactory: url => new elkWorker.Worker(url)
    });
    const mapPortIdToShapeId = {};

    const addChildren = (children, parent) => {
        children.forEach(child => {

            const { ports = [], children = [], labels = [] } = child;

            const shape = new Child({
                id: child.id,
                position: { x: child.x, y: child.y },
                size: { width: child.width, height: child.height },
            });

            ports.forEach(port => {
                const portToAdd = {
                    group: 'port',
                    args: { x: port.x, y: port.y },
                    id: port.id,
                    size: { height: port.height || 0, width: port.width || 0 }
                };
                shape.addPort(portToAdd);
                mapPortIdToShapeId[port.id] = shape.id;
            });

            shape.addTo(graph);

            if (parent) {
                parent.embed(shape);
                shape.position(child.x, child.y, { parentRelative: true });
            }

            if (children.length > 0) {
                addChildren(children, shape);
            }

            if (child.edges) {
                addEdges(child.edges, shape);
            }

            labels.forEach(label => {

                const labelElement = new Label({
                    simplifiedViewLabel: children.length === 0,
                    attrs: {
                        label: {
                            fontSize: label.height,
                            text: label.text,
                            ...getLabelPlacement(label)
                        }
                    }
                });

                if (children.length > 0) {
                    shape.attr('label', {
                        fontSize: shape.size().width / 5,
                        text: label.text,
                    });
                }

                labelElement.addTo(graph);
                shape.embed(labelElement);
                labelElement.position(label.x, label.y, { parentRelative: true });
            });
        });
    };

    const addEdges = (edges, parent) => {
        edges.forEach((link) => {
            const { bendPoints = [] } = link.sections[0];
            const junctionPoints = link.junctionPoints || [];

            if (parent) {
                bendPoints.map(bendPoint => {
                    const parentPosition = parent.position();
                    bendPoint.x += parentPosition.x;
                    bendPoint.y += parentPosition.y;
                });
            }

            junctionPoints.forEach(point => {
                const SIZE = 4;
                const position = {
                    x: point.x - SIZE / 2 + (parent ? parent.get('position').x : 0),
                    y: point.y - SIZE / 2 + (parent ? parent.get('position').y : 0)
                };
                const junctionPoint = new joint.shapes.standard.Circle({
                    size: { height: SIZE, width: SIZE },
                    attrs: {
                        body: {
                            fill: '#464454',
                            stroke: '#464454',
                        }
                    }
                });
                junctionPoint.addTo(graph);
                junctionPoint.position(position.x, position.y);
            });

            const sourcePortId = link.sources[0];
            const targetPortId = link.targets[0];
            const sourceElementId = mapPortIdToShapeId[sourcePortId];
            const targetElementId = mapPortIdToShapeId[targetPortId];

            const shape = new Edge({
                source: {
                    id: sourceElementId,
                    port: sourcePortId
                },
                target: {
                    id: targetElementId,
                    port: targetPortId,
                },
                vertices: bendPoints
            });

            shape.addTo(graph);
        });
    };

    elk.layout(elkGraph).then(res => {
        const children = res.children || [];
        const edges = res.edges || [];

        addChildren(children);
        addEdges(edges);

        paper.unfreeze();
        paper.fitToContent({ useModelGeometry: true, padding: 100, allowNewOrigin: 'any' });
    });

    canvas.appendChild(paper.el);

    addZoomListeners(paper);
};

const addZoomListeners = paper => {
    let zoomLevel = 1;

    const zoom = zoomLevel => {
        paper.scale(zoomLevel);
        paper.fitToContent({ useModelGeometry: true, padding: 100 * zoomLevel, allowNewOrigin: 'any' });
    };

    document.getElementById('zoom-in').addEventListener('click', () => {
        zoomLevel = Math.min(3, zoomLevel + 0.2);
        zoom(zoomLevel);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        zoomLevel = Math.max(0.2, zoomLevel - 0.2);
        zoom(zoomLevel);
    });
};

const placementsOptions = {
    H_RIGHT: 'H_RIGHT',
    H_LEFT: 'H_LEFT',
    H_CENTER: 'H_CENTER',
    V_TOP: 'V_TOP',
    V_BOTTOM: 'V_BOTTOM',
    V_CENTER: 'V_CENTER',
};

const getLabelPlacement = label => {
    const placement = {};

    const nodeLabelPlacements = label.layoutOptions['nodeLabels.placement'];
    if (nodeLabelPlacements.includes(placementsOptions.H_RIGHT)) {
        placement.textAnchor = 'end';
        placement.x = label.width;
    } else if (nodeLabelPlacements.includes(placementsOptions.H_LEFT)) {
        placement.textAnchor = 'start';
    } else if (nodeLabelPlacements.includes(placementsOptions.H_CENTER)) {
        placement.textAnchor = 'middle';
        placement.x = label.width / 2;
    }

    if (nodeLabelPlacements.includes(placementsOptions.V_TOP)) {
        placement.textVerticalAnchor = 'top';
    } else if (nodeLabelPlacements.includes(placementsOptions.V_BOTTOM)) {
        placement.textVerticalAnchor = 'bottom';
        placement.y = label.height;
    } else if (nodeLabelPlacements.includes(placementsOptions.V_CENTER)) {
        placement.textVerticalAnchor = 'middle';
        placement.y = label.height / 2;
    }

    return placement;
};
