import { dia, highlighters, g, V } from '@joint/core';
import './index.css';
import {
    GraphProvider,
    Paper,
    useGraph,
    usePaper,
    useNodeSize,
    useNodeLayout,
    type GraphElement,
    type GraphLink,
    type PaperProps,
    type RenderElement,
    // ReactElementView,
    PaperStore,
    // ReactLinkView,
    // type MarkerPreset,
} from '@joint/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Types & Constants
// ============================================================================

const PAPER_CLASSNAME =
  'border-1 border-gray-300 rounded-lg shadow-md overflow-hidden p-2 mr-2';

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;

interface ElementData extends GraphElement {
  readonly type?: 'default' | 'error' | 'info';
  readonly title?: string;
  readonly color?: string;
  readonly jjType?: string;
}

interface LinkData extends GraphLink {
  readonly className?: string;
  readonly jjType?: string;
}

const PAPER_PROPS: PaperProps<ElementData> = {
    defaultAnchor: {
        name: 'midSide',
        args: {
            rotate: true,
            useModelGeometry: true,
        }
    },
    defaultConnectionPoint: {
        name: 'anchor',
        args: {
            offset: 0,
            useModelGeometry: true,
        },
    },
    defaultConnector: {
        name: 'straight',
        args: {
            cornerType: 'line',
            cornerPreserveAspectRatio: true,
            useModelGeometry: true,
        },
    },
    defaultRouter: {
        name: 'rightAngle',
        args: {
            direction: 'right',
            useModelGeometry: true,
        },
    },
    measureNode: (node, view) => {
        if (node === view.el) {
            return new g.Rect(view.model.size());
        }
        return V(node).getBBox();
    }
};

// ============================================================================
// Data
// ============================================================================

const elements: Record<string, ElementData> = {
    '1': {
        x: 50,
        y: 110,
        angle: 30,
        title: 'This is error element',
    },
    '2': {
        x: 550,
        y: 110,
        title: 'This is info element',
    },
    '3': {
        x: 50,
        y: 370,
        color: '#f87171',
    },
    '4': {
        x: 550,
        y: 370,
        width: 100,
        height: 150,
        jjType: 'standard.Cylinder',
        color: '#60a5fa',
    },
};


// Links now use built-in theme properties: color, width, sourceMarker, targetMarker
const links: Record<string, LinkData> = {
    'link1': {
        source: { id: '1' },
        target: { id: '2' },
        width: 4,
        color: 'orange',
        // targetMarker: 'arrow' as MarkerPreset,
        className: 'dashed-link',
    },
    'link2': {
        source: { id: '3' },
        target: { id: '4' },
        color: 'green',
        // sourceMarker: 'circle' as MarkerPreset,
        // targetMarker: 'cross' as MarkerPreset,
    },
    'link3': {
        source: { id: '2' },
        target: { id: '4' },
        jjType: 'standard.ShadowLink',
        color: 'purple',
    },
};

// ============================================================================
// Helpers
// ============================================================================

function nodeSizeToModelSize({
    x,
    y,
    width,
    height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
    const padding = 20;
    return {
        x,
        y,
        width: width + padding,
        height: height + padding,
    };
}

// ============================================================================
// Shapes
// ============================================================================

function Shape({
    color = 'lightgray',
    title = 'No Title',
}: {
  color?: string;
  title?: string;
}) {
    const textRef = useRef<SVGTextElement>(null);
    const { width, height } = useNodeSize(textRef, {
        transform: nodeSizeToModelSize,
    });

    return (
        <>
            <ellipse
                rx={width / 2}
                ry={height / 2}
                cx={width / 2}
                cy={height / 2}
                fill={color}
            />
            <text
                ref={textRef}
                x={width / 2}
                y={height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: 14, fill: 'black' }}
            >
                {title}
            </text>
        </>
    );
}

function MinimapShape({ color = 'lightgray' }: { color?: string }) {
    const layout = useNodeLayout();
    if (!layout) return null;

    const { width, height } = layout;
    return <rect width={width} height={height} fill={color} rx={10} ry={10} />;
}

// ============================================================================
// Minimap
// ============================================================================

function MiniMap({ paper }: { paper: dia.Paper }) {
    const renderElement: RenderElement<ElementData> = useCallback(
        ({ color = 'white' }) => <MinimapShape color={color} />,
        [],
    );

    const [scale, setScale] = useState(1);

    useEffect(() => {
        const { width, height } = paper.getComputedSize();
        const nextScale = Math.min(MINIMAP_WIDTH / width, MINIMAP_HEIGHT / height);
        setScale(nextScale);
    }, [paper]);

    return (
        <div
            className="absolute bg-black bottom-6 right-6 border border-[#dde6ed] rounded-lg overflow-hidden"
            style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
        >
            <Paper
                {...PAPER_PROPS}
                interactive={false}
                width="100%"
                height="100%"
                scale={scale}
                className={PAPER_CLASSNAME}
                // elementView={ReactElementView}
                renderElement={renderElement}
            />
        </div>
    );
}

