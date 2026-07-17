import { useCallback, useMemo, useRef, useState } from 'react';
import {
  GraphProvider,
  Paper,
  HTMLBox,
  type CellRecord,
  type RenderElement,
  type LinkMarkerName,
} from '@joint/react';

// Overrides the built-in --jj-* theme variables while the wrapper has the `dark` class.
import './dark-theme.css';

interface Data {
  readonly label: string;
  readonly width?: number;
  readonly height?: number;
}

const DEFAULT_LINK = { style: { targetMarker: 'arrow' as LinkMarkerName } };

const initialCells: ReadonlyArray<CellRecord<Data>> = [
  {
    id: 'a',
    type: 'element',
    // No width or height — element auto-sizes to fit label.
    data: { label: 'no width or height' },
    position: { x: 100, y: 60 },
    portMap: { out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' } },
  },
  {
    id: 'b',
    type: 'element',
    // Explicit width — height grows to fit content.
    data: { label: 'fixed width, auto height', width: 120 },
    position: { x: 280, y: 60 },
    portMap: {
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' },
      in: { cx: 0, cy: 'calc(0.5 * h)', passive: true },
    },
  },
  {
    id: 'c',
    type: 'element',
    // Explicit width and height — fixed box, content clipped.
    data: { label: 'fixed width and height', width: 120, height: 80 },
    position: { x: 450, y: 60 },
    portMap: {
      in: { cx: 0, cy: 'calc(0.5 * h)', passive: true },
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' },
    },
  },
  {
    id: 'd',
    type: 'element',
    // Explicit height — width grows to fit content.
    data: { label: 'auto width, fixed height', height: 120 },
    position: { x: 620, y: 60 },
    portMap: { in: { cx: 0, cy: 'calc(0.5 * h)', passive: true } },
  },
  {
    id: 'a-b',
    type: 'link',
    source: { id: 'a', port: 'out' },
    target: { id: 'b', port: 'in' },
    ...DEFAULT_LINK,
  },
  {
    id: 'b-c',
    type: 'link',
    source: { id: 'b', port: 'out' },
    target: { id: 'c', port: 'in' },
    ...DEFAULT_LINK,
  },
  {
    id: 'c-d',
    type: 'link',
    source: { id: 'c', port: 'out' },
    target: { id: 'd', port: 'in' },
    ...DEFAULT_LINK,
  },
];

function ElementBox({ label, width, height }: Readonly<Data>) {
  const style = useMemo(() => ({ width, height }), [width, height]);
  return <HTMLBox style={style}>{label}</HTMLBox>;
}

const renderElement: RenderElement<Data> = (data) => (
  <ElementBox label={data.label} width={data.width} height={data.height} />
);

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
    <div ref={wrapperRef} className="default-element-demo flex size-full flex-col">
      <div className="jj-controls m-3">
        <button type="button" className="jj-btn" onClick={toggleTheme}>
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      <Paper className="min-h-0 flex-1" renderElement={renderElement} defaultLink={DEFAULT_LINK} />
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
