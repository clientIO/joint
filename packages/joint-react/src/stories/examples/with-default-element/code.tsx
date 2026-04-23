import { useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  GraphProvider,
  Paper,
  HTMLBox,
  type Cells,
  type LinkMarkerName,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

// Base theme — provides --jj-* CSS variable defaults (including element styles)
import '../../../css/theme.css';

// Dark theme overrides
import './dark-theme.css';

interface Data {
  readonly label: string;
  readonly width?: number;
  readonly height?: number;
  readonly [key: string]: unknown;
}

const TOOLBAR_STYLE = { marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' } as const;
const DEFAULT_LINK = { style: { targetMarker: 'arrow' as LinkMarkerName } };

const initialCells: Cells<Data> = [
  {
    id: 'a',
    type: 'ElementModel',
    // No width or height — element auto-sizes to fit label
    data: {
      label: 'no width or height',
    },
    position: { x: 100, y: 60 },
    portMap: { out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' } },
  },
  {
    id: 'b',
    type: 'ElementModel',
    // Explicit width — height grows to fit content
    data: {
      label: 'fixed width, auto height',
      width: 120,
    },
    position: { x: 280, y: 60 },
    portMap: {
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' },
      in: { cx: 0, cy: 'calc(0.5 * h)', passive: true },
    },
  },
  {
    id: 'c',
    type: 'ElementModel',
    // Explicit width and height — fixed box, content clipped
    data: {
      label: 'fixed width and height',
      width: 120,
      height: 80,
    },
    position: { x: 450, y: 60 },
    portMap: {
      in: { cx: 0, cy: 'calc(0.5 * h)', passive: true },
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' },
    },
  },
  {
    id: 'd',
    type: 'ElementModel',
    // Explicit height — width grows to fit content
    data: {
      label: 'auto width, fixed height',
      height: 120,
    },
    position: { x: 620, y: 60 },
    portMap: { in: { cx: 0, cy: 'calc(0.5 * h)', passive: true } },
  },
  {
    id: 'a-b',
    type: 'LinkModel',
    source: { id: 'a', port: 'out' },
    target: { id: 'b', port: 'in' },
    ...DEFAULT_LINK,
  },
  {
    id: 'b-c',
    type: 'LinkModel',
    source: { id: 'b', port: 'out' },
    target: { id: 'c', port: 'in' },
    ...DEFAULT_LINK,
  },
  {
    id: 'c-d',
    type: 'LinkModel',
    source: { id: 'c', port: 'out' },
    target: { id: 'd', port: 'in' },
    ...DEFAULT_LINK,
  },
];

const RenderElement = memo(function RenderElement({ data }: Readonly<{ data: Data | undefined }>) {
  const { label, width, height } = data ?? ({} as Data);
  const boxStyle = useMemo(() => ({ width, height }), [width, height]);
  return (
    <HTMLBox style={boxStyle}>
      {label}
    </HTMLBox>
  );
});

function renderElement(data: Data | undefined) {
  return <RenderElement data={data} />;
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const buttonStyle = useMemo(
    () => ({
      display: 'inline-flex' as const,
      alignItems: 'center' as const,
      gap: 6,
      padding: '5px 14px',
      cursor: 'pointer' as const,
      borderRadius: 20,
      border: 'none',
      fontSize: 13,
      fontWeight: 500,
      background: isDark ? '#313244' : '#e0e7ff',
      color: isDark ? '#cdd6f4' : '#4338ca',
      transition: 'background 0.2s, color 0.2s',
    }),
    [isDark]
  );

  const toggleTheme = useCallback(() => {
    setIsDark((previous) => {
      const next = !previous;
      wrapperRef.current?.classList.toggle('dark', next);
      return next;
    });
  }, []);

  return (
    <div ref={wrapperRef} className="default-element-demo">
      <div style={TOOLBAR_STYLE}>
        <button type="button" onClick={toggleTheme} style={buttonStyle}>
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      <GraphProvider initialCells={initialCells}>
        <Paper
          className={PAPER_CLASSNAME}
          height={240}
          renderElement={renderElement}
          defaultLink={DEFAULT_LINK}
        />
      </GraphProvider>
    </div>
  );
}
