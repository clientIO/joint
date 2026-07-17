import { dia, shapes } from '@joint/core';
import {
  type CellRecord,
  type CellVisibility,
  GraphProvider,
  useCell,
  Paper,
  ElementModel,
  LinkModel,
  HTMLHost,
  selectElementSize,
  usePaper,
} from '@joint/react';
import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import './styles.css';

// Colors — unified dark diagram palette.
const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const BACKGROUND_LAYER_FILL = '#121c26';
const BACKGROUND_LAYER_STROKE = '#2f4053';
const TEXT_COLOR = '#DDE6ED';
const MUTED_TEXT_COLOR = '#93A4B3';

const PAPER_ID = 'layers-paper';
/** Render order: first added draws behind, last draws in front. */
const LAYERS = ['background', 'main', 'foreground'] as const;

interface LayeredElementData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color?: string;
  readonly isBackground?: boolean;
}

const initialCells: ReadonlyArray<CellRecord<LayeredElementData>> = [
  {
    id: 'bg-1',
    type: 'element',
    data: { label: 'Background 1', color: BACKGROUND_LAYER_FILL, isBackground: true },
    position: { x: 20, y: 20 },
    size: { width: 200, height: 150 },
    layer: 'background',
  },
  {
    id: 'bg-2',
    type: 'element',
    data: { label: 'Background 2', color: BACKGROUND_LAYER_FILL, isBackground: true },
    position: { x: 250, y: 20 },
    size: { width: 200, height: 150 },
    layer: 'background',
  },
  {
    id: 'main-1',
    type: 'element',
    data: { label: 'Main 1', color: PRIMARY },
    position: { x: 50, y: 50 },
    layer: 'main',
  },
  {
    id: 'main-2',
    type: 'element',
    data: { label: 'Main 2', color: PRIMARY },
    position: { x: 280, y: 50 },
    layer: 'main',
  },
  {
    id: 'fg-1',
    type: 'element',
    data: { label: 'Foreground', color: SECONDARY },
    position: { x: 100, y: 200 },
    layer: 'foreground',
  },
  {
    id: 'link-1',
    type: 'link',
    source: { id: 'main-1' },
    target: { id: 'main-2' },
    style: { color: PRIMARY, className: 'fade-in' },
    layer: 'main',
  },
  {
    id: 'link-2',
    type: 'link',
    source: { id: 'main-2' },
    target: { id: 'fg-1' },
    style: { color: SECONDARY, className: 'fade-in' },
    layer: 'foreground',
  },
];

function BackgroundNode({ label, color }: Readonly<LayeredElementData>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <g className="fade-in">
      <rect
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill={color}
        stroke={BACKGROUND_LAYER_STROKE}
        strokeWidth={2}
      />
      <text x={10} y={25} fill={MUTED_TEXT_COLOR} fontSize={12}>
        {label}
      </text>
    </g>
  );
}

function ElementNode({ label, color }: Readonly<LayeredElementData>) {
  const style = useMemo(() => ({ background: color, color: TEXT_COLOR }), [color]);
  return (
    <HTMLHost className="jj-node fade-in" style={style}>
      {label}
    </HTMLHost>
  );
}

function RenderElement(data: Readonly<LayeredElementData>) {
  return data.isBackground ? <BackgroundNode {...data} /> : <ElementNode {...data} />;
}

function Main() {
  const [hiddenLayers, setHiddenLayers] = useState<ReadonlySet<string>>(() => new Set());
  const { wakeUp } = usePaper(PAPER_ID);

  const toggleLayer = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const layerId = event.currentTarget.dataset.layer;
      if (!layerId) return;
      setHiddenLayers((previous) => {
        const next = new Set(previous);
        if (next.has(layerId)) {
          next.delete(layerId);
        } else {
          next.add(layerId);
        }
        return next;
      });
      // Refresh the paper so hidden/shown cells are re-evaluated immediately.
      wakeUp();
    },
    [wakeUp]
  );

  const cellVisibility = useCallback<CellVisibility>(
    ({ model }) => {
      const cellLayer = model.layer();
      return !cellLayer || !hiddenLayers.has(cellLayer);
    },
    [hiddenLayers]
  );

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        {LAYERS.map((layerId) => {
          const isHidden = hiddenLayers.has(layerId);
          return (
            <button
              key={layerId}
              type="button"
              data-layer={layerId}
              className={isHidden ? 'jj-btn' : 'jj-btn jj-btn--primary'}
              onClick={toggleLayer}
            >
              {isHidden ? 'Show' : 'Hide'} {layerId}
            </button>
          );
        })}
      </div>
      <Paper
        id={PAPER_ID}
        className="min-h-0 flex-1"
        renderElement={RenderElement}
        cellVisibility={cellVisibility}
      />
    </div>
  );
}

export default function App() {
  const graph = useMemo(() => {
    const nextGraph = new dia.Graph(
      {},
      { cellNamespace: { ...shapes, element: ElementModel, link: LinkModel } }
    );
    for (const id of LAYERS) {
      nextGraph.addLayer({ id });
    }
    return nextGraph;
  }, []);

  return (
    <GraphProvider graph={graph} initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
