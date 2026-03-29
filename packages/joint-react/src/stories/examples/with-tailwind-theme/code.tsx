
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import { useState, useCallback, useRef } from 'react';
import {
  GraphProvider,
  Paper,
  useElementSize,
  useElementDefaults,
  useLinkDefaults,
  type PortalElementRecord,
  type PortalLinkRecord,
  type ElementRecord,
  type LinkRecord,
  type RenderElement,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

// Base theme + Tailwind preset (maps --jr-* → Tailwind v4 variables)
import '../../../css/theme.css';
import './tailwind-theme.css';

interface NodeUserData {
  readonly [key: string]: unknown;
  label: string;
}

const initialElements: Record<string, PortalElementRecord<NodeUserData>> = {
  a: {
    data: { label: 'Source' },
    position: { x: 50, y: 70 },
    size: { width: 120, height: 50 },
    ports: {
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)', label: 'out' },
    },
  },
  b: {
    data: { label: 'Process' },
    position: { x: 290, y: 20 },
    size: { width: 120, height: 50 },
    ports: {
      in: { cx: 0, cy: 'calc(0.5 * h)', label: 'in' },
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)', label: 'out' },
    },
  },
  c: {
    data: { label: 'Review' },
    position: { x: 290, y: 120 },
    size: { width: 120, height: 50 },
    ports: {
      in: { cx: 0, cy: 'calc(0.5 * h)', label: 'in' },
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)', label: 'out' },
    },
  },
  d: {
    data: { label: 'Output' },
    position: { x: 550, y: 70 },
    size: { width: 120, height: 50 },
    ports: {
      in: { cx: 0, cy: 'calc(0.5 * h)', label: 'in' },
    },
  },
};

const initialLinks: Record<string, PortalLinkRecord> = {
  'a→b': { source: { id: 'a', port: 'out' }, target: { id: 'b', port: 'in' } },
  'a→c': { source: { id: 'a', port: 'out' }, target: { id: 'c', port: 'in' } },
  'b→d': {
    source: { id: 'b', port: 'out' },
    target: { id: 'd', port: 'in' },
    labels: { info: { text: 'approved' } },
  },
  'c→d': {
    source: { id: 'c', port: 'out' },
    target: { id: 'd', port: 'in' },
    color: '#e11d48',
  },
};

function Node({ label }: Readonly<{ label: string }>) {
  const { width, height } = useElementSize();
  return (
    <>
      <rect
        className="
                    fill-slate-50 stroke-slate-300
                    forest:fill-emerald-900 forest:stroke-emerald-600
                    ocean:fill-sky-900 ocean:stroke-sky-500
                    sunset:fill-amber-50 sunset:stroke-amber-400
                "
        width={width}
        height={height}
        rx="8"
        strokeWidth="1.5"
      />
      <text
        className="
                    fill-slate-800
                    forest:fill-emerald-100
                    ocean:fill-sky-100
                    sunset:fill-amber-900
                "
        x={width / 2}
        y={height / 2}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {label}
      </text>
    </>
  );
}

type Theme = 'default' | 'forest' | 'ocean' | 'sunset';

const themes: Theme[] = ['default', 'forest', 'ocean', 'sunset'];

const themeLabels: Record<Theme, string> = {
  default: 'Slate',
  forest: 'Forest',
  ocean: 'Ocean',
  sunset: 'Sunset',
};

function Diagram() {
  const [elements, setElements] = useState<Record<string, ElementRecord<NodeUserData>>>(initialElements);
  const [links, setLinks] = useState<Record<string, LinkRecord>>(initialLinks);
  const [theme, setTheme] = useState<Theme>('default');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const elementDefaults = useElementDefaults<NodeUserData>({
    portStyle: {
      width: 15,
      height: 15,
      className: `
          cursor-crosshair hover:fill-blue-500
          forest:hover:fill-lime-300
          ocean:hover:fill-cyan-200
          sunset:hover:fill-orange-400
      `,
    },
});

  const linkDefaults = useLinkDefaults({
    targetMarker: 'arrow',
    labelStyle: {
      backgroundPadding: { x: 6, y: 4 },
    },
  });

  const renderElement: RenderElement<NodeUserData> = useCallback(
    (data) => <Node label={data.label} />,
    []
  );

  const selectTheme = useCallback((next: Theme) => {
    setTheme(next);
    const element = wrapperRef.current;
    if (element) {
      for (const t of themes) {
        if (t !== 'default') element.classList.toggle(t, t === next);
      }
    }
  }, []);

  return (
    <div ref={wrapperRef} className="tw-theme">
      <fieldset className="mb-3 flex gap-1 rounded-lg border border-slate-200 p-1 w-fit">
        {themes.map((t) => (
          <label
            key={t}
            className={`px-3 py-1 text-xs rounded-md cursor-pointer select-none transition-colors ${
              theme === t ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <input
              type="radio"
              name="theme"
              className="sr-only"
              checked={theme === t}
              onChange={() => selectTheme(t)}
            />
            {themeLabels[t]}
          </label>
        ))}
      </fieldset>
      <GraphProvider<NodeUserData>
        elements={elements}
        links={links}
        {...elementDefaults}
        {...linkDefaults}
        onElementsChange={setElements}
        onLinksChange={setLinks}
      >
        <Paper className={PAPER_CLASSNAME} height={240} renderElement={renderElement} />
      </GraphProvider>
    </div>
  );
}

export default function App() {
  return <Diagram />;
}
