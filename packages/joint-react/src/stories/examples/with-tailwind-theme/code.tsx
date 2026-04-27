
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import { useState, useCallback, useRef } from 'react';
import {
  GraphProvider,
  Paper,
  selectElementSize,
  useElement,
  type Cells,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

// Base theme + Tailwind preset (maps --jj-* → Tailwind v4 variables)
import '../../../css/theme.css';
import './tailwind-theme.css';

interface NodeUserData {
  readonly [key: string]: unknown;
  label: string;
}

const PORT_STYLE = {
  width: 15,
  height: 15,
  className: `
      cursor-crosshair hover:fill-blue-500
      forest:hover:fill-lime-300
      ocean:hover:fill-cyan-200
      sunset:hover:fill-orange-400
  `,
} as const;

const ELEMENT_SIZE = { width: 120, height: 50 };

const DEFAULT_LINK = {
  style: { targetMarker: 'arrow' },
} as const;

const initialCells: Cells<NodeUserData> = [
  {
    id: 'a',
    type: 'element',
    data: { label: 'Source' },
    position: { x: 50, y: 70 },
    size: ELEMENT_SIZE,
    portMap: {
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)', label: 'out' },
    },
    portStyle: PORT_STYLE,
  },
  {
    id: 'b',
    type: 'element',
    data: { label: 'Process' },
    position: { x: 290, y: 20 },
    size: ELEMENT_SIZE,
    portMap: {
      in: { cx: 0, cy: 'calc(0.5 * h)', label: 'in' },
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)', label: 'out' },
    },
    portStyle: PORT_STYLE,
  },
  {
    id: 'c',
    type: 'element',
    data: { label: 'Review' },
    position: { x: 290, y: 120 },
    size: ELEMENT_SIZE,
    portMap: {
      in: { cx: 0, cy: 'calc(0.5 * h)', label: 'in' },
      out: { cx: 'calc(w)', cy: 'calc(0.5 * h)', label: 'out' },
    },
    portStyle: PORT_STYLE,
  },
  {
    id: 'd',
    type: 'element',
    data: { label: 'Output' },
    position: { x: 550, y: 70 },
    size: ELEMENT_SIZE,
    portMap: {
      in: { cx: 0, cy: 'calc(0.5 * h)', label: 'in' },
    },
    portStyle: PORT_STYLE,
  },
  {
    id: 'a→b',
    type: 'link',
    source: { id: 'a', port: 'out' },
    target: { id: 'b', port: 'in' },
    ...DEFAULT_LINK,
  },
  {
    id: 'a→c',
    type: 'link',
    source: { id: 'a', port: 'out' },
    target: { id: 'c', port: 'in' },
    ...DEFAULT_LINK,
  },
  {
    id: 'b→d',
    type: 'link',
    source: { id: 'b', port: 'out' },
    target: { id: 'd', port: 'in' },
    labelMap: { info: { text: 'approved' } },
    ...DEFAULT_LINK,
    labelStyle: { backgroundPadding: { horizontal: 6, vertical: 4 } },
  },
  {
    id: 'c→d',
    type: 'link',
    source: { id: 'c', port: 'out' },
    target: { id: 'd', port: 'in' },
    style: { color: '#e11d48', targetMarker: 'arrow' },
  },
];

function Node({ label }: NodeUserData) {
  const { width, height } = useElement(selectElementSize);
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
  const [cells, setCells] = useState<Cells<NodeUserData>>(initialCells);
  const [theme, setTheme] = useState<Theme>('default');
  const wrapperRef = useRef<HTMLDivElement>(null);

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
      <GraphProvider<NodeUserData> cells={cells} onCellsChange={setCells}>
        <Paper
          className={PAPER_CLASSNAME}
          height={240}
          renderElement={Node}
          defaultLink={() => DEFAULT_LINK}
        />
      </GraphProvider>
    </div>
  );
}

export default function App() {
  return <Diagram />;
}
