import * as joint from '../../../build/joint';
import ELK from 'elkjs/lib/elk.bundled.js';
import { Custom, Label, Link } from "./shapes";
import { exampleGraph } from './exampleGraph';

export const init = () => {
    const canvas = document.getElementById('canvas');

    const graph = new joint.dia.Graph();

    const paper = new joint.dia.Paper({
        model: graph,
        width: 1000,
        height: 600,
        gridSize: 1,
        interactive: true,
        async: true,
        frozen: true,
        sorting: joint.dia.Paper.sorting.APPROX,
        background: { color: '#F3F7F6' }
    });

    const elk = new ELK();
    const mapPortIdToShapeId = {};

    const addChildren = (children, parent) => {
        children.forEach(child => {
            const shape = new Custom({
                id: child.id,
                position: { x: child.x, y: child.y },
                size: { width: child.width, height: child.height },
            });

            const ports = child.ports || [];
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

            if (child.children) {
                addChildren(child.children, shape);
            }

            if (child.edges) {
                addEdges(child.edges, shape);
            }

            const labels = child.labels || [];
            labels.forEach(label => {

                const labelElement = new Label({
                    attrs: {
                        label: {
                            fontSize: label.height,
                            text: label.text,
                            ...getLabelPlacement(label)
                        }
                    }
                });

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
                });
                junctionPoint.addTo(graph);
                junctionPoint.position(position.x, position.y);
            });

            const sourcePortId = link.sources[0];
            const targetPortId = link.targets[0];
            const sourceElementId = mapPortIdToShapeId[sourcePortId];
            const targetElementId = mapPortIdToShapeId[targetPortId];

            const shape = new Link({
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

    elk.layout(exampleGraph).then(res => {
        const children = res.children || [];
        const edges = res.edges || [];

        addChildren(children);
        addEdges(edges);

        if (paper.hasScheduledUpdates()) {
            paper.once('render:done', () => {
                paper.fitToContent({ padding: 50 });
            });
        }
    });

    canvas.appendChild(paper.el);
    paper.unfreeze();

    addZoomListeners(paper);
};

const addZoomListeners = paper => {
    let zoomLevel = 1;

    const zoom = zoomLevel => {
        const size = paper.getComputedSize();
        paper.translate(0, 0);
        paper.scale(zoomLevel, zoomLevel, size.width / 2, size.height / 2);
    }

    document.getElementById('zoom-in').addEventListener('click', () => {
        zoomLevel = Math.min(3, zoomLevel + 0.2);
        zoom(zoomLevel);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        zoomLevel = Math.max(0.2, zoomLevel - 0.2);
        zoom(zoomLevel);
    });
}

const placementsOptions = {
    H_RIGHT: 'H_RIGHT',
    H_LEFT: 'H_LEFT',
    H_CENTER: 'H_CENTER',
    V_TOP: 'V_TOP',
    V_BOTTOM: 'V_BOTTOM',
    V_CENTER: 'V_CENTER',
}

const getLabelPlacement = label => {
    const placement = {};

    const nodeLabelPlacements = label.layoutOptions['nodeLabels.placement'];
    if (~nodeLabelPlacements.indexOf(placementsOptions.H_RIGHT)) {
        placement.textAnchor = 'end';
        placement.refX2 = label.width;
    } else if (~nodeLabelPlacements.indexOf(placementsOptions.H_LEFT)) {
        placement.textAnchor = 'start';
    } else if (~nodeLabelPlacements.indexOf(placementsOptions.H_CENTER)) {
        placement.textAnchor = 'middle';
        placement.refX2 = label.width / 2;
    }

    if (~nodeLabelPlacements.indexOf(placementsOptions.V_TOP)) {
        placement.textVerticalAnchor = 'top';
    } else if (~nodeLabelPlacements.indexOf(placementsOptions.V_BOTTOM)) {
        placement.textVerticalAnchor = 'bottom';
        placement.refY2 = label.height;
    } else if (~nodeLabelPlacements.indexOf(placementsOptions.V_CENTER)) {
        placement.textVerticalAnchor = 'middle';
        placement.refY2 = label.height / 2;
    }

    return placement;
}
