/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */

import { useState, useCallback, useRef } from 'react';
import { type CellRecord, GraphProvider, Paper, selectElementSize, useCell, linkMarkerArrow } from '@joint/react';
import { PAPER_CLASSNAME as DEFAULT_PAPER_CLASSNAME } from 'storybook-config/theme';

interface NodeUserData {
  readonly [key: string]: unknown;
  label: string;
}

const PORT_STYLE = {
  width: 15,
  height: 15,
  className: `
    stroke-2

    hover:fill-blue-500
    forest:hover:fill-lime-300
    ocean:hover:fill-cyan-200
    sunset:hover:fill-orange-400

    stroke-white
    forest:stroke-emerald-950
    ocean:stroke-sky-950
    sunset:stroke-amber-50

    fill-slate-400
    forest:fill-emerald-400
    ocean:fill-sky-400
    sunset:fill-amber-600
  `,
  labelClassName: `
    fill-slate-500
    forest:fill-emerald-400
    ocean:fill-sky-400
    sunset:fill-amber-600
  `
} as const;

const ELEMENT_SIZE = { width: 120, height: 50 };

const DEFAULT_LINK = {
  style: {
    targetMarker: linkMarkerArrow({
      className: `
        stroke-slate-400
        forest:stroke-emerald-600
        ocean:stroke-sky-400
        sunset:stroke-amber-500
        fill-slate-400
        forest:fill-emerald-600
        ocean:fill-sky-400
        sunset:fill-amber-500
      `
    }),
    className: `
      stroke-slate-400
      forest:stroke-emerald-600
      ocean:stroke-sky-400
      sunset:stroke-amber-500
    `
  },
  labelStyle: {
    backgroundPadding: { horizontal: 6, vertical: 4 },
    className: `
      fill-slate-700
      forest:fill-emerald-50
      ocean:fill-sky-100
      sunset:fill-amber-900
      font-sans
    `,
    backgroundClassName: `
      fill-white
      forest:fill-emerald-900
      ocean:fill-sky-900
      sunset:fill-amber-50

      stroke-slate-300
      forest:stroke-emerald-700
      ocean:stroke-sky-600
      sunset:stroke-amber-400
    `
  }
} as const;

const initialCells: ReadonlyArray<CellRecord<NodeUserData>> = [
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
  },
  {
    id: 'c→d',
    type: 'link',
    source: { id: 'c', port: 'out' },
    target: { id: 'd', port: 'in' },
    style: { color: '#e11d48', targetMarker: 'arrow' },
  },
];

function Node({ label }: Readonly<NodeUserData>) {
  const { width, height } = useCell(selectElementSize);

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

const PAPER_CLASSNAME = DEFAULT_PAPER_CLASSNAME + `
  bg-white
  forest:bg-emerald-950
  ocean:bg-sky-950
  sunset:bg-amber-100
`;

function Diagram() {
  const [cells, setCells] = useState<ReadonlyArray<CellRecord<NodeUserData>>>(initialCells);
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
    <div ref={wrapperRef}>
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
      <GraphProvider cells={cells} onCellsChange={setCells}>
        <Paper style={{ height: 240 }}
          className={PAPER_CLASSNAME}
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
