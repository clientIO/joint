/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useEffect, useMemo, useState } from 'react';
import { type CellRecord, GraphProvider, useCell, Paper, HTMLBox, useMarkup, type ElementPort, type LinkRecord, usePaper, selectElementSize } from '@joint/react';
import { linkRoutingStraight, linkRoutingOrthogonal, linkRoutingSmooth, type LinkRoutingStraightOptions, type LinkRoutingOrthogonalOptions, type LinkRoutingSmoothOptions, type LinkMode } from '@joint/react/presets';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';
import type { dia } from '@joint/core';

// ── Data ────────────────────────────────────────────────────────────────────

interface NodeData {
  readonly label: string;
  readonly type?: 'svg';
  readonly [key: string]: unknown;
}

const PORT_OUT: ElementPort = { cx: 'calc(w)', cy: 'calc(h/2)', width: 16, height: 16 };
const PORT_IN: ElementPort = { cx: 0, cy: 'calc(h/2)', passive: true, width: 16, height: 16 };
const PORT_ERROR: ElementPort = { cx: 'calc(w/2)', cy: 'calc(h)', width: 16, height: 16 };
const DEFAULT_LINK_STYLE: LinkRecord['style'] = { color: PRIMARY, targetMarker: 'arrow' };

const initialCells: ReadonlyArray<CellRecord<NodeData>> = [
  {
    id: 'a',
    type: 'element',
    data: { label: 'Port A' },
    position: { x: 50, y: 50 },
    size: { width: 120, height: 60 },
    portMap: { out: PORT_OUT, error: PORT_ERROR },
  },
  {
    id: 'b',
    type: 'element',
    data: { label: 'Port B' },
    position: { x: 350, y: 80 },
    size: { width: 120, height: 60 },
    portMap: { in: PORT_IN, out: PORT_OUT },
  },
  {
    id: 'c',
    type: 'element',
    data: { label: 'Root A' },
    position: { x: 200, y: 220 },
    size: { width: 120, height: 60 },
  },
  {
    id: 'd',
    type: 'element',
    data: { label: 'Root B' },
    position: { x: 500, y: 250 },
    size: { width: 120, height: 60 },
  },
  {
    id: 'e',
    type: 'element',
    data: { label: 'Magnet A', type: 'svg' },
    position: { x: 80, y: 370 },
    size: { width: 140, height: 80 },
  },
  {
    id: 'f',
    type: 'element',
    data: { label: 'Magnet B', type: 'svg' },
    position: { x: 420, y: 400 },
    size: { width: 140, height: 80 },
  },
  {
    id: 'a-b',
    type: 'link',
    style: DEFAULT_LINK_STYLE,
    source: { id: 'a', port: 'out' },
    target: { id: 'b', port: 'in' },
  },
  {
    id: 'c-d',
    type: 'link',
    style: DEFAULT_LINK_STYLE,
    source: { id: 'c' },
    target: { id: 'd' },
  },
  {
    id: 'e-f',
    type: 'link',
    style: DEFAULT_LINK_STYLE,
    source: { id: 'e', selector: 'connector' },
    target: { id: 'f', selector: 'connector' },
  },
];

// ── Element renderers ───────────────────────────────────────────────────────

function RenderHTMLElement({ label }: Readonly<NodeData>) {
  return <HTMLBox useModelGeometry>{label}</HTMLBox>;
}

