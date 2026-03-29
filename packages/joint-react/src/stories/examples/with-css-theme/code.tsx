/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useState, useCallback, useRef } from 'react';
import {
  GraphProvider,
  Paper,
  useElementSize,
  useLinkDefaults,
  type PortalElementRecord,
  type PortalLinkRecord,
  type ElementRecord,
  type LinkRecord,
  type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

// Base theme — provides --jr-* CSS variable defaults
import '../../../css/theme.css';

// Plain CSS overrides for light/dark (no Tailwind)
import './theme-overrides.css';

type NodeData = {
  readonly label: string;
  readonly [key: string]: unknown;
};

const initialElements: Record<string, PortalElementRecord<NodeData>> = {
  a: { data: { label: 'Source' }, position: { x: 50, y: 60 }, size: { width: 120, height: 50 } },
  b: { data: { label: 'Process' }, position: { x: 280, y: 20 }, size: { width: 120, height: 50 } },
  c: { data: { label: 'Review' }, position: { x: 280, y: 120 }, size: { width: 120, height: 50 } },
  d: { data: { label: 'Output' }, position: { x: 510, y: 60 }, size: { width: 120, height: 50 } },
};

// Links: no explicit color/width — CSS variables provide styling.
// One link overrides color to show per-link precedence.
const initialLinks: Record<string, PortalLinkRecord> = {
  'a→b': {
    source: { id: 'a' },
    target: { id: 'b' },
    labels: { flow: { text: 'async' } },
  },
  'a→c': {
    source: { id: 'a' },
    target: { id: 'c' },
    labels: { flow: { text: 'sync' } },
  },
  'b→d': {
    source: { id: 'b' },
    target: { id: 'd' },
    labels: { status: { text: 'approved' } },
  },
  'c→d': {
    source: { id: 'c' },
    target: { id: 'd' },
    color: '#f59e0b', // explicit override — inline style beats CSS variables
    width: 3,
    labels: { status: { text: 'pending' } },
  },
};

function Node({ label }: Readonly<{ label: string }>) {
  const { width, height } = useElementSize();
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

function Diagram() {
  const [elements, setElements] = useState<Record<string, ElementRecord<NodeData>>>(initialElements);
  const [links, setLinks] = useState<Record<string, LinkRecord>>(initialLinks);
  const [isDark, setIsDark] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { mapLinkToAttributes } = useLinkDefaults({ targetMarker: 'arrow' });

  const renderElement: RenderElement<NodeData> = useCallback(
    (data) => <Node label={data.label} />,
    []
  );

  const toggleTheme = useCallback(() => {
    setIsDark((previous) => {
      const next = !previous;
      wrapperRef.current?.classList.toggle('dark', next);
      return next;
    });
  }, []);

  return (
    <div ref={wrapperRef} className="css-theme">
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            cursor: 'pointer',
            borderRadius: 20,
            border: 'none',
            fontSize: 13,
            fontWeight: 500,
            background: isDark ? '#312e81' : '#e0e7ff',
            color: isDark ? '#c7d2fe' : '#4338ca',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {isDark ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark'}
        </button>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          Links inherit color from <code>--jr-link-color</code>. The amber link overrides via{' '}
          <code>color</code> prop.
        </span>
      </div>
      <GraphProvider<NodeData>
        elements={elements}
        links={links}
        onElementsChange={setElements}
        onLinksChange={setLinks}
        mapLinkToAttributes={mapLinkToAttributes}
      >
        <Paper
          className={PAPER_CLASSNAME}
          style={{ background: 'var(--paper-bg)' }}
          height={240}
          renderElement={renderElement}
        />
      </GraphProvider>
    </div>
  );
}

export default function App() {
  return <Diagram />;
}
