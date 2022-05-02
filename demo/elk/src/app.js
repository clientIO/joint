import * as joint from 'jointjs';
import ELK from 'elkjs/lib/elk-api.js';
import elkWorker from 'elkjs/lib/elk-worker.js';
import jointGraphJSON from '../jointGraph.json';

const readJointGraph = (graph, opt) => {
    const SPACE = 60;
    const SPACE_BETWEEN_EDGE_NODE = 20;
    const PORT_SPACE = 20;

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
                algorithm: 'layered',
                'hierarchyHandling': 'INCLUDE_CHILDREN',
                'layered.spacing.baseValue': SPACE
            };
        }

        for (const child of children) {
            const bBox = child.getBBox();
            const portsPositions = { ...child.getPortsPositions('in'), ...child.getPortsPositions('out') };

            Object.keys(portsPositions).forEach((portId) => {
                portsPositions[portId].x += bBox.x;
                portsPositions[portId].y += bBox.y;
            });

            const connections = graph.getConnectedLinks(child, { outbound: true });
            const label = child.get('attrs').label;

            const embeddedCells = child.getEmbeddedCells();

            // TODO get port size, custom label position
            let newElement = {
                id: child.id,
                width: child.get('size').width,
                height: child.get('size').height,
                ports: child.getPorts().map((port) => {
                    const { x, y } = portsPositions[port.id] ?? {};
                    const groupNames = Object.keys(child.prop('ports/groups'));
                    
                    const mappedPorts = groupNames.reduce((acc, groupName) => ({ ...acc, ...child.getPortsPositions(groupName) }), {});
                    const { x: relativeX, y: relativeY } = mappedPorts[port.id];

                    return {
                        id: `${child.id}${opt.idSplitChar}${port.id}`,
                        x: relativeX,
                        y: relativeY,
                        width: 10,
                        height: 10,
                        layoutOptions: {
                            'port.side': SIDES[bBox.sideNearestToPoint({ x, y })],
                            'port.index': child.getPortIndex(port.id),
                            'port.borderOffset': -5,
                        }
                    };
                }),
                labels: [
                    {
                        text: label.text,
                        layoutOptions: {
                            'nodeLabels.placement': '[H_LEFT, V_TOP, OUTSIDE]',
                            'font.size': label.fontSize,
                        },
                    }
                ],
                'layoutOptions': {
                    portConstraints: 'FIXED_ORDER',
                    portAlignment: 'CENTER',
                    'spacing.portPort': PORT_SPACE,
                    'spacing.nodeNodeBetweenLayers': SPACE,
                    'spacing.edgeNode': SPACE_BETWEEN_EDGE_NODE,
                    'layered.spacing.baseValue': SPACE,
                    'spacing.labelNode': 15,
                },
            };

            if (connections.length) {
                result.edges.push(...connections.map(link => {
                    return {
                        id: link.id,
                        sources: [link.source().port ? `${link.source().id}${opt.idSplitChar}${link.source().port}` : link.source().id],
                        targets: [link.target().port ? `${link.target().id}${opt.idSplitChar}${link.target().port}` : link.target().id],
                    };
                }));
            }

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
        background: { color: '#F3F7F6' },
    });

    paper.unfreeze();
    paper.fitToContent({ useModelGeometry: true, padding: 100, allowNewOrigin: 'any' });

    canvas.appendChild(paper.el);
    addZoomListeners(paper);

    const textArea = document.querySelector('#textarea');
    textArea.addEventListener('keydown', async(event) => {
        if (event.key !== 'Enter' || textArea.value.trim() === '') return;
        event.preventDefault();

        paper.freeze();
        graph.fromJSON(JSON.parse(textArea.value));
        await elkLayout(graph);
        paper.unfreeze();
        paper.fitToContent({ useModelGeometry: true, padding: 100, allowNewOrigin: 'any' });
    });
};

export const elkLayout = async(graph, opt = { idSplitChar: '_' }) => {
    const elk = new ELK({
        workerFactory: url => new elkWorker.Worker(url)
    });

    const addChildren = (children, parent) => {
        children.forEach((child) => {
            const element = graph.getElements().find(el => el.id === child.id);

            element.position(child.x, child.y, { parentRelative: true });
            element.resize(child.width, child.height);

            if (Array.isArray(child.labels)) {
                element.attr({
                    label: {
                        ...element.get('attrs').label,
                        ...getLabelPlacement(child.labels[0])
                    }
                });
            }

            child.ports.forEach((port) => {
                const { x, y } = port;
                const [, portId] = port.id.split(opt.idSplitChar);

                element.portProp(portId, 'args', { x: x + port.width / 2, y: y + port.height / 2 });
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
        for (const edge of edges) {
            if (!edge.sections) continue;

            const { bendPoints = [] } = edge.sections[0];
            const junctionPoints = edge.junctionPoints || [];

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

            const link = graph.getCell(edge.id);

            link?.vertices(bendPoints);

            if (!link.get('source').port) {
                const sourceEl = link.getSourceElement();

                const relativeY = sourceEl.get('attrs').label.refY < 0 ? Math.abs(sourceEl.get('attrs').label.refY) : 0;

                link.source(sourceEl, {
                    anchor: {
                        name: 'topRight',
                        args: {
                            dy: edge.sections[0].startPoint.y - (sourceEl.position().y - (parent?.position().y ?? 0)) + relativeY
                        }
                    }
                });
            }

            if (!link.get('target').port) {
                const targetEl = link.getTargetElement();

                const relativeY = targetEl.get('attrs').label.refY < 0 ? Math.abs(targetEl.get('attrs').label.refY) : 0;

                link.target(targetEl, {
                    anchor: {
                        name: 'topLeft',
                        args: {
                            dy: edge.sections[0].endPoint.y - (targetEl.position().y - (parent?.position().y ?? 0)) + relativeY
                        }
                    }
                });
            }
        }
    };

    const res = await elk.layout(readJointGraph(graph, opt));

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
    const placement = {
        refX: label.x,
        refY: label.y
    };

    const nodeLabelPlacements = label.layoutOptions['nodeLabels.placement'];
    if (nodeLabelPlacements.includes(placementsOptions.H_RIGHT)) {
        placement.textAnchor = 'right';
    } else if (nodeLabelPlacements.includes(placementsOptions.H_LEFT)) {
        placement.textAnchor = 'left';
    }

    if (nodeLabelPlacements.includes(placementsOptions.V_TOP)) {
        placement.textVerticalAnchor = 'top';
    } else if (nodeLabelPlacements.includes(placementsOptions.V_BOTTOM)) {
        placement.textVerticalAnchor = 'bottom';
    } else if (nodeLabelPlacements.includes(placementsOptions.V_CENTER)) {
        placement.textVerticalAnchor = 'middle';
    }

    return placement;
};

export default elkLayout;
