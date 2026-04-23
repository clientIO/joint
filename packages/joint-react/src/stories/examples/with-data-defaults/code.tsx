/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useState, useCallback, useEffect } from 'react';
import {
  GraphProvider,
  useElement,
  Paper,
    useGraph,
  type Cells,
  type ElementPort,
  type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PAPER_STYLE, PRIMARY, SECONDARY, LIGHT, BG } from 'storybook-config/theme';

interface ElementData {
  label: string;
}

const outPort: ElementPort = { cx: 'calc(w)', cy: 'calc(0.5*h)' };
const inPort: ElementPort = { cx: 0, cy: 'calc(0.5*h)' };
const ELEMENT_SIZE = { width: 100, height: 40 };

const portsByKind: Record<string, Record<string, ElementPort>> = {
  source: { out: outPort },
  sink: { in: inPort },
  process: { in: inPort, out: outPort },
};

const getPortStyle = (color: string, shape: 'ellipse' | 'rect') => ({
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
  backgroundColor: '#1e293b',
  backgroundOutline: color,
});


const getDefaultLink = (color: string) => {
  return () => ({
    style: getLinkStyle(color),
    labelStyle: getLabelStyle(color),
  });
};

const initialCells: Cells<ElementData> = [
  { id: 'a', type: 'ElementModel', kind: 'source', data: { label: 'Start' }, position: { x: 50, y: 140 }, size: ELEMENT_SIZE, portMap: portsByKind.source },
  { id: 'b', type: 'ElementModel', kind: 'process', data: { label: 'Process' }, position: { x: 250, y: 50 }, size: ELEMENT_SIZE, portMap: portsByKind.process },
  { id: 'c', type: 'ElementModel', kind: 'process', data: { label: 'Review' }, position: { x: 250, y: 230 }, size: ELEMENT_SIZE, portMap: portsByKind.process },
  { id: 'd', type: 'ElementModel', kind: 'sink', data: { label: 'Done' }, position: { x: 480, y: 140 }, size: ELEMENT_SIZE, portMap: portsByKind.sink },
  { id: 'a-b', type: 'LinkModel', source: { id: 'a', port: 'out' }, target: { id: 'b', port: 'in' } },
  { id: 'a-c', type: 'LinkModel', source: { id: 'a', port: 'out' }, target: { id: 'c', port: 'in' } },
  {
    id: 'b-d',
    type: 'LinkModel',
    source: { id: 'b', port: 'out' },
    target: { id: 'd', port: 'in' },
    labelMap: { status: { text: 'approved' } },
  },
  {
    id: 'c-d',
    type: 'LinkModel',
    source: { id: 'c', port: 'out' },
    target: { id: 'd', port: 'in' },
    labelMap: { status: { text: 'pending' } },
  },
];

function Element({ label, color }: Readonly<{ label: string; color: string }>) {
  const { width, height } = useElement((element) => element.size);
  return (
    <>
      <rect width={width} height={height} rx="6" fill="#1e293b" stroke={color} strokeWidth="2" />
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
 * Applies theme-dependent styling (port color/shape, link style) to all cells
 * when `color` or `portShape` changes. Uses `updateCells` to patch every cell
 * in one batch without removing anything else.
 */
function ThemeUpdater({
  color,
  portShape,
}: Readonly<{ color: string; portShape: 'ellipse' | 'rect' }>) {
  const { updateCells, isElement, isLink } = useGraph<ElementData>();

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
  const portShape = alternate ? ('rect' as const) : ('ellipse' as const);

  const renderElement: RenderElement<ElementData> = useCallback(
    (data) => <Element label={data?.label ?? ''} color={color} />,
    [color]
  );

  const changeDefaults = useCallback(() => setAlternate((v) => !v), []);

  return (
    <>
      <button
        type="button"
        onClick={changeDefaults}
        style={{
          marginBottom: 8,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 14px',
          cursor: 'pointer',
          borderRadius: 20,
          border: 'none',
          fontSize: 13,
          fontWeight: 500,
          background: alternate ? SECONDARY : PRIMARY,
          color: LIGHT,
          transition: 'background 0.2s',
        }}
      >
        {alternate ? '■ Square ports' : '● Round ports'}
      </button>
      <GraphProvider<ElementData> initialCells={initialCells}>
        <ThemeUpdater color={color} portShape={portShape} />
        <Paper
          className={PAPER_CLASSNAME}
          height={340}
          renderElement={renderElement}
          style={PAPER_STYLE}
          defaultLink={getDefaultLink(color)}
        />
      </GraphProvider>
    </>
  );
}

export default function App() {
  return <Diagram />;
}
