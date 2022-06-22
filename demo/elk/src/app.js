import * as joint from 'jointjs';
import ELK from 'elkjs/lib/elk-api.js';
import elkWorker from 'elkjs/lib/elk-worker.js';
import jointGraphJSON from '../jointGraph.json';
import { appendElementLabel, getLinkLabels, appendPorts } from './helpers';

const readJointGraph = (graph, opt) => {
    const SPACE = 60;
    const SPACE_BETWEEN_EDGE_NODE = 20;
    const PORT_SPACE = 20;

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
                'layered.spacing.baseValue': SPACE,
                'spacing.labelNode': 0,
            };
        }

        for (const child of children) {
            let newElement = {
                id: child.id,
                width: child.get('size').width,
                height: child.get('size').height,
                'layoutOptions': {
                    portConstraints: 'FIXED_ORDER',
                    portAlignment: 'CENTER',
                    'spacing.portPort': PORT_SPACE,
                    'spacing.nodeNodeBetweenLayers': SPACE,
                    'spacing.edgeNode': SPACE_BETWEEN_EDGE_NODE,
                    'layered.spacing.baseValue': SPACE,
                    'spacing.labelNode': 0,
                },
            };

            const label = child.get('attrs').label;
            if (label) appendElementLabel(newElement, label);

            appendPorts(newElement, child, opt.idSplitChar);

            const connections = graph.getConnectedLinks(child, { outbound: true });

            if (connections.length) {
                result.edges.push(...connections.map(link => ({
                    id: link.id,
                    sources: [link.source().port ? `${link.source().id}${opt.idSplitChar}${link.source().port}` : link.source().id],
                    targets: [link.target().port ? `${link.target().id}${opt.idSplitChar}${link.target().port}` : link.target().id],
                    labels: getLinkLabels(link.get('labels') ?? []),
                })));
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

            child.ports?.forEach((port) => {
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

    const getRelativeY = (label) => {
        return label && label.refY < 0 ? Math.abs(label.refY) + 1 : 0;
    };

    const addEdges = (edges, parent) => {
        for (const edge of edges) {
            if (!edge.sections) continue;

            const { bendPoints = [] } = edge.sections[0];

            bendPoints.map(bendPoint => {
                const parentPosition = parent?.position() ?? { x: 0, y: 0 };
                bendPoint.x += parentPosition.x;
                bendPoint.y += parentPosition.y;
            });

            const link = graph.getCell(edge.id);

            link?.vertices(bendPoints);

            if (!link.get('source').port) {
                const sourceEl = link.getSourceElement();
                const label = sourceEl.get('attrs').label;

                const relativeY = getRelativeY(label);

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
                const label = targetEl.get('attrs').label;

                const relativeY = getRelativeY(label);

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
    } else if (nodeLabelPlacements.includes(placementsOptions.H_CENTER)) {
        placement.textAnchor = 'middle';
        placement.refX = '50%';
    }

    if (nodeLabelPlacements.includes(placementsOptions.V_TOP)) {
        placement.textVerticalAnchor = 'top';
    } else if (nodeLabelPlacements.includes(placementsOptions.V_BOTTOM)) {
        placement.textVerticalAnchor = 'bottom';
        placement.refY += label.height;
    } else if (nodeLabelPlacements.includes(placementsOptions.V_CENTER)) {
        placement.textVerticalAnchor = 'middle';
        placement.refY = '50%';
    }

    return placement;
};

export default elkLayout;
