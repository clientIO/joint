import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  type CellRecord,
  GraphProvider,
  useCell,
  Paper,
  useGraph,
  type ElementPort,
  type ElementRecord,
  type RenderElement,
  selectElementSize,
} from '@joint/react';

const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';
const LIGHT = '#DDE6ED';
const BG = '#131E29';
const NODE_FILL = '#1c2836';

type PortShape = 'ellipse' | 'rect';

interface ElementData {
  readonly label: string;
}

const outPort: ElementPort = { cx: 'calc(w)', cy: 'calc(0.5*h)' };
const inPort: ElementPort = { cx: 0, cy: 'calc(0.5*h)' };
const ELEMENT_SIZE = { width: 100, height: 40 };

const portsByKind: Record<string, Record<string, ElementPort>> = {
  source: { out: outPort },
  sink: { in: inPort },
  process: { in: inPort, out: outPort },
};

const getPortStyle = (color: string, shape: PortShape) => ({
  color,
  shape,
  width: 12,
  height: 12,
  outline: BG,
  outlineWidth: 2,
});

const getLinkStyle = (color: string) => ({
  color,
  width: 3,
  targetMarker: 'arrow' as const,
});

const getLabelStyle = (color: string) => ({
  color: LIGHT,
  fontSize: 11,
  fontFamily: 'monospace',
  backgroundPadding: { horizontal: 10, vertical: 5 },
  backgroundColor: NODE_FILL,
  backgroundOutline: color,
});

const initialCells: ReadonlyArray<CellRecord<ElementData>> = [
  { id: 'a', type: 'element', kind: 'source', data: { label: 'Start' }, position: { x: 50, y: 140 }, size: ELEMENT_SIZE, portMap: portsByKind.source },
  { id: 'b', type: 'element', kind: 'process', data: { label: 'Process' }, position: { x: 250, y: 50 }, size: ELEMENT_SIZE, portMap: portsByKind.process },
  { id: 'c', type: 'element', kind: 'process', data: { label: 'Review' }, position: { x: 250, y: 230 }, size: ELEMENT_SIZE, portMap: portsByKind.process },
  { id: 'd', type: 'element', kind: 'sink', data: { label: 'Done' }, position: { x: 480, y: 140 }, size: ELEMENT_SIZE, portMap: portsByKind.sink },
  { id: 'a-b', type: 'link', source: { id: 'a', port: 'out' }, target: { id: 'b', port: 'in' } },
  { id: 'a-c', type: 'link', source: { id: 'a', port: 'out' }, target: { id: 'c', port: 'in' } },
  {
    id: 'b-d',
    type: 'link',
    source: { id: 'b', port: 'out' },
    target: { id: 'd', port: 'in' },
    labelMap: { status: { text: 'approved' } },
  },
  {
    id: 'c-d',
    type: 'link',
    source: { id: 'c', port: 'out' },
    target: { id: 'd', port: 'in' },
    labelMap: { status: { text: 'pending' } },
  },
];

function Element({ label, color }: Readonly<{ label: string; color: string }>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <rect width={width} height={height} rx="6" fill={NODE_FILL} stroke={color} strokeWidth="2" />
      <text
        x={width / 2}
        y={height / 2}
        fill={color}
        fontSize={14}
        fontFamily="monospace"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </>
  );
}

/**
 * Applies theme-dependent styling (port color/shape, link style) to every cell
 * when `color` or `portShape` changes. `updateCells` patches each cell in one
 * batch, leaving all other data untouched.
 */
function ThemeUpdater({ color, portShape }: Readonly<{ color: string; portShape: PortShape }>) {
  const { updateCells, isElement, isLink } = useGraph<ElementRecord<ElementData>>();

  useEffect(() => {
    const portStyle = getPortStyle(color, portShape);
    const style = getLinkStyle(color);
    const labelStyle = getLabelStyle(color);

    updateCells((previous) =>
      previous.map((cell) => {
        if (isElement(cell)) {
          return { ...cell, portStyle };
        }
        if (isLink(cell)) {
          return { ...cell, style, labelStyle };
        }
        return cell;
      })
    );
  }, [color, portShape, updateCells, isElement, isLink]);

  return null;
}

function Diagram() {
  const [alternate, setAlternate] = useState(false);
  const color = alternate ? SECONDARY : PRIMARY;
  const portShape: PortShape = alternate ? 'rect' : 'ellipse';

  const renderElement: RenderElement<ElementData> = useCallback(
    (data) => <Element label={data.label} color={color} />,
    [color]
  );

  const toggleDefaults = useCallback(() => setAlternate((value) => !value), []);

  // New links dragged from ports inherit the current theme's default styling.
  const defaultLink = useMemo(
    () => ({ style: getLinkStyle(color), labelStyle: getLabelStyle(color) }),
    [color]
  );

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <button type="button" className="jj-btn jj-btn--primary" onClick={toggleDefaults}>
          {alternate ? 'Square ports' : 'Round ports'}
        </button>
      </div>
      <ThemeUpdater color={color} portShape={portShape} />
      <Paper className="min-h-0 flex-1" renderElement={renderElement} defaultLink={defaultLink} />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Diagram />
    </GraphProvider>
  );
}
