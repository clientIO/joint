import {
  type CellRecord,
  type CellVisibility,
  type LayerRecord,
  GraphProvider,
  HTMLHost,
  Paper,
  useCell,
  useGraph,
  useLayers,
  usePaper,
  selectElementSize,
} from '@joint/react';
import { useCallback, useMemo, useState } from 'react';
import './styles.css';

// Colors — unified dark diagram palette.
const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const BACKGROUND_LAYER_FILL = '#121c26';
const BACKGROUND_LAYER_STROKE = '#2f4053';
const TEXT_COLOR = '#DDE6ED';
const MUTED_TEXT_COLOR = '#93A4B3';

const PAPER_ID = 'layers-paper';

/** Autocomplete and narrowing for every layer id in this diagram. */
type DiagramLayerId = 'background' | 'cells' | 'foreground';

/** Paint order: index 0 draws at the bottom, the last entry on top. */
const initialLayers: ReadonlyArray<LayerRecord<DiagramLayerId>> = [
  { id: 'background' },
  { id: 'cells' },
  { id: 'foreground' },
];

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
  },
  {
    id: 'main-2',
    type: 'element',
    data: { label: 'Main 2', color: PRIMARY },
    position: { x: 280, y: 50 },
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

interface LayerToggleProps {
  readonly id: DiagramLayerId;
  readonly isHidden: boolean;
  readonly onToggle: (id: DiagramLayerId) => void;
}

/** One row of the layers panel. */
function LayerToggle({ id, isHidden, onToggle }: Readonly<LayerToggleProps>) {
  const toggle = useCallback(() => onToggle(id), [id, onToggle]);
  return (
    <button type="button" className={isHidden ? 'jj-btn' : 'jj-btn jj-btn--primary'} onClick={toggle}>
      {isHidden ? 'Show' : 'Hide'} {id}
    </button>
  );
}

function Main() {
  const layers = useLayers<DiagramLayerId>();
  const { setLayers, setCell } = useGraph();
  const { wakeUp } = usePaper(PAPER_ID);
  const [hiddenLayers, setHiddenLayers] = useState<ReadonlySet<string>>(() => new Set());

  // Hiding a layer unmounts its cells through the paper's `cellVisibility`.
  const toggleLayer = useCallback(
    (id: DiagramLayerId) => {
      setHiddenLayers((previous) => {
        const next = new Set(previous);
        if (!next.delete(id)) next.add(id);
        return next;
      });
      // Refresh the paper so hidden/shown cells are re-evaluated immediately.
      wakeUp();
    },
    [wakeUp]
  );

  const cellVisibility = useCallback<CellVisibility>(
    ({ model, graph }) => !hiddenLayers.has(graph.getCellLayerId(model)),
    [hiddenLayers]
  );

  // Reverse the paint order: the array IS the order, so reorder the array.
  const flipOrder = useCallback(
    () => setLayers((previous) => previous.toReversed()),
    [setLayers]
  );

  // Membership lives on the cell: move it by writing its `layer`.
  const liftMain = useCallback(
    () => setCell('main-1', (previous) => ({ ...previous, layer: 'foreground' })),
    [setCell]
  );

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        {layers.map((layer) => (
          <LayerToggle
            key={layer.id}
            id={layer.id}
            isHidden={hiddenLayers.has(layer.id)}
            onToggle={toggleLayer}
          />
        ))}
        <button type="button" className="jj-btn" onClick={flipOrder}>
          Flip order
        </button>
        <button type="button" className="jj-btn" onClick={liftMain}>
          Move "Main 1" to foreground
        </button>
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
  return (
    <GraphProvider initialLayers={initialLayers} initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
