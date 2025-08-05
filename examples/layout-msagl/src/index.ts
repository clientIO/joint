import { dia, shapes, util, g } from '@joint/core';
import { layout, LayerDirectionEnum, EdgeRoutingMode, Options } from '@joint/layout-msagl';
import { createGraph } from './utils';
import '../css/styles.css';

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.getElementById('paper'),
    width: '100%',
    height: '100%',
    gridSize: 10,
    interactive: false,
    async: true,
    frozen: true
});

// Setup UI controls event listeners
const setupControlListeners = () => {
    // Get range input elements
    const layerSepRange = document.getElementById('layer-separation') as HTMLInputElement;
    const nodeSepRange = document.getElementById('node-separation') as HTMLInputElement;
    const marginRange = document.getElementById('margin') as HTMLInputElement;

    // Setup value display updates for range inputs
    const layerSepValue = document.getElementById('layer-separation-value');
    layerSepRange.addEventListener('input', () => {
        if (layerSepValue) layerSepValue.textContent = layerSepRange.value;
        runLayout();
    });

    const nodeSepValue = document.getElementById('node-separation-value');
    nodeSepRange.addEventListener('input', () => {
        if (nodeSepValue) nodeSepValue.textContent = nodeSepRange.value;
        runLayout();
    });

    const marginValue = document.getElementById('margin-value');
    marginRange.addEventListener('input', () => {
        if (marginValue) marginValue.textContent = marginRange.value;
        runLayout();
    });

    // Get select controls
    const directionSelect = document.getElementById('layout-direction') as HTMLSelectElement;
    const routingSelect = document.getElementById('edge-routing') as HTMLSelectElement;
    const graphTypeSelect = document.getElementById('graph-type') as HTMLSelectElement;
    const useVerticesCheckbox = document.getElementById('use-vertices') as HTMLInputElement;

    // Add event listeners to direction, routing, and vertices controls for layout update
    [directionSelect, routingSelect, useVerticesCheckbox].forEach(control => {
        control.addEventListener('change', runLayout);
    });

    
    graphTypeSelect.addEventListener('change', () => {
        createGraph(graph, graphTypeSelect.value);
        runLayout();
    });
};

// Get layout options from UI controls
const getLayoutOptions = (): Options => {
    const directionSelect = document.getElementById('layout-direction') as HTMLSelectElement;
    const routingSelect = document.getElementById('edge-routing') as HTMLSelectElement;
    const layerSepRange = document.getElementById('layer-separation') as HTMLInputElement;
    const nodeSepRange = document.getElementById('node-separation') as HTMLInputElement;
    const marginRange = document.getElementById('margin') as HTMLInputElement;
    const useVerticesCheckbox = document.getElementById('use-vertices') as HTMLInputElement;

    // Define the vertices setter function
    const verticesSetter = (link: dia.Link, vertices: dia.Point[]) => {
        link.transition('vertices', vertices, {
            duration: 500,
            timingFunction: util.timing.cubic,
            rewrite: true,
            valueFunction: (start: dia.Point[], end: dia.Point[]) => {

                let from = start ?? [];
                const to = end ?? [];

                // Fix up array length - so they match and we can interpolate between them
                if (from.length < to.length) {
                    const middle = (link.findView(paper) as dia.LinkView).getPointAtRatio(0.5);
                    from.push(...Array.from({ length: to.length - from.length }, () => middle));
                } else if (from.length > to.length) {
                    from = Array.from({ length: to.length }, (_, i) => from[i]);
                }

                return (t: number) => {

                    return from.map((point, i) => {
                        return {
                            x: point.x + (to[i].x - point.x) * t,
                            y: point.y + (to[i].y - point.y) * t
                        }
                    });
                }
            }
        });
    };

    return {
        layerDirection: Number(directionSelect.value) as LayerDirectionEnum,
        edgeRoutingMode: Number(routingSelect.value) as EdgeRoutingMode,
        layerSeparation: Number(layerSepRange.value),
        nodeSeparation: Number(nodeSepRange.value),
        polylinePadding: 10,
        gridSize: 10,
        margins: {
            left: Number(marginRange.value),
            right: Number(marginRange.value),
            top: Number(marginRange.value),
            bottom: Number(marginRange.value)
        },
        // Custom position setter to animate the transition
        setPosition: (element: dia.Element, position: dia.Point) => {

            element.transition('position', position, {
                duration: 500,
                timingFunction: util.timing.cubic,
                valueFunction: util.interpolate.object
            });
        },
        // Use either false or the custom vertices setter based on checkbox
        setVertices: useVerticesCheckbox.checked ? verticesSetter : false,
        // Custom anchor setter to animate the transition
        setAnchor: (link, referencePoint, bbox, endType) => {

            const anchorArgs = {
                dx: referencePoint.x - bbox.x - bbox.width / 2,
                dy: referencePoint.y - bbox.y - bbox.height / 2
            };

            if (!link.prop(`${endType}/anchor`)) {
                link.prop(`${endType}/anchor`, { name: 'modelCenter', args: anchorArgs });
                return;
            }

            link.transition(`${endType}/anchor/args`,
                anchorArgs,
                {
                    duration: 500,
                    timingFunction: util.timing.cubic,
                    valueFunction: util.interpolate.object
                }
            );
        },
        // Custom labels setter to animate the transition
        setLabels: (link, labelPosition, points) => {

            const polyline = new g.Polyline(points);
            const linkSize = link.get('labelSize') as { width: number, height: number };

            const cx = labelPosition.x + linkSize.width / 2;
            const cy = labelPosition.y + linkSize.height / 2;

            const center = new g.Point(cx, cy);

            const distance = polyline.closestPointLength(center);
            // Get the tangent at the closest point to calculate the offset
            const tangent = polyline.tangentAtLength(distance);

            link.transition('labels/0/position',
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

// Run the layout with current options
const runLayout = () => {
    paper.freeze();
    const options = getLayoutOptions();
    // options.edgeRoutingMode = EdgeRoutingMode.SplineBundling;
    // options.layerSeparation = 150;
    // options.nodeSeparation = 150;
    if (!options.setVertices) {
        // Unset all vertices if setVertices is false
        graph.getLinks().forEach(link => link.vertices([]))
    }
    layout(graph, options);
    paper.unfreeze();
};

// Initialize the demo
const initDemo = () => {
    setupControlListeners();
    createGraph(graph, 'tree');
    runLayout();
};

initDemo();
