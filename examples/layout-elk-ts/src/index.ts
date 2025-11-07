import { dia, shapes, util, g } from '@joint/core';
import ELK from 'elkjs/lib/elk-api.js';
import type { ElkNode, ElkExtendedEdge, ElkLabel } from 'elkjs/lib/elk-api.d.ts';
import dependenciesJSON from './dependencies.json';
import './styles.scss';

type Require<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type ElkGraph = Require<ElkNode, 'children' | 'edges'>;

const colors = ['#F8FCDA', '#E3E9C2', '#F9FBB2', '#C89F9C'];
const ELK_DIRECTION = 'RIGHT';
const DEFAULT_LABEL_WIDTH = 50;
const DEFAULT_LABEL_HEIGHT = 20;

const init = () => {

    // Create JointJS graph and paper
    const graph = new dia.Graph({}, { cellNamespace: shapes });
    const paper = new dia.Paper({
        model: graph,
        cellViewNamespace: shapes,
        width: 1200,
        height: 800,
        gridSize: 1,
        interactive: false,
        async: true,
        frozen: true,
        defaultConnectionPoint: {
            name: 'anchor'
        },
        defaultConnector: {
            name: 'straight',
            args: {
                cornerType: 'cubic',
                cornerRadius: 5
            }
        }
    });
    document.getElementById('canvas')!.appendChild(paper.el);
    addZoomAndPanListeners(paper);

    // Generate JointJS cells from example data
    generateCells(dependenciesJSON, graph);

    // Perform ELK layout
    const elk = new ELK({
        workerUrl: '../node_modules/elkjs/lib/elk-worker.js',
    });
    elk.layout(getElkGraph(graph)).then((elkGraph) => {
        updateGraph(elkGraph as ElkGraph, graph);
        paper.unfreeze();
        zoom(paper, 1);
        window.scroll(640, 560);
    }).catch((error) => {
        console.error('ELK layout error:', error.message);
    });
};

function zoom(paper: dia.Paper, zoomLevel: number): void {
    paper.scale(zoomLevel);
    paper.fitToContent({
        useModelGeometry: true,
        padding: 100 * zoomLevel,
        allowNewOrigin: 'any'
    });
}

/**
 * Add toolbar zoom in/out listeners to the paper and setup panning.
 */
function addZoomAndPanListeners(paper: dia.Paper): void {

    let zoomLevel = paper.scale().sx;

    document.getElementById('zoom-in')!.addEventListener('click', () => {
        zoomLevel = Math.min(3, zoomLevel + 0.2);
        zoom(paper, zoomLevel);
    });

    document.getElementById('zoom-out')!.addEventListener('click', () => {
        zoomLevel = Math.max(0.2, zoomLevel - 0.2);
        zoom(paper, zoomLevel);
    });

    paper.on('blank:pointerdown', (evt) => {
        evt.data = {
            scrollX: window.scrollX,
            clientX: evt.clientX,
            scrollY: window.scrollY,
            clientY: evt.clientY
        };
    });

    paper.on('blank:pointermove', (evt) => {
        window.scroll(
            evt.data.scrollX + (evt.data.clientX - evt.clientX),
            evt.data.scrollY + (evt.data.clientY - evt.clientY)
        );
    });
}

/**
 * Create a rectangle element with given id.
 */
function createElement(id: dia.Cell.ID): dia.Element {
    return new shapes.standard.Rectangle({
        id: id,
        size: { width: 100, height: 40 },
        attrs: {
            body: {
                fill: colors[g.random(0, colors.length - 1)],
                stroke: '#333',
                strokeWidth: 2,
                rx: 5,
                ry: 5
            },
            label: {
                text: `${id}`,
                fill: '#333',
                fontSize: 14,
                fontFamily: 'Arial, helvetica, sans-serif'
            }
        }
    });
}

/**
 * Create a link between sourceId and targetId with a label.
 */
