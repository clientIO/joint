import { dia, shapes, util, g } from '@joint/core';
import { layout, LayerDirectionEnum, EdgeRoutingMode, Options } from '@joint/layout-msagl';
import { createGraph, defaultGraphType, graphTitles } from './graph/presets';
import type { GraphMeta, GraphType } from './graph/types';
import '../css/styles.css';

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.getElementById('paper'),
    width: '100%',
    height: '100%',
    interactive: false,
    async: true,
    frozen: true,
    labelsLayer: true
});

const layerSeparationInput = document.getElementById('layer-separation') as HTMLInputElement;
const nodeSeparationInput = document.getElementById('node-separation') as HTMLInputElement;
const marginInput = document.getElementById('margin') as HTMLInputElement;
const directionSelect = document.getElementById('layout-direction') as HTMLSelectElement;
const routingSelect = document.getElementById('edge-routing') as HTMLSelectElement;
const graphTypeSelect = document.getElementById('graph-type') as HTMLSelectElement;
const useVerticesCheckbox = document.getElementById('use-vertices') as HTMLInputElement;

const layerSeparationDisplay = document.getElementById('layer-separation-value');
const nodeSeparationDisplay = document.getElementById('node-separation-value');
const marginDisplay = document.getElementById('margin-value');

const titleEl = document.getElementById('graph-title');
const descriptionEl = document.getElementById('graph-description');
const layoutSummaryEl = document.getElementById('layout-summary');

const directionLabels: Record<number, string> = {
    [LayerDirectionEnum.TB]: 'Top → Bottom',
    [LayerDirectionEnum.LR]: 'Left → Right',
    [LayerDirectionEnum.BT]: 'Bottom → Top',
    [LayerDirectionEnum.RL]: 'Right → Left'
};

const routingLabels: Record<number, string> = {
    [EdgeRoutingMode.Rectilinear]: 'Rectilinear',
    [EdgeRoutingMode.SplineBundling]: 'Spline Bundling'
};

const updateRangeDisplay = (input: HTMLInputElement, display: HTMLElement | null, value?: number) => {
    if (typeof value === 'number') {
        input.value = String(value);
    }
    if (display) {
        display.textContent = input.value;
    }
};

const applyGraphMeta = (meta: GraphMeta) => {
    const { layout: layoutPreset } = meta;

    directionSelect.value = String(layoutPreset.layerDirection);
    routingSelect.value = String(layoutPreset.edgeRoutingMode);
    updateRangeDisplay(layerSeparationInput, layerSeparationDisplay, layoutPreset.layerSeparation);
    updateRangeDisplay(nodeSeparationInput, nodeSeparationDisplay, layoutPreset.nodeSeparation);
    updateRangeDisplay(marginInput, marginDisplay, layoutPreset.margin);
    useVerticesCheckbox.checked = layoutPreset.useVertices;

    updateGraphInfo(meta);
};

const updateGraphInfo = (meta: GraphMeta) => {
    if (titleEl) {
        titleEl.textContent = meta.title;
    }
    if (descriptionEl) {
        descriptionEl.textContent = meta.description;
    }
};

const formatDirection = (direction: LayerDirectionEnum) => {
    return directionLabels[direction] ?? 'Custom direction';
};

const formatRouting = (mode: EdgeRoutingMode) => {
    return routingLabels[mode] ?? 'Custom routing';
};

const updateLayoutSummary = (options: Options) => {
    if (!layoutSummaryEl) {
        return;
    }

    const direction = formatDirection(options.layerDirection as LayerDirectionEnum);
    const routing = formatRouting(options.edgeRoutingMode as EdgeRoutingMode);
    const nodeSpacing = Math.round(options.nodeSeparation ?? 0);

    layoutSummaryEl.textContent = `${direction} layering · ${routing} routing · ${nodeSpacing}px node spacing`;
};

const setupControlListeners = () => {
    layerSeparationInput.addEventListener('input', () => {
        updateRangeDisplay(layerSeparationInput, layerSeparationDisplay);
        runLayout();
    });

    nodeSeparationInput.addEventListener('input', () => {
        updateRangeDisplay(nodeSeparationInput, nodeSeparationDisplay);
        runLayout();
    });

    marginInput.addEventListener('input', () => {
        updateRangeDisplay(marginInput, marginDisplay);
        runLayout();
    });

    [directionSelect, routingSelect, useVerticesCheckbox].forEach((control) => {
        control.addEventListener('change', runLayout);
    });

    Array.from(graphTypeSelect.options).forEach((option) => {
        const id = option.value as GraphType;
        if (graphTitles[id]) {
            option.textContent = graphTitles[id];
        }
    });

    graphTypeSelect.addEventListener('change', () => {
        const meta = createGraph(graph, graphTypeSelect.value);
        applyGraphMeta(meta);
        runLayout();
    });
};

