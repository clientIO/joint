import { useState, useCallback, useMemo, useRef } from 'react';
import { GraphProvider, Paper, type PortalElementRecord, type PortalLinkRecord } from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

// Base theme — provides --jr-* CSS variable defaults (including element styles)
import '../../../css/theme.css';

// Dark theme overrides
import './dark-theme.css';

type Data = { label: string };
const initialElements: Record<string, PortalElementRecord<Data>> = {
  a: {
    // No width or height — element should size to fit label
    // label: 'Lorem ipsum',
    data: {
      label: 'Lorem ipsum',
    },
    position: { x: 100, y: 60 },
    ports: { out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' } },
  },
  b: {
    // Explicit width - height is still determined by content
    size: { width: 100, height: 40 },
    data: {
      label: 'dolor sit amet',
    },
    position: { x: 280, y: 60 },
    ports: {
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' },
      in: { cx: 0, cy: 'calc(0.5 * h)' },
    },
  },
  c: {
    // Explicit width and height - content should be clipped
    data: {
      label: 'consectetur adipiscing elit',
    },
    position: { x: 450, y: 60 },
    size: { width: 100, height: 80 },
    ports: { in: { cx: 0, cy: 'calc(0.5 * h)', passive: true } },
  },
};

const TOOLBAR_STYLE = { marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' } as const;

const initialLinks: Record<string, PortalLinkRecord> = {
  'a-b': {
    source: { id: 'a', port: 'out' },
    target: { id: 'b', port: 'in' },
    targetMarker: 'arrow',
  },
  'b-c': {
    source: { id: 'b', port: 'out' },
    target: { id: 'c', port: 'in' },
    targetMarker: 'arrow',
  },
};

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
          {isDark ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark'}
        </button>
      </div>
      <GraphProvider elements={initialElements} links={initialLinks}>
        <Paper className={PAPER_CLASSNAME} height={240} />
      </GraphProvider>
    </div>
  );
}
