import { type dia, g, util } from '@joint/core';
import ElkConstructor from 'elkjs/lib/elk.bundled.js';
import {
    type ELK,
    type ElkNode,
    type ElkExtendedEdge,
    type ElkLabel,
    type ElkLayoutOptions,
    type Options,
    type LayoutResult
} from './types.mjs';
import { DEFAULT_LAYOUT_OPTIONS, DEFAULT_LABEL_SIZE, defaultOptions, setVertices, setAnchor, setLabels } from './defaults.mjs';

const LAYOUT_BATCH_NAME = 'layout';
// ELK ignores labels with no text.
const ELK_LABEL_TEXT = '-';
const ELK_INLINE_LABEL_OPTIONS = { 'edgeLabels.inline': 'true' };

let defaultElk: ELK | undefined;

function getDefaultElk(): ELK {
    if (!defaultElk) {
        defaultElk = new ElkConstructor();
    }
    return defaultElk;
}

interface ElkGraphData {
    elkGraph: ElkNode;
    elementsById: Map<string, dia.Element>;
    linksById: Map<string, dia.Link>;
}

export async function layout(graph: dia.Graph, opt?: Options): Promise<LayoutResult> {

    const options = util.defaults({}, opt || {}, defaultOptions) as Required<Omit<Options, 'elk' | 'layoutOptions'>>;
    const layoutOptions = util.defaults({}, opt?.layoutOptions || {}, DEFAULT_LAYOUT_OPTIONS) as ElkLayoutOptions;
    const elk = opt?.elk || getDefaultElk();

    const { elkGraph, elementsById, linksById } = toElkGraph(graph, options, layoutOptions);

    const result = await elk.layout(elkGraph) as ElkNode;

    graph.startBatch(LAYOUT_BATCH_NAME);
    applyElkLayout(result, elementsById, linksById, options);
    graph.stopBatch(LAYOUT_BATCH_NAME);

    return {
        bbox: getBBox(result),
        elkGraph: result
    };
}

/**
 * Converts a flat JointJS graph (top-level elements only - embedded elements,
 * clusters and ports are not supported yet) to an ELK graph structure.
 */
function toElkGraph(
    graph: dia.Graph,
    options: Required<Omit<Options, 'elk' | 'layoutOptions'>>,
    layoutOptions: ElkLayoutOptions
): ElkGraphData {

    const elementsById = new Map<string, dia.Element>();
    const linksById = new Map<string, dia.Link>();

    const children: ElkNode[] = graph.getElements()
        .filter((element) => !element.parent())
        .map((element) => {
            const id = `${element.id}`;
            elementsById.set(id, element);

            const { width, height } = options.getSize(element);
            return {
                id,
                width,
                height,
                layoutOptions: options.nodeOptions(element)
            };
        });

    const edges: ElkExtendedEdge[] = [];

    graph.getLinks().forEach((link) => {
        const sourceElement = link.getSourceElement();
        const targetElement = link.getTargetElement();
        // Links not connected to two elements (e.g. connected to a point or
        // to another link) are not part of the layout.
        if (!sourceElement || !targetElement) return;
        if (!elementsById.has(`${sourceElement.id}`) || !elementsById.has(`${targetElement.id}`)) return;

        const id = `${link.id}`;
        linksById.set(id, link);

        const edge: ElkExtendedEdge = {
            id,
            sources: [`${sourceElement.id}`],
            targets: [`${targetElement.id}`],
            layoutOptions: options.edgeOptions(link)
        };

        if (options.edgeLabels) {
            const labels = link.labels();
            if (labels.length > 0) {
                edge.labels = labels.map((label): ElkLabel => {
                    const { width, height } = label.size || DEFAULT_LABEL_SIZE;
                    return {
                        // Some text is required, otherwise ELK ignores the label.
                        text: ELK_LABEL_TEXT,
                        width,
                        height,
                        // Place the label directly on the edge (and allocate space for it).
                        layoutOptions: ELK_INLINE_LABEL_OPTIONS
                    };
                });
            }
        }

        edges.push(edge);
    });

    const elkGraph: ElkNode = {
        id: 'root',
        layoutOptions,
        children,
        edges
    };

    return { elkGraph, elementsById, linksById };
}

/**
 * Applies an ELK layout result back onto the JointJS graph.
 */
function applyElkLayout(
    elkGraph: ElkNode,
    elementsById: Map<string, dia.Element>,
    linksById: Map<string, dia.Link>,
    options: Required<Omit<Options, 'elk' | 'layoutOptions'>>
): void {

    (elkGraph.children || []).forEach((node) => {
        const element = elementsById.get(node.id);
        if (!element) return;

        options.setPosition(element, { x: node.x || 0, y: node.y || 0 });
    });

    (elkGraph.edges || []).forEach((edge) => {
        const link = linksById.get(edge.id);
        if (!link) return;

        const [section] = edge.sections || [];
        if (!section) return;

        const { startPoint, endPoint, bendPoints = [] } = section;

        if (options.setVertices) {
            if (util.isFunction(options.setVertices)) {
                (options.setVertices as unknown as typeof setVertices)(link, bendPoints);
            } else {
                setVertices(link, bendPoints);
            }
        }

        if (options.setAnchor) {
            const sourceElement = link.getSourceElement();
            const targetElement = link.getTargetElement();
            if (util.isFunction(options.setAnchor)) {
                const setAnchorFn = options.setAnchor as unknown as typeof setAnchor;
                if (sourceElement) setAnchorFn(link, sourceElement, startPoint, 'source');
                if (targetElement) setAnchorFn(link, targetElement, endPoint, 'target');
            } else {
                if (sourceElement) setAnchor(link, sourceElement, startPoint, 'source');
                if (targetElement) setAnchor(link, targetElement, endPoint, 'target');
            }
        }

        if (options.edgeLabels && options.setLabels && edge.labels && edge.labels.length > 0) {
            const points = [startPoint, ...bendPoints, endPoint];
            const setLabelsFn = util.isFunction(options.setLabels)
                ? options.setLabels as unknown as typeof setLabels
                : setLabels;
            edge.labels.forEach((label, labelIndex) => {
                const { x = 0, y = 0, width = 0, height = 0 } = label;
                setLabelsFn(link, { x, y, width, height }, points, labelIndex);
            });
        }
    });
}

/**
 * Tight bounding box of the top-level nodes in an ELK layout result.
 */
function getBBox(elkGraph: ElkNode): g.Rect {
    const rects = (elkGraph.children || []).map((node) => new g.Rect(node.x || 0, node.y || 0, node.width || 0, node.height || 0));
    return g.Rect.fromRectUnion(...rects) || new g.Rect(0, 0, 0, 0);
}
