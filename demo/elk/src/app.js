import * as joint from 'jointjs';
import ELK from 'elkjs/lib/elk-api.js';
import elkWorker from 'elkjs/lib/elk-worker.js';
import jointGraphJSON from '../jointGraph.json';

const readJointGraph = (graph) => {
    const SPACE_BETWEEN_LAYERS = 40;

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
            result.layoutOptions = {
                'spacing.nodeNodeBetweenLayers': SPACE_BETWEEN_LAYERS,
            };
        }

        for (const child of children) {
            const bBox = child.getBBox();
            const portsPositions = { ...child.getPortsPositions('in'), ...child.getPortsPositions('out') };

            Object.keys(portsPositions).forEach((portId) => {
                portsPositions[portId].x += bBox.x;
                portsPositions[portId].y += bBox.y;
            });

            const connections = links.filter(link => link.target.id === child.id || link.source.id === child.id);

            let newElement = {
                id: child.id,
                width: child.get('size').width,
                height: child.get('size').height,
                ports: child.getPorts().map((port) => {
                    const { x, y } = portsPositions[port.id] ?? {};

                    return {
                        id: `${child.id}_${port.id}`,
                        width: 10,
                        height: 10,
                        layoutOptions: {
                            'port.side': SIDES[bBox.sideNearestToPoint({ x, y })],
                            'port.index': child.getPortIndex(port.id),
                        }
                    };
                }),
                'layoutOptions': {
                    portConstraints: 'FIXED_ORDER',
                    portAlignment: 'CENTER',
                    'spacing.portPort': 20,
                    'spacing.nodeNodeBetweenLayers': SPACE_BETWEEN_LAYERS,
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
                const { children, edges } = getChildren(embeddedCells.filter((cell) => cell.isElement()));
                newElement.children = children;
                newElement.edges = edges;
            }

            result.children.push(newElement);
        }

        return result;
    };

    let elements = graph.getElements().filter((cell) => !cell.getAncestors().length);
    let links = graph.getLinks().map((link) => {
        return {
            id: link.id,
            source: link.get('source'),
            target: link.get('target'),
        };
    });

    return getChildren(elements, true);
};

export const runDemo = async() => {
    const canvas = document.getElementById('canvas');
    const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes }).fromJSON(jointGraphJSON);

    await elkLayout(graph);

    const paper = new joint.dia.Paper({
        model: graph,
        cellViewNamespace: joint.shapes,
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

export const elkLayout = async(graph) => {
    const elk = new ELK({
        workerFactory: url => new elkWorker.Worker(url)
    });

    const addChildren = (children, parent) => {
        children.forEach((child) => {
            const element = graph.getElements().find(el => el.id === child.id);

            element.position(child.x, child.y, { parentRelative: true });
            element.resize(child.width, child.height);

            child.ports.forEach((port) => {
                const { x, y } = port;
                const [, portId] = port.id.split('_');

                element.portProp(portId, 'args', { x: x + port.height / 2, y: y + port.width / 2 });
            });

            if (child.children) {
                addChildren(child.children, element);
            }

            if (child.edges) {
                addEdges(child.edges, element);
            }
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

            graph.getLinks().find(jointLink => jointLink.id === link.id)?.vertices(bendPoints);
        }
    };

    const res = await elk.layout(readJointGraph(graph));

    const children = res.children || [];
    const edges = res.edges || [];

    addChildren(children);
    addEdges(edges);
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

export default elkLayout;
