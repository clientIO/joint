import { useCallback, useRef, useState } from 'react';
import {
  GraphProvider,
  Paper,
  useCell,
  selectElementSize,
  type CellRecord,
  type RenderElement,
} from '@joint/react';

// Plain CSS custom properties drive the theme (no Tailwind) — see theme-overrides.css.
import './theme-overrides.css';

type NodeData = { readonly label: string };

// Intentional inline background: theming the paper surface is the point of this demo.
const paperStyle = { background: 'var(--paper-bg)' };

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  {
    id: 'a',
    type: 'element',
    data: { label: 'Source' },
    position: { x: 50, y: 60 },
    size: { width: 120, height: 50 },
  },
  {
    id: 'b',
    type: 'element',
    data: { label: 'Process' },
    position: { x: 280, y: 20 },
    size: { width: 120, height: 50 },
  },
  {
    id: 'c',
    type: 'element',
    data: { label: 'Review' },
    position: { x: 280, y: 120 },
    size: { width: 120, height: 50 },
  },
  {
    id: 'd',
    type: 'element',
    data: { label: 'Output' },
    position: { x: 510, y: 60 },
    size: { width: 120, height: 50 },
  },
  // Links with no explicit color/width inherit their styling from CSS variables.
  {
    id: 'a→b',
    type: 'link',
    source: { id: 'a' },
    target: { id: 'b' },
    style: { targetMarker: 'arrow' },
    labelMap: { flow: { text: 'async' } },
  },
  {
    id: 'a→c',
    type: 'link',
    source: { id: 'a' },
    target: { id: 'c' },
    style: { targetMarker: 'arrow' },
    labelMap: { flow: { text: 'sync' } },
  },
  {
    id: 'b→d',
    type: 'link',
    source: { id: 'b' },
    target: { id: 'd' },
    style: { targetMarker: 'arrow' },
    labelMap: { status: { text: 'approved' } },
  },
  // One link overrides the color inline — an explicit prop beats the CSS variable.
  {
    id: 'c→d',
    type: 'link',
    source: { id: 'c' },
    target: { id: 'd' },
    style: { color: '#f59e0b', width: 3, targetMarker: 'arrow' },
    labelMap: { status: { text: 'pending' } },
  },
];

function Node({ label }: Readonly<{ label: string }>) {
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <rect
        width={width}
        height={height}
        rx="8"
        fill="var(--node-bg)"
        stroke="var(--node-stroke)"
        strokeWidth="1.5"
        filter="drop-shadow(3px 3px 3px var(--node-shadow))"
      />
      <text
        x={width / 2}
        y={height / 2}
        dominantBaseline="middle"
        textAnchor="middle"
        fill="var(--node-text)"
      >
        {label}
      </text>
    </>
  );
}

const renderElement: RenderElement<NodeData> = (data) => <Node label={data.label} />;

function Diagram() {
  const [isDark, setIsDark] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleTheme = useCallback(() => {
    setIsDark((previous) => {
      const next = !previous;
      wrapperRef.current?.classList.toggle('dark', next);
      return next;
    });
  }, []);

  return (
    <div ref={wrapperRef} className="css-theme flex size-full flex-col">
      <div className="jj-controls m-3">
        <button type="button" className="jj-btn" onClick={toggleTheme}>
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
        <span className="jj-label">
          Links inherit <code>--jj-link-color</code>; the amber link overrides it with a{' '}
          <code>color</code> prop.
        </span>
      </div>
      <Paper className="min-h-0 flex-1" style={paperStyle} renderElement={renderElement} />
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