const getLayoutOptions = (): Options => {
    const verticesSetter = (link: dia.Link, vertices: dia.Point[]) => {
        link.transition('vertices', vertices, {
            duration: 500,
            timingFunction: util.timing.cubic,
            rewrite: true,
            valueFunction: (start: dia.Point[], end: dia.Point[]) => {
                let from = start ?? [];
                const to = end ?? [];

                if (from.length < to.length) {
                    const midpoint = (link.findView(paper) as dia.LinkView).getPointAtRatio(0.5);
                    from.push(...Array.from({ length: to.length - from.length }, () => midpoint));
                } else if (from.length > to.length) {
                    from = Array.from({ length: to.length }, (_, i) => from[i]);
                }

                return (t: number) => {
                    return from.map((point, index) => {
                        return {
                            x: point.x + (to[index].x - point.x) * t,
                            y: point.y + (to[index].y - point.y) * t
                        };
                    });
                };
            }
        });
    };

    const margin = Number(marginInput.value);

    return {
        layerDirection: Number(directionSelect.value) as LayerDirectionEnum,
        edgeRoutingMode: Number(routingSelect.value) as EdgeRoutingMode,
        layerSeparation: Number(layerSeparationInput.value),
        nodeSeparation: Number(nodeSeparationInput.value),
        polylinePadding: 12,
        gridSize: 0,
        margins: {
            left: margin,
            right: margin,
            top: margin,
            bottom: margin
        },
        setPosition: (element: dia.Element, position: dia.Point) => {
            element.transition('position', position, {
                duration: 500,
                timingFunction: util.timing.cubic,
                valueFunction: util.interpolate.object
            });
        },
        setVertices: useVerticesCheckbox.checked ? verticesSetter : false,
        setAnchor: (link, referencePoint, bbox, endType) => {
            const anchorArgs = {
                dx: referencePoint.x - bbox.x - bbox.width / 2,
                dy: referencePoint.y - bbox.y - bbox.height / 2
            };

            if (!link.prop(`${endType}/anchor`)) {
                link.prop(`${endType}/anchor`, { name: 'modelCenter', args: anchorArgs });
                return;
            }

            link.transition(
                `${endType}/anchor/args`,
                anchorArgs,
                {
                    duration: 500,
                    timingFunction: util.timing.cubic,
                    valueFunction: util.interpolate.object
                }
            );
        },
        setLabels: (link, labelPosition, points) => {
            const polyline = new g.Polyline(points);
            const linkSize = link.get('labelSize') as { width: number; height: number };
            const cx = labelPosition.x + linkSize.width / 2;
            const cy = labelPosition.y + linkSize.height / 2;
            const center = new g.Point(cx, cy);
            const distance = polyline.closestPointLength(center);
            const tangent = polyline.tangentAtLength(distance);

            link.transition(
                'labels/0/position',
                {
                    distance,
                    offset: tangent?.pointOffset(center) || 0
                },
                {
                    duration: 500,
                    timingFunction: util.timing.cubic,
                    valueFunction: util.interpolate.object
                }
            );
        }
    };
};

const runLayout = () => {
    paper.freeze();
    const options = getLayoutOptions();

    if (!options.setVertices) {
        graph.getLinks().forEach((link) => link.vertices([]));
    }

    layout(graph, options);
    paper.unfreeze({
        afterRender: () => {
            paper.transformToFitContent({
                padding: 40,
                horizontalAlign: 'middle',
                verticalAlign: 'middle',
                useModelGeometry: true
            });
        }
    });
    updateLayoutSummary(options);
};

const initDemo = () => {
    setupControlListeners();

    const initialType = (graphTypeSelect.value || defaultGraphType) as GraphType;
    graphTypeSelect.value = initialType;

    const meta = createGraph(graph, initialType);
    applyGraphMeta(meta);
    runLayout();
};

initDemo();
