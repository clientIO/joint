/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import '../index.css';
import { dia, highlighters } from '@joint/core';
import {
  type CellRecordBase,
  GraphProvider,
  useCell,
  Paper,
  useCells,
  useGraph,
  useMeasureNode,
  usePaper,
  usePaperEvents,
  ELEMENT_MODEL_TYPE,
  type CellId,
  type PaperProps,
  type RenderElement,
  selectCellType,
  selectElementSize,
} from '@joint/react';
import { linkRoutingOrthogonal } from '@joint/react/presets';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { LIGHT, PAPER_STYLE } from 'storybook-config/theme';

// ============================================================================
// Types & Constants
// ============================================================================

const PAPER_CLASSNAME = 'border-1 border-gray-300 rounded-lg shadow-md overflow-hidden p-2 mr-2';

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;

interface ElementUserData {
  readonly [key: string]: unknown;
  readonly title?: string;
  readonly color?: string;
}

const PAPER_PROPS: PaperProps = {
  ...linkRoutingOrthogonal(),
};

// ============================================================================
// Data
// ============================================================================

const initialCells: readonly CellRecordBase[] = [
  {
    id: '1',
    type: 'element',
    data: { title: 'This is error element' },
    position: { x: 50, y: 110 },
    angle: 30,
  },
  {
    id: '2',
    type: 'element',
    data: { title: 'This is info element' },
    position: { x: 550, y: 110 },
  },
  {
    id: '3',
    type: 'element',
    data: { color: '#f87171' },
    position: { x: 50, y: 370 },
  },
  {
    id: '4',
    type: 'standard.Cylinder',
    data: { color: '#60a5fa' },
    position: { x: 550, y: 370 },
    size: { width: 100, height: 150 },
  },
  // Links now use built-in theme properties: color, width, sourceMarker, targetMarker
  {
    id: 'link1',
    type: 'link',
    source: { id: '1' },
    target: { id: '2' },
    style: {
      width: 4,
      color: 'orange',
      className: 'dashed-link',
    },
  },
  {
    id: 'link2',
    type: 'link',
    source: { id: '3' },
    target: { id: '4' },
    style: { color: 'green' },
  },
  {
    id: 'link3',
    type: 'standard.ShadowLink',
    source: { id: '2' },
    target: { id: '4' },
  },
];

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
  const { width, height } = useMeasureNode(textRef, {
    transform: nodeSizeToModelSize,
  });

  return (
    <>
      <ellipse rx={width / 2} ry={height / 2} cx={width / 2} cy={height / 2} fill={color} />
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

function MinimapShape({ color = 'lightgray' }: Readonly<ElementUserData>) {
  const { width, height } = useCell(selectElementSize);
  return <rect width={width} height={height} fill={color} rx={10} ry={10} />;
}

// ============================================================================
// Minimap
// ============================================================================

function MiniMap({ paper }: Readonly<{ paper: dia.Paper }>) {
  const renderElement: RenderElement<ElementUserData> = useCallback(
    (data) => <MinimapShape color={data.color ?? 'white'} />,
    []
  );

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const { width, height } = paper.getComputedSize();
    const nextScale = Math.min(MINIMAP_WIDTH / width, MINIMAP_HEIGHT / height);
    setScale(nextScale); // eslint-disable-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect -- Derive scale from paper dimensions
  }, [paper]);

  return (
    <div
      className="absolute bg-black bottom-6 right-6 border border-[#dde6ed] rounded-lg overflow-hidden"
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
    >
      <Paper
        {...PAPER_PROPS}
        interactive={false}
        height="100%"
        scale={scale}
        renderElement={renderElement}
        style={{ backgroundColor: LIGHT }}
        drawGrid={false}
      />
    </div>
  );
}

// ============================================================================
// Selection
// ============================================================================

function Selection({ selectedId }: { selectedId: CellId | null }) {
  const { paper } = usePaper();
  const { graph } = useGraph();

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

function Badge({
  x = 0,
  y = 0,
  size = 10,
  color = 'red',
}: Readonly<{ x?: number; y?: number; size?: number; color?: string }>) {
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

function RenderElementWithBadge({
  color = 'lightgray',
  title = 'No Title',
}: Readonly<ElementUserData>) {
  const { width } = useCell(selectElementSize);
  const cellType = useCell(selectCellType);
  // Only render the default Shape for our ElementModel type. Custom JointJS
  // shapes (e.g. standard.Cylinder) render themselves via their native markup.
  const isElementModel = cellType === ELEMENT_MODEL_TYPE;
  return (
    <>
      {isElementModel ? <Shape color={color} title={title} /> : null}
      <Badge x={width + 10} y={-10} size={10} color={color} />
    </>
  );
}

function Main() {
  const paperId = useId();
  const [paper, setPaper] = useState<dia.Paper | null>(null);
  const [showMinimap, setShowMinimap] = useState(false);
  const [selectedElement, setSelectedElement] = useState<CellId | null>(null);

  const renderElement: RenderElement<ElementUserData> = useCallback(
    (data) => <RenderElementWithBadge {...data} />,
    []
  );

  const { graph } = useGraph();
  // Subscribe to cells so the story reflects graph size in devtools if needed.
  useCells();

  usePaperEvents(
    paperId,
    {
      'element:pointerclick': (elementView) =>
        setSelectedElement((elementView.model.id as CellId) ?? null),
      'element:pointerdblclick': (elementView) => {
        const cell = elementView.model;
        cell.clone().translate(10, 10).addTo(cell.graph);
      },
      'blank:pointerclick': () => setSelectedElement(null),
    },
    [setSelectedElement]
  );

  return (
    <div className="flex flex-col relative w-full h-full">
      <Paper
        id={paperId}
        {...PAPER_PROPS}
        ref={setPaper}
        className={PAPER_CLASSNAME}
        height="calc(100vh - 100px)"
        snapLinks={{ radius: 25 }}
        renderElement={renderElement}
        linkPinning={false}
        portalSelector={({ model }) => {
          if (model.get('type') !== ELEMENT_MODEL_TYPE) return 'root';
          // implicit: use the default selector for ElementModel cells
        }}
        style={PAPER_STYLE}
        drawGrid={false}
      >
        <Selection selectedId={selectedElement} />
      </Paper>

      {showMinimap && paper && <MiniMap paper={paper} />}

      <button
        type="button"
        className="absolute top-2 right-6 z-10 bg-gray-900 rounded-lg p-2 shadow-md text-white text-sm"
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
        }}
      >
        Log
      </button>
    </div>
  );
}

// ============================================================================
// App
// ============================================================================

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
