import {
  type CellRecord,
  type LayerRecord,
  GraphProvider,
  HTMLHost,
  Paper,
  useCell,
  useGraph,
  useLayer,
  useLayers,
  selectElementSize,
} from '@joint/react';
import { useCallback, useMemo } from 'react';
import './styles.css';

// Colors — unified dark diagram palette.
const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const BACKGROUND_LAYER_FILL = '#121c26';
const BACKGROUND_LAYER_STROKE = '#2f4053';
const TEXT_COLOR = '#DDE6ED';
const MUTED_TEXT_COLOR = '#93A4B3';

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

const selectVisible = (layer: LayerRecord) => layer.visible !== false;

/** One row of the layers panel; subscribes to its own layer only. */
function LayerRow({ id }: Readonly<{ id: DiagramLayerId }>) {
  // `LayerId` infers from the typed `id`, `Selected` from the selector — no generics needed.
  const isVisible = useLayer(id, selectVisible) ?? true;
  const { setLayer } = useGraph();
  const toggle = useCallback(() => setLayer(id, { visible: !isVisible }), [id, isVisible, setLayer]);
  return (
    <button
      type="button"
      className={isVisible ? 'jj-btn jj-btn--primary' : 'jj-btn'}
      onClick={toggle}
    >
      {isVisible ? 'Hide' : 'Show'} {id}
    </button>
  );
}

function Main() {
  const layers = useLayers<DiagramLayerId>();
  const { setLayers, setCell } = useGraph();

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
          <LayerRow key={layer.id} id={layer.id} />
        ))}
        <button type="button" className="jj-btn" onClick={flipOrder}>
          Flip order
        </button>
        <button type="button" className="jj-btn" onClick={liftMain}>
          Move "Main 1" to foreground
        </button>
      </div>
      <Paper className="min-h-0 flex-1" renderElement={RenderElement} />
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
