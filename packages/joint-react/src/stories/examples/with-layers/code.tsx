/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { dia, shapes } from '@joint/core';
import type { PortalPaper } from '@joint/react';
import {
  GraphProvider,
  Paper,
  PortalElement,
  PortalLink,
  useMeasureNode,
  useElementSize,
  type PortalElementRecord,
  type PortalLinkRecord,
} from '@joint/react';
import { useMemo, useRef, useState } from 'react';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY, BG } from 'storybook-config/theme';

interface LayeredElementData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color?: string;
  readonly isBackground?: boolean;
}

// Elements assigned to different layers
const elements: Record<string, PortalElementRecord<LayeredElementData>> = {
  // Background layer elements
  'bg-1': {
    data: { label: 'Background 1', color: '#374151', isBackground: true },
    position: { x: 20, y: 20 },
    size: { width: 200, height: 150 },
    layer: 'background',
  },
  'bg-2': {
    data: { label: 'Background 2', color: '#374151', isBackground: true },
    position: { x: 250, y: 20 },
    size: { width: 200, height: 150 },
    layer: 'background',
  },
  // Main layer elements
  'main-1': {
    data: { label: 'Main 1', color: PRIMARY },
    position: { x: 50, y: 50 },
    layer: 'main',
  },
  'main-2': {
    data: { label: 'Main 2', color: PRIMARY },
    position: { x: 280, y: 50 },
    layer: 'main',
  },
  // Foreground layer elements
  'fg-1': {
    data: { label: 'Foreground', color: SECONDARY },
    position: { x: 100, y: 200 },
    layer: 'foreground',
  },
};

// Links assigned to layers
const links: Record<string, PortalLinkRecord> = {
  'link-1': {
    source: { id: 'main-1' },
    target: { id: 'main-2' },
    color: PRIMARY,
    layer: 'main',
    className: 'fade-in',
  },
  'link-2': {
    source: { id: 'main-2' },
    target: { id: 'fg-1' },
    color: SECONDARY,
    layer: 'foreground',
    className: 'fade-in',
  },
};

function BackgroundNode({ label, color }: Readonly<LayeredElementData>) {
  const { width, height } = useElementSize();
  return (
    <g className="fade-in">
      <rect
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill={color}
        stroke="#1f2937"
        strokeWidth={2}
        opacity={0.5}
      />
      <text x={10} y={25} fill="white" fontSize={12} opacity={0.7}>
        {label}
      </text>
    </g>
  );
}

function ElementNode({ label, color }: Readonly<LayeredElementData>) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useMeasureNode(ref);

  return (
    <foreignObject width={width} height={height} className="fade-in">
      <div
        ref={ref}
        style={{
          padding: '12px 20px',
          backgroundColor: color,
          borderRadius: 8,
          color: 'white',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'move',
          display: 'inline-block',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        {label}
      </div>
    </foreignObject>
  );
}

function RenderElement(props: Readonly<LayeredElementData>) {
  if (props.isBackground) {
    return <BackgroundNode {...props} />;
  }
  return <ElementNode {...props} />;
}

interface MainProps {
  readonly hiddenLayers: Set<string>;
  readonly toggleLayer: (layerId: string) => void;
}

function Main({ hiddenLayers, toggleLayer }: Readonly<MainProps>) {
  const layers = ['background', 'main', 'foreground'];
  const paperRef = useRef<dia.Paper | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, padding: '8px 0' }}>
        {layers.map((layerId) => (
          <button
            key={layerId}
            type="button"
            onClick={() => {
              toggleLayer(layerId);
              paperRef.current?.wakeUp();
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: hiddenLayers.has(layerId) ? '#4b5563' : PRIMARY,
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
              opacity: hiddenLayers.has(layerId) ? 0.5 : 1,
            }}
          >
            {hiddenLayers.has(layerId) ? 'Show' : 'Hide'} {layerId}
          </button>
        ))}
      </div>
      <Paper
        ref={paperRef}
        height={300}
        className={PAPER_CLASSNAME}
        renderElement={RenderElement}
        cellVisibility={(cell: dia.Cell) => {
          const cellLayer = cell.layer();
          return !cellLayer || !hiddenLayers.has(cellLayer);
        }}
        style={{ backgroundColor: BG }}
        drawGrid={false}
      />
    </div>
  );
}

export default function App() {
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(() => new Set());

  // The `fade-in` class must be set when the link is appended to the DOM
  // in order for the transition to work correctly.
  class FadingLink extends shapes.standard.Link {
    defaults() {
      return {
        ...super.defaults,
        // overriding the default markup to add a class to the link line
        markup: [
          {
            tagName: 'path',
            selector: 'wrapper',
            attributes: {
              fill: 'none',
              cursor: 'pointer',
              stroke: 'transparent',
              'stroke-linecap': 'round',
            },
          },
          {
            tagName: 'path',
            selector: 'line',
            className: 'fade-in', // Apply fade-in class to link line
            attributes: {
              fill: 'none',
              'pointer-events': 'none',
            },
          },
        ],
      };
    }
  }

  // Create graph with layers configured
  const graph = useMemo(() => {
    const g = new dia.Graph(
      {},
      {
        cellNamespace: {
          ...shapes,
          PortalElement,
          PortalLink,
          standard: {
            ...shapes.standard,
            Link: FadingLink,
          },
        },
      }
    );
    // Add layers in order (background renders first, foreground last)
    g.addLayer({ id: 'background' });
    g.addLayer({ id: 'main' });
    g.addLayer({ id: 'foreground' });
    return g;
  }, [FadingLink]);

  const toggleLayer = (layerId: string) => {
    setHiddenLayers((previous) => {
      const next = new Set(previous);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  return (
    <GraphProvider graph={graph} elements={elements} links={links}>
      <Main hiddenLayers={hiddenLayers} toggleLayer={toggleLayer} />
    </GraphProvider>
  );
}
