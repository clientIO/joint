import { useState, useCallback, useMemo, useRef } from 'react';
import { GraphProvider, Paper, type Element, type Link } from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

// Base theme — provides --jr-* CSS variable defaults (including element styles)
import '../../../css/theme.css';

// Dark theme overrides
import './dark-theme.css';

type Data = { label: string };
const initialElements: Record<string, Element<Data>> = {
  a: {
    // No width or height — element should size to fit label
    // label: 'Lorem ipsum',
    data: {
      label: 'Lorem ipsum',
    },
    position: { x: 100, y: 60 },
    style: { ports: { out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' } } },
  },
  b: {
    // Explicit width - height is still determined by content
    size: { width: 100, height: 40 },
    data: {
      label: 'dolor sit amet',
    },
    position: { x: 280, y: 60 },
    style: {
      ports: {
        out: { cx: 'calc(w)', cy: 'calc(0.5 * h)' },
        in: { cx: 0, cy: 'calc(0.5 * h)' },
      },
    },
  },
  c: {
    // Explicit width and height - content should be clipped
    data: {
      label: 'consectetur adipiscing elit',
    },
    position: { x: 450, y: 60 },
    size: { width: 100, height: 80 },
    style: { ports: { in: { cx: 0, cy: 'calc(0.5 * h)', passive: true } } },
  },
};

const TOOLBAR_STYLE = { marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' } as const;

const initialLinks: Record<string, Link> = {
  'a-b': {
    source: 'a',
    sourcePort: 'out',
    target: 'b',
    targetPort: 'in',
    targetMarker: 'arrow',
  },
  'b-c': {
    source: 'b',
    sourcePort: 'out',
    target: 'c',
    targetPort: 'in',
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