// ============================================================================
// Selection
// ============================================================================

function Selection({ selectedId }: { selectedId: dia.Cell.ID | null }) {
    const paper = usePaper();
    const graph = useGraph();

    useEffect(() => {
        highlighters.mask.removeAll(paper);

        if (!selectedId) return;

        const cell = graph.getCell(selectedId);
        if (!cell) return;

        const view = paper.findViewByModel(cell);
        highlighters.mask.add(view, 'root', 'selection', {
            padding: 8,
            layer: dia.Paper.Layers.FRONT,
        });
    }, [graph, paper, selectedId]);

    return null;
}

// ============================================================================
// Main
// ============================================================================


function Badge({ x = 0, y = 0, size = 10, color = 'red' }: { x?: number; y?: number; size?: number; color?: string }) {
    return (
        <>
            <circle cx={x} cy={y} r={size} fill={color} />
            <text
                x={x}
                y={y}
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="12"
                fill="white"
                fontWeight="bold"
            >
        !
            </text>
        </>
    );
}

function Main() {
    const [paperStore, setPaperStore] = useState<PaperStore | null>(null);
    const [showMinimap, setShowMinimap] = useState(false);
    const [selectedElement, setSelectedElement] = useState<dia.Cell.ID | null>(
        null,
    );


    const renderElement = useCallback((data: ElementData) => {
        const { jjType, color = 'lightgray', title = 'No Title' } = data;
        const { width } = useNodeLayout();
        return (
            <>
                {jjType ?? <Shape color={color} title={title} />}
                <Badge x={width + 10} y={-10} size={10} color={color} />
            </>
        );
    }, []);

    const graph = useGraph();

    return (
        <div className="flex flex-col relative w-full h-full">
            <Paper
                {...PAPER_PROPS}
                ref={setPaperStore}
                className={PAPER_CLASSNAME}
                width="100%"
                height="calc(100vh - 100px)"
                snapLinks={{ radius: 25 }}
                renderElement={renderElement}
                // linkView={ReactLinkView}
                onViewPostponed={() => false}
                // elementView={ReactElementView}
                validateMagnet={(_, magnet) =>
                    magnet.getAttribute('magnet') !== 'passive'
                }
                linkPinning={false}
                onElementPointerClick={({ elementView }) =>
                    setSelectedElement(elementView.model.id ?? null)
                }
                onElementPointerDblClick={({ elementView }) => {
                    const cell = elementView.model;
                    cell.clone().translate(10, 10).addTo(cell.graph);
                }}
                onBlankPointerClick={() => setSelectedElement(null)}
            >
                <Selection selectedId={selectedElement} />
            </Paper>

            {showMinimap && paperStore && <MiniMap paper={paperStore.paper} />}

            <button
                type="button"
                className="absolute top-2 right-2 z-10 bg-gray-900 rounded-lg p-2 shadow-md text-white text-sm"
                onClick={() => setShowMinimap((v) => !v)}
            >
                {showMinimap ? 'Hide Minimap' : 'Show Minimap'}
            </button>

            <button
                type="button"
                className="absolute top-2 left-2 z-10 bg-gray-900 rounded-lg p-2 shadow-md text-white text-sm"
                onClick={() => {
                    console.log('Graph log:', graph.toJSON());
                }}>Log
            </button>
        </div>
    );
}

// ============================================================================
// App
// ============================================================================

export default function App() {
    return (
        <GraphProvider
            elements={elements}
            links={links}
            mapDataToElementAttributes={({ data, defaultAttributes }) => {
                const { jjType, color = 'lightgray' } = data as ElementData;
                if (!jjType) return defaultAttributes();
                return {
                    ...defaultAttributes(),
                    type: jjType,
                    attrs: {
                        body: { fill: color },
                    },
                };
            }}
            mapDataToLinkAttributes={({ data, defaultAttributes }) => {
                const { jjType } = data as LinkData;

                // For standard links, use the built-in theme defaults
                // The defaultAttributes() already handles color, width, and markers
                if (!jjType) {
                    return defaultAttributes();
                }

                // For custom link types (like standard.ShadowLink), override the type
                const { attrs, ...rest } = defaultAttributes();
                return {
                    ...rest,
                    type: jjType,
                };
            }}
        >
            <Main />
        </GraphProvider>
    );
}
