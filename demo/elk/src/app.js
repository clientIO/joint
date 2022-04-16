import * as joint from 'jointjs';
import ELK from 'elkjs/lib/elk-api.js';
import elkWorker from 'elkjs/lib/elk-worker.js';
import { Child, Label, Edge } from './shapes';
import jointGraphJSON from '../jointGraph.json';

const readJointGraph = (jointJSON) => {
    const SIDES = {
        top: 'NORTH',
        right: 'EAST',
        bottom: 'SOUTH',
        left: 'WEST'
    };

    const getChildren = (children, start) => {
        const result = {
            children: [],
            edges: []
        };

        if (start) {
            result.id = 'root';
        }

        for (const child of children) {
            const bBox = child.getBBox();
            const portsPositons = { ...child.getPortsPositions('in'), ...child.getPortsPositions('out') };

            Object.keys(portsPositons).forEach((portId) => {
                portsPositons[portId].x += bBox.x;
                portsPositons[portId].y += bBox.y;
            });

            const connections = links.filter(link => link.target.id === child.id || link.source.id === child.id);

            let newElement = {
                id: child.id,
                width: child.get('size').width,
                height: child.get('size').height,
                ports: child.getPorts().map((port) => {
                    const { x, y } = portsPositons[port.id] ?? {};

                    return {
                        id: `${child.id}_${port.id}`,
                        width: 7,
                        height: 7,
                        layoutOptions: {
                            'port.side': SIDES[bBox.sideNearestToPoint({ x, y })],
                            'port.index': child.getPortIndex(port.id),
                        },
                    };
                }),
                'layoutOptions': {
                    portConstraints: 'FIXED_ORDER',
                    portAlignment: 'CENTER',
                },
            };

            if (connections.length) {
                result.edges.push(...connections.map(link => {
                    return {
                        id: link.id,
                        sources: [`${link.source.id}_${link.source.port}`],
                        targets: [`${link.target.id}_${link.target.port}`],
                    };
                }));
            }

            const embeddedCells = child.getEmbeddedCells();

            if (embeddedCells.length > 0) {
                const { children, edges } = getChildren(embeddedCells.filter((cell) => !cell.get('type').toLowerCase().includes('link')));
                newElement.children = children;
                newElement.edges = edges;
            }


            result.children.push(newElement);
        }

        return result;
    };

    const originalGraph = new joint.dia.Graph().fromJSON(jointJSON);

    let elements = originalGraph.getElements().filter((cell) => !cell.getAncestors().length && !cell.get('type').toLowerCase().includes('link'));
    let links = originalGraph.getElements().filter((cell) => cell.get('type').toLowerCase().includes('link')).map((link) => {
        return {
            id: link.id,
            source: link.get('source'),
            target: link.get('target'),
        };
    });

    return getChildren(elements, true);
};

export const runDemo = async () => {
    const canvas = document.getElementById('canvas');
    const graph = await init(jointGraphJSON);

    const paper = new joint.dia.Paper({
        model: graph,
        width: 1000,
        height: 600,
        gridSize: 1,
        interactive: false,
        async: true,
        frozen: true,
        sorting: joint.dia.Paper.sorting.APPROX,
        background: { color: '#F3F7F6' }
    });

    paper.unfreeze();
    paper.fitToContent({ useModelGeometry: true, padding: 100, allowNewOrigin: 'any' });

    canvas.appendChild(paper.el);
    addZoomListeners(paper);
};

export const init = async (jointGraphJSON) => {
    const graph = new joint.dia.Graph();

    const elk = new ELK({
        workerFactory: url => new elkWorker.Worker(url)
    });
    const mapPortIdToShapeId = {};

    const addChildren = (children, parent) => {
        children.forEach(child => {
            const shape = new Child({
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
        for (const link of edges) {
            if (!link.sections) continue;

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
        }
    };

    const res = await elk.layout(readJointGraph(jointGraphJSON)).catch(e => console.error(e));

    const children = res.children || [];
    const edges = res.edges || [];

    addChildren(children);
    addEdges(edges);

    return graph;
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
        placement.refX = label.width;
    } else if (nodeLabelPlacements.includes(placementsOptions.H_LEFT)) {
        placement.textAnchor = 'start';
    } else if (nodeLabelPlacements.includes(placementsOptions.H_CENTER)) {
        placement.textAnchor = 'middle';
        placement.refX = label.width / 2;
    }

    if (nodeLabelPlacements.includes(placementsOptions.V_TOP)) {
        placement.textVerticalAnchor = 'top';
    } else if (nodeLabelPlacements.includes(placementsOptions.V_BOTTOM)) {
        placement.textVerticalAnchor = 'bottom';
        placement.refY = label.height;
    } else if (nodeLabelPlacements.includes(placementsOptions.V_CENTER)) {
        placement.textVerticalAnchor = 'middle';
        placement.refY = label.height / 2;
    }

    return placement;
};

export default init;
