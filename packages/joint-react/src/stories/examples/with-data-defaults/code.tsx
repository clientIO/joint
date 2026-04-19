/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useState, useCallback, useEffect } from 'react';
import {
  GraphProvider,
  Paper,
  useElementSize,
  useGraph,
  type ElementRecord,
  type ElementPort,
  type LinkRecord,
  type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME, PAPER_STYLE, PRIMARY, SECONDARY, LIGHT, BG } from 'storybook-config/theme';

interface ElementData {
  label: string;
}

interface PortElement extends ElementRecord<ElementData> {
  kind: 'source' | 'process' | 'sink';
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
  backgroundPadding: { x: 10, y: 5 },
  backgroundColor: '#1e293b',
  backgroundOutline: color,
});


const getDefaultLink = (color: string) => {
  return () => ({
    style: getLinkStyle(color),
    labelStyle: getLabelStyle(color),
  });
};

const initialElements: Record<string, PortElement> = {
  a: { kind: 'source', data: { label: 'Start' }, position: { x: 50, y: 140 }, size: ELEMENT_SIZE, portMap: portsByKind.source },
  b: { kind: 'process', data: { label: 'Process' }, position: { x: 250, y: 50 }, size: ELEMENT_SIZE, portMap: portsByKind.process },
  c: { kind: 'process', data: { label: 'Review' }, position: { x: 250, y: 230 }, size: ELEMENT_SIZE, portMap: portsByKind.process },
  d: { kind: 'sink', data: { label: 'Done' }, position: { x: 480, y: 140 }, size: ELEMENT_SIZE, portMap: portsByKind.sink },
};

const initialLinks: Record<string, LinkRecord> = {
  'a-b': { source: { id: 'a', port: 'out' }, target: { id: 'b', port: 'in' } },
  'a-c': { source: { id: 'a', port: 'out' }, target: { id: 'c', port: 'in' } },
  'b-d': {
    source: { id: 'b', port: 'out' },
    target: { id: 'd', port: 'in' },
    labelMap: { status: { text: 'approved' } },
  },
  'c-d': {
    source: { id: 'c', port: 'out' },
    target: { id: 'd', port: 'in' },
    labelMap: { status: { text: 'pending' } },
  },
};

function Element({ label, color }: Readonly<{ label: string; color: string }>) {
  const { width, height } = useElementSize();
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
 * when `color` or `portShape` changes. Uses `setElements`/`setLinks` to update
 * everything in a single batch instead of iterating cell by cell.
 */
function ThemeUpdater({
  color,
  portShape,
}: Readonly<{ color: string; portShape: 'ellipse' | 'rect' }>) {
  const { setElements, setLinks } = useGraph<ElementData>();

  useEffect(() => {
    const portStyle = getPortStyle(color, portShape);

    setElements((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([id, element]) => [id, { ...element, portStyle }])
      )
    );

    const style = getLinkStyle(color);
    const labelStyle = getLabelStyle(color);
    setLinks((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([id, link]) => [id, { ...link, style, labelStyle }])
      )
    );
  }, [color, portShape, setElements, setLinks]);

  return null;
}

function Diagram() {
  const [alternate, setAlternate] = useState(false);
  const color = alternate ? SECONDARY : PRIMARY;
  const portShape = alternate ? ('rect' as const) : ('ellipse' as const);

  const renderElement: RenderElement<ElementData> = useCallback(
    (data) => <Element label={data.label} color={color} />,
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
        {alternate ? '\u25A0 Square ports' : '\u25CF Round ports'}
      </button>
      <GraphProvider<ElementData> elements={initialElements} links={initialLinks}>
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
