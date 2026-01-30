/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import '../index.css';
import type { dia} from '@joint/core';
import { highlighters } from '@joint/core';
import type {
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
  type RenderElement
} from '@joint/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PRIMARY, SECONDARY, LIGHT, PAPER_CLASSNAME } from 'storybook-config/theme';

// ============================================================================
// Types & Data
// ============================================================================

interface ElementData extends GraphElement {
  readonly title?: string;
  readonly color?: string;
  readonly jjType?: string; // Custom JointJS type (e.g., 'standard.Cylinder')
}

interface LinkData extends GraphLink {
  readonly color?: string;
  readonly width?: number;
  readonly dashed?: boolean;
}

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 120;

const elements: Record<string, ElementData> = {
  '1': { x: 50, y: 50, title: 'Node 1', color: PRIMARY },
  '2': { x: 300, y: 50, title: 'Node 2', color: SECONDARY },
  '3': { x: 50, y: 200, title: 'Node 3', color: LIGHT },
  '4': { x: 300, y: 200, width: 80, height: 100, jjType: 'standard.Cylinder', color: PRIMARY },
};

const links: Record<string, LinkData> = {
  'link1': { source: { id: '1' }, target: { id: '2' }, color: PRIMARY, width: 3 },
  'link2': { source: { id: '1' }, target: { id: '3' }, color: SECONDARY, dashed: true },
  'link3': { source: { id: '2' }, target: { id: '4' }, color: LIGHT, width: 2 },
  'link4': { source: { id: '3' }, target: { id: '4' }, color: PRIMARY, dashed: true },
};

// ============================================================================
// Data Mappers
// ============================================================================

function mapDataToElementAttributes({
  data,
  defaultAttributes,
}: {
  data: ElementData;
  defaultAttributes: () => Record<string, unknown>;
}) {
  const { jjType, color = 'lightgray' } = data;
  // For custom JointJS types (like standard.Cylinder), override the type
  if (jjType) {
    return {
      ...defaultAttributes(),
      type: jjType,
   };
  }
  // For React-rendered elements, use defaults
  return defaultAttributes();
}

function mapDataToLinkAttributes({
  data,
  defaultAttributes,
}: {
  data: LinkData;
  defaultAttributes: () => Record<string, unknown>;
}) {
  const { color = LIGHT, width = 2, dashed = false } = data;
  const attributes = defaultAttributes();
  // Apply custom link styling
  return {
    ...attributes,
  };
}

// ============================================================================
// Shape Component
// ============================================================================

function Shape({ color = 'lightgray', title = 'Node' }: { color?: string; title?: string }) {
  const textRef = useRef<SVGTextElement>(null);
  const { width, height } = useNodeSize(textRef, {
    transform: ({ x, y, width, height }) => ({
      x,
      y,
      width: width + 24,
      height: height + 16,
    }),
  });

  return (
    <>
      <rect width={width} height={height} rx={8} ry={8} fill={color} />
      <text
        ref={textRef}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 14, fill: 'white', fontWeight: 500 }}
      >
        {title}
      </text>
    </>
  );
}

// ============================================================================
// Minimap
// ============================================================================

function MinimapShape({ color = 'lightgray' }: { color?: string }) {
  const layout = useNodeLayout();
  if (!layout) return null;
  const { width, height } = layout;
  return <rect width={width} height={height} fill={color} rx={4} ry={4} />;
}

function MiniMap({ paper }: { paper: dia.Paper }) {
  const renderElement: RenderElement<ElementData> = useCallback(
    ({ color = 'white' }) => <MinimapShape color={color} />,
    []
  );

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const { width, height } = paper.getComputedSize();
    const nextScale = Math.min(MINIMAP_WIDTH / width, MINIMAP_HEIGHT / height);
    setScale(nextScale);
  }, [paper]);

  return (
    <div
      className="absolute bottom-4 right-4 border border-gray-300 rounded-lg overflow-hidden bg-gray-900"
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
    >
      <Paper
        interactive={false}
        width="100%"
        height="100%"
        scale={scale}
        className={PAPER_CLASSNAME}
        renderElement={renderElement}
      />
    </div>
  );
}

// ============================================================================
// Selection Highlighter
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
      padding: 6,
      attrs: {
        stroke: '#2563eb',
        'stroke-width': 2,
        'stroke-dasharray': '4,2',
      },
    });
  }, [graph, paper, selectedId]);

  return null;
}

// ============================================================================
// Main Component
// ============================================================================

function Main() {
  const [paperStore, setPaperStore] = useState<PaperStore | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [selectedElement, setSelectedElement] = useState<dia.Cell.ID | null>(null);

  const renderElement: RenderElement<ElementData> = useCallback(
    ({ color, title }) => <Shape color={color} title={title} />,
    []
  );

  return (
    <div className="flex flex-col relative w-full" style={{ height: 400 }}>
      <Paper
        ref={setPaperStore}
        className={PAPER_CLASSNAME}
        width="100%"
        height="100%"
        renderElement={renderElement}
        onElementPointerClick={({ elementView }) =>
          setSelectedElement(elementView.model.id ?? null)
        }
        onBlankPointerClick={() => setSelectedElement(null)}
      >
        <Selection selectedId={selectedElement} />
      </Paper>

      {showMinimap && paperStore && <MiniMap paper={paperStore.paper} />}

      <button
        type="button"
        className="absolute top-2 right-2 z-10 bg-gray-800 hover:bg-gray-700 rounded-md px-3 py-1.5 text-white text-sm transition-colors"
        onClick={() => setShowMinimap((v) => !v)}
      >
        {showMinimap ? 'Hide Minimap' : 'Show Minimap'}
      </button>

      <div className="absolute top-2 left-2 z-10 bg-gray-800 rounded-md px-3 py-1.5 text-white text-sm">
        {selectedElement ? `Selected: ${selectedElement}` : 'Click a node to select'}
      </div>
    </div>
  );
}

// ============================================================================
// App Export
// ============================================================================

export default function App() {
  return (
    <GraphProvider
      elements={elements}
      links={links}
      mapDataToElementAttributes={mapDataToElementAttributes}
      mapDataToLinkAttributes={mapDataToLinkAttributes}
    >
      <Main />
    </GraphProvider>
  );
}