function RenderSVGElement({ label }: Readonly<NodeData>) {
  const { magnetRef } = useMarkup();
  const { width, height } = useCell(selectElementSize);
  return (
    <>
      <rect
        width={width}
        height={height}
        rx={6}
        ry={6}
        fill="#1e293b"
        stroke="#475569"
        strokeWidth={1.5}
      />
      <text
        x={width / 2}
        y={(height - 40) / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#e2e8f0"
        fontSize={13}
        fontFamily="sans-serif"
        fontWeight={500}
      >
        {label}
      </text>
      <rect
        ref={magnetRef('connector')}
        x={2}
        y={height - 40}
        width={width - 4}
        height={30}
        rx={4}
        ry={4}
        fill={PRIMARY}
        stroke="#1e293b"
        strokeWidth={2}
        cursor="crosshair"
      />
    </>
  );
}

function RenderElement(data: Readonly<NodeData>) {
  if (data.type === 'svg') return <RenderSVGElement {...data} />;
  return <RenderHTMLElement {...data} />;
}

// ── Preset builder ──────────────────────────────────────────────────────────

type PresetName = 'straight' | 'orthogonal' | 'smooth';

function buildPreset(
  name: PresetName,
  mode: LinkMode,
  sourceOffset: number,
  targetOffset: number,
  cornerType: LinkRoutingOrthogonalOptions['cornerType'],
  cornerRadius: number,
  straightWhenDisconnected: boolean,
  perpendicular: boolean
) {
  const base = { mode, sourceOffset, targetOffset };
  switch (name) {
    case 'straight': {
      return linkRoutingStraight({
        sourceOffset,
        targetOffset,
        perpendicular,
      } satisfies LinkRoutingStraightOptions);
    }
    case 'orthogonal': {
      return linkRoutingOrthogonal({
        ...base,
        cornerType,
        cornerRadius,
        straightWhenDisconnected,
      } satisfies LinkRoutingOrthogonalOptions);
    }
    case 'smooth': {
      return linkRoutingSmooth({
        ...base,
        straightWhenDisconnected,
      } satisfies LinkRoutingSmoothOptions);
    }
  }
}

// ── Controls ────────────────────────────────────────────────────────────────

const PRESET_NAMES: PresetName[] = ['straight', 'orthogonal', 'smooth'];
const ANCHOR_MODES: LinkMode[] = [
  'auto',
  'horizontal',
  'vertical',
  'prefer-horizontal',
  'prefer-vertical',
  'top-bottom',
  'bottom-top',
  'left-right',
  'right-left',
];
const CORNER_TYPES: Array<NonNullable<LinkRoutingOrthogonalOptions['cornerType']>> = [
  'cubic',
  'line',
  'point',
  'gap',
];

function createLink() {
  return { style: DEFAULT_LINK_STYLE };
}

function PresetPicker() {
  const [preset, setPreset] = useState<PresetName>('smooth');
  const [linkMode, setLinkMode] = useState<LinkMode>('horizontal');
  const [sourceOffset, setSourceOffset] = useState(0);
  const [targetOffset, setTargetOffset] = useState(0);
  const [cornerType, setCornerType] = useState<LinkRoutingOrthogonalOptions['cornerType']>('cubic');
  const [cornerRadius, setCornerRadius] = useState(8);
  const [straightWhenDisconnected, setStraightWhenDisconnected] = useState(true);
  const [perpendicular, setPerpendicular] = useState(false);

  const { paper } = usePaper('main-paper');
  const linkPreset = useMemo(
    () =>
      buildPreset(
        preset,
        linkMode,
        sourceOffset,
        targetOffset,
        cornerType,
        cornerRadius,
        straightWhenDisconnected,
        perpendicular
      ),
    [
      preset,
      linkMode,
      sourceOffset,
      targetOffset,
      cornerType,
      cornerRadius,
      straightWhenDisconnected,
      perpendicular,
    ]
  );

  useEffect(() => {
    for (const link of paper?.model.getLinks() ?? []) {
      const linkView = paper?.findViewByModel(link) as dia.LinkView | null;
      if (linkView) {
        linkView.requestConnectionUpdate();
      }
    }
  }, [linkPreset, paper]);

  return (
    <>
      <Paper
        id="main-paper"
        className={PAPER_CLASSNAME}
        height={500}
        renderElement={RenderElement}
        gridSize={1}
        drawGridSize={20}
        defaultLink={createLink}
        {...linkPreset}
      />
      <div className="flex flex-wrap items-center gap-4 px-3 py-2 mt-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-sans select-none">
        {/* Preset selector */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Preset</span>
          <div className="flex rounded-md overflow-hidden border border-slate-300">
            {PRESET_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  preset === name
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setPreset(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-5 bg-slate-300" />

        {/* Shared options */}
        <div className="flex items-center gap-3">
          {preset !== 'straight' && (
            <label className="flex items-center gap-1.5 text-slate-600">
              <span className="text-xs">mode</span>
              <select
                className="px-1.5 py-0.5 text-xs rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={linkMode}
                onChange={(event) => setLinkMode(event.target.value as LinkMode)}
              >
                {ANCHOR_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-1.5 text-slate-600">
            <span className="text-xs">srcOffset</span>
            <input
              type="number"
              className="w-14 px-1.5 py-0.5 text-xs rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={sourceOffset}
              onChange={(event) => setSourceOffset(Number(event.target.value))}
            />
          </label>
          <label className="flex items-center gap-1.5 text-slate-600">
            <span className="text-xs">tgtOffset</span>
            <input
              type="number"
              className="w-14 px-1.5 py-0.5 text-xs rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={targetOffset}
              onChange={(event) => setTargetOffset(Number(event.target.value))}
            />
          </label>
          {preset !== 'straight' && (
            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="accent-indigo-500"
                checked={straightWhenDisconnected}
                onChange={(event) => setStraightWhenDisconnected(event.target.checked)}
              />
              <span className="text-xs">straight when disconnected</span>
            </label>
          )}
        </div>

        {/* Straight-specific options */}
        {preset === 'straight' && (
          <>
            <div className="w-px h-5 bg-slate-300" />
            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="accent-indigo-500"
                checked={perpendicular}
                onChange={(event) => setPerpendicular(event.target.checked)}
              />
              <span className="text-xs">perpendicular</span>
            </label>
          </>
        )}

        {/* Orthogonal-specific options */}
        {preset === 'orthogonal' && (
          <>
            <div className="w-px h-5 bg-slate-300" />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-slate-600">
                <span className="text-xs">corner</span>
                <select
                  className="px-1.5 py-0.5 text-xs rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={cornerType}
                  onChange={(event) =>
                    setCornerType(event.target.value as LinkRoutingOrthogonalOptions['cornerType'])
                  }
                >
                  {CORNER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-slate-600">
                <span className="text-xs">radius</span>
                <input
                  type="number"
                  className="w-14 px-1.5 py-0.5 text-xs rounded border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={cornerRadius}
                  onChange={(event) => setCornerRadius(Number(event.target.value))}
                />
              </label>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <div>
      <GraphProvider initialCells={initialCells}>
        <PresetPicker />
      </GraphProvider>
    </div>
  );
}
