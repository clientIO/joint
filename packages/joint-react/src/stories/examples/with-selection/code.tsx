/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import '../index.css';
import { dia, highlighters, g, V } from '@joint/core';
import type {
  ElementToGraphOptions,
    LinkToGraphOptions,
    // ReactElementView,
    PaperStore} from '@joint/react';
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
    type RenderElement
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
            const size = (view.model as dia.Element).size();
            return new g.Rect(0, 0, size.width, size.height);
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
}: Readonly<{
  color?: string;
  title?: string;
}>) {
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

function MinimapShape({ color = 'lightgray' }: Readonly<{ color?: string }>) {
    const layout = useNodeLayout();
    if (!layout) return null;

    const { width, height } = layout;
    return <rect width={width} height={height} fill={color} rx={10} ry={10} />;
}

// ============================================================================
// Minimap
// ============================================================================

function MiniMap({ paper }: Readonly<{ paper: dia.Paper }>) {
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


function Badge({ x = 0, y = 0, size = 10, color = 'red' }: Readonly<{ x?: number; y?: number; size?: number; color?: string }>) {
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

function RenderElementWithBadge({ jjType, color = 'lightgray', title = 'No Title' }: Readonly<ElementData>) {
    const layout = useNodeLayout();
    const width = layout?.width ?? 100;
    return (
        <>
            {jjType ?? <Shape color={color} title={title} />}
            <Badge x={width + 10} y={-10} size={10} color={color} />
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
        return <RenderElementWithBadge {...data} />;
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
                    // eslint-disable-next-line no-console
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
            mapDataToElementAttributes={mapDataToElementAttributesExample}
            mapDataToLinkAttributes={mapDataToLinkAttributesExample}
        >
            <Main />
        </GraphProvider>
    );
}

function mapDataToLinkAttributesExample({ data, defaultAttributes }: LinkToGraphOptions<LinkData>) {
    const { jjType, color } = data;

    // For standard links, use the built-in theme defaults
    // The defaultAttributes() already handles color, width, and markers
    if (!jjType) {
        return defaultAttributes();
    }

    // For custom link types (like standard.ShadowLink), override the type
    // and exclude attrs so the link type's defaults are used
    const attributes = {
      ...defaultAttributes(),
      type: jjType
    };
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (jjType) {
      case 'standard.ShadowLink': {
        attributes.attrs = {
          line: {
              connection: true,
              stroke: color,
              strokeWidth: 20,
              strokeLinejoin: 'round',
              targetMarker: {
                  'type': 'path',
                  'stroke': 'none',
                  'd': 'M 0 -10 -10 0 0 10 z'
              },
              sourceMarker: {
                  'type': 'path',
                  'stroke': 'none',
                  'd': 'M -10 -10 0 0 -10 10 0 10 0 -10 z'
              }
          },
          shadow: {
              connection: true,
              transform: 'translate(3,6)',
              stroke: '#000000',
              strokeOpacity: 0.2,
              strokeWidth: 20,
              strokeLinejoin: 'round',
              targetMarker: {
                  'type': 'path',
                  'd': 'M 0 -10 -10 0 0 10 z',
                  'stroke': 'none'
              },
              sourceMarker: {
                  'type': 'path',
                  'stroke': 'none',
                  'd': 'M -10 -10 0 0 -10 10 0 10 0 -10 z'
              }
          }
        };
        break;
      }
      default: {
        throw new Error(`Unsupported jjType: ${jjType}`);
      }
    }
    return attributes;
}

function mapDataToElementAttributesExample({ data, defaultAttributes }: ElementToGraphOptions<ElementData>) {
    const { jjType, color = 'lightgray' } = data;
    if (!jjType) return defaultAttributes();
    const attributes = {
      ...defaultAttributes(),
      type: jjType,
    };
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (jjType) {
      case 'standard.Cylinder': {
        attributes.attrs = {
          root: {
              cursor: 'move'
          },
          body: {
              lateralArea: 10,
              fill: color,
              stroke: '#333333',
              strokeWidth: 2
          },
          top: {
              cx: 'calc(w/2)',
              cy: 10,
              rx: 'calc(w/2)',
              ry: 10,
              fill: color,
              stroke: '#333333',
              strokeWidth: 2
          },
          label: {
              textVerticalAnchor: 'middle',
              textAnchor: 'middle',
              x: 'calc(w/2)',
              y: 'calc(h+15)',
              fontSize: 14,
              fill: '#333333'
          }
        };
        break;
      }
      default: {
        throw new Error(`Unsupported jjType: ${jjType}`);
      }
    }
    return attributes;
}