function createLink(sourceId: dia.Cell.ID, targetId: dia.Cell.ID): dia.Link {
    return new shapes.standard.Link({
        source: { id: sourceId },
        target: { id: targetId },
        labels: [{
            size: {
                width: DEFAULT_LABEL_WIDTH,
                height: DEFAULT_LABEL_HEIGHT
            },
            attrs: {
                text: {
                    text: `${sourceId} → ${targetId}`,
                    fontSize: 12,
                    fontFamily: 'Arial, helvetica, sans-serif',
                    fill: '#333'
                },
                rect: {
                    ref: null,
                    x: 'calc(x - calc(w / 2))',
                    y: 'calc(y - calc(h / 2))',
                    width: 'calc(w)',
                    height: 'calc(h)',
                    fill: '#FFB7C3',
                    strokeWidth: 1,
                    stroke: '#333'
                },
            },
            position: 0.5
        }]
    });
}

/**
 * Generate cells from simplified link data
 * [{ source: 'sourceId', target: 'targetId' }, ...]
 */
function generateCells(
    dependencies: Array<{ source: dia.Cell.ID, target: dia.Cell.ID }>,
    graph: dia.Graph
): void {
    const elementMap = new Map();
    const cells = [];
    dependencies.forEach((dep) => {
        // The ELK graph uses string IDs
        const sourceId = `${dep.source}`;
        const targetId = `${dep.target}`;
        // Create source and target elements if they do not exist yet
        let sourceRecord = elementMap.get(sourceId);
        if (!sourceRecord) {
            const sourceElement = createElement(sourceId);
            sourceRecord = [sourceElement, 1];
            cells.push(sourceElement);
            elementMap.set(sourceId, sourceRecord);
        } else {
            sourceRecord[1] += 1;
        }
        let targetRecord = elementMap.get(targetId);
        if (!targetRecord) {
            const targetElement = createElement(targetId);
            targetRecord = [targetElement, 1];
            cells.push(targetElement);
            elementMap.set(targetId, targetRecord);
        } else {
            targetRecord[1] += 1;
        }
        // Create the link between source and target
        cells.push(createLink(sourceId, targetId));
    });
    // Adjust element sizes based on the number of connected links
    // (If we are using vertical ELK direction, we expand horizontally)
    const dimension = ['DOWN', 'UP'].includes(ELK_DIRECTION) ? 'width' : 'height';
    elementMap.forEach(([element, count]) => {
        if (count <= 10) return;
        element.size({ [dimension]: count * 10 });
    });
    graph.resetCells(cells);
}

/**
 * Converts JointJS graph to ELK graph structure.
 * @param {dia.Graph} graph
 * @returns {Object} ELK graph structure
 */
function getElkGraph(graph: dia.Graph): ElkGraph {
    const elkGraph: ElkGraph = {
        id: 'root',
        layoutOptions: {
            /**
             * Layout algorithm to use.
             * 'box' | 'layered' | 'mrtree' | 'radial' | 'force'
             */
            'elk.algorithm': 'layered',

            /**
             * Overall direction of the layout.
             * 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
             */
            'elk.direction': ELK_DIRECTION,

            /**
             * Spacing between nodes (siblings).
             * A number value as a string.
             */
            'elk.spacing.nodeNode': '20',

            /**
             * Spacing between layers (for layered algorithm).
             * A number value as a string.
             */
            'elk.layered.spacing.nodeNodeBetweenLayers': '50',

            /**
             * Edge routing style.
             * 'ORTHOGONAL' | 'SPLINES' | 'POLYLINE'
             */
            'elk.edgeRouting': 'ORTHOGONAL',

            /**
             * Node placement strategy for layered layout.
             * 'SIMPLE' | 'BRANDES_KOEPF' | 'INTERACTIVE' | 'LINEAR_SEGMENTS' | 'NETWORK_SIMPLEX'
             */
            'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',

            /**
             * Merging edges that share the same source and target nodes into a single edge.
             * 'true' | 'false'
             */
            'elk.layered.mergeEdges': 'false',

            /**
             * Distance between edge labels and the edge itself.
             * A number value as a string.
             */
            'elk.spacing.edgeLabel': '3',

            // Does not seem to work as expected:
            // 'elk.layered.edgeLabels.centerLabelPlacementStrategy': 'HEAD_LAYER',
            // 'elk.edgeLabels.placement': 'TAIL'
        },
        children: [],
        edges: []
    };

    graph.getElements().forEach((element) => {
        const size = element.size();
        const elkNode: ElkNode = {
            id: `${element.id}`,
            width: size.width,
            height: size.height,
            ports: [],
            children: []
        };
        elkGraph.children.push(elkNode);
    });

    graph.getLinks().forEach((link) => {
        const sourceId = `${link.source().id}`;
        const targetId = `${link.target().id}`;
        if (!sourceId || !targetId) {
            return; // Skip if source or target is not defined
        }
        elkGraph.edges.push({
            id: `${link.id}`,
            sources: [sourceId],
            targets: [targetId],
            labels: link.labels().map((label) => ({
                text: '-', // some text is required (ELK ignores empty labels)
                width: label.size?.width || DEFAULT_LABEL_WIDTH,
                height: label.size?.height || DEFAULT_LABEL_HEIGHT,
                layoutOptions: {
                    // This works, but does not allocate space for the label
                    // 'edgeLabels.placement': 'HEAD' // 'CENTER' | 'HEAD' | 'TAIL'
                }
            }))
        });
    });

    return elkGraph;
}

/**
 * Update JointJS graph based on ELK layout result.
 */
function updateGraph(elkGraph: ElkGraph, graph: dia.Graph): void {
    updateElements(elkGraph.children, graph);
    updateLinks(elkGraph.edges, graph);
}

/**
 * Update JointJS elements based on ELK node layout.
 */
function updateElements(nodes: ElkNode[], graph: dia.Graph): void {
    for (const node of nodes) {
        const el = graph.getCell(node.id) as dia.Element;
        el.position(node.x, node.y);
    }
}

/**
 * Update JointJS links based on ELK edge layout.
 */
function updateLinks(edges: ElkExtendedEdge[], graph: dia.Graph): void {
    for (const edge of edges) {
        const { sections, labels: edgeLabels } = edge;
        if (!sections) continue;
        const linkAttributes: dia.Link.Attributes = {};
        const [{ bendPoints = [], endPoint, startPoint }] = sections;
        // Update link vertices (bend points)
        linkAttributes.vertices = bendPoints;
        // Update link source and target anchors (startPoint, endPoint)
        const link = graph.getCell(edge.id) as dia.Link;
        linkAttributes.source = getLinkEnd(link.getSourceElement(), startPoint);
        linkAttributes.target = getLinkEnd(link.getTargetElement(), endPoint);
        // Update link labels positions
        if (edgeLabels) {
            const polyline = new g.Polyline([startPoint, ...bendPoints, endPoint]);
            linkAttributes.labels = getLinkLabels(link, edgeLabels, polyline);
        }
        // Apply the updated attributes to the link
        link.set(linkAttributes);
    }
}

/**
 * Convert absolute label position to relative position on the link polyline.
 */
function getLinkLabelPosition(
    polyline: g.Polyline,
    edgeLabel: ElkLabel
): dia.Link.LabelPosition {
    const labelPosition = {
        x: edgeLabel.x + edgeLabel.width / 2,
        y: edgeLabel.y + edgeLabel.height / 2
    };
    const length = polyline.closestPointLength(labelPosition);
    const closestPoint = polyline.pointAtLength(length);
    const distance = (length / polyline.length());
    const offset = new g.Point(labelPosition).difference(closestPoint).toJSON();
    return {
        distance: distance,
        offset: offset
    };
}

/**
 * Get link end definition for given element and absolute end point.
 */
function getLinkEnd(
    endElement: dia.Element,
    endPoint: dia.Point
): dia.Link.EndJSON {
    const delta = endElement.getRelativePointFromAbsolute(endPoint);
    return {
        id: endElement.id,
        anchor: {
            name: 'topLeft',
            args: {
                dx: delta.x,
                dy: delta.y,
                useModelGeometry: true
            }
        }
    };
}

function getLinkLabels(
    link: dia.Link,
    edgeLabels: ElkLabel[],
    polyline: g.Polyline
): dia.Link.Label[] {
    const labels = util.cloneDeep(link.labels());
    edgeLabels.forEach((edgeLabel, index) => {
        // Note: If the diagram is meant to stay static,
        // we could also create JointJS elements instead of using link labels.
        labels[index].position = getLinkLabelPosition(polyline, edgeLabel);
    });
    return labels;
}

init();
