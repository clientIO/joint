import { useEffect, useMemo, useState } from 'react';
import {
  GraphProvider, Paper, HTMLBox, useMarkup, useElementSize,
  type ElementRecord, type ElementPort, type LinkRecord, usePaper,
} from '@joint/react';
import {
  straightLinks, orthogonalLinks, curvedLinks,
  type StraightLinksOptions, type OrthogonalLinksOptions, type CurvedLinksOptions,
  type AnchorMode,
} from '../../../presets';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
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

const initialElements: Record<string, ElementRecord<NodeData>> = {
  a: {
    data: { label: 'Port A' },
    position: { x: 50, y: 50 },
    size: { width: 120, height: 60 },
    portMap: { out: PORT_OUT, error: PORT_ERROR },
  },
  b: {
    data: { label: 'Port B' },
    position: { x: 350, y: 80 },
    size: { width: 120, height: 60 },
    portMap: { in: PORT_IN, out: PORT_OUT },
  },
  c: {
    data: { label: 'Root A' },
    position: { x: 200, y: 220 },
    size: { width: 120, height: 60 },
  },
  d: {
    data: { label: 'Root B' },
    position: { x: 500, y: 250 },
    size: { width: 120, height: 60 },
  },
  e: {
    data: { label: 'Magnet A', type: 'svg' },
    position: { x: 80, y: 370 },
    size: { width: 140, height: 80 },
  },
  f: {
    data: { label: 'Magnet B', type: 'svg' },
    position: { x: 420, y: 400 },
    size: { width: 140, height: 80 },
  },
};

const initialLinks: Record<string, LinkRecord> = {
  'a-b': {
    source: { id: 'a', port: 'out' },
    target: { id: 'b', port: 'in' },
    style: { color: PRIMARY, targetMarker: 'arrow' },
  },
  'c-d': {
    source: { id: 'c' },
    target: { id: 'd' },
    style: { color: PRIMARY, targetMarker: 'arrow' },
  },
  'e-f': {
    source: { id: 'e', selector: 'connector' },
    target: { id: 'f', selector: 'connector' },
    style: { color: PRIMARY, targetMarker: 'arrow' },
  },
};

// ── Element renderers ───────────────────────────────────────────────────────

function RenderHTMLElement({ label }: Readonly<NodeData>) {
  return <HTMLBox useModelGeometry>{label}</HTMLBox>;
}

function RenderSVGElement({ label }: Readonly<NodeData>) {
  const { selectorRef } = useMarkup();
  const { width = 0, height = 0 } = useElementSize();
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
        ref={selectorRef('connector')}
        magnet="active"
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

type PresetName = 'straight' | 'orthogonal' | 'curved';

function buildPreset(
  name: PresetName,
  mode: AnchorMode,
  sourceOffset: number,
  targetOffset: number,
  cornerType: OrthogonalLinksOptions['cornerType'],
  cornerRadius: number,
  straightWhenDisconnected: boolean,
) {
  const base = { mode, sourceOffset, targetOffset };
  switch (name) {
    case 'straight': return straightLinks({ sourceOffset, targetOffset } satisfies StraightLinksOptions);
    case 'orthogonal': return orthogonalLinks({ ...base, cornerType, cornerRadius, straightWhenDisconnected } satisfies OrthogonalLinksOptions);
    case 'curved': return curvedLinks({ ...base, straightWhenDisconnected } satisfies CurvedLinksOptions);
  }
}

// ── Controls ────────────────────────────────────────────────────────────────

const PRESET_NAMES: PresetName[] = ['straight', 'orthogonal', 'curved'];
const ANCHOR_MODES: AnchorMode[] = ['auto', 'horizontal', 'vertical', 'prefer-horizontal', 'prefer-vertical'];
const CORNER_TYPES: NonNullable<OrthogonalLinksOptions['cornerType']>[] = ['cubic', 'line', 'point', 'gap'];

function PresetPicker() {
  const [preset, setPreset] = useState<PresetName>('curved');
  const [anchorMode, setAnchorMode] = useState<AnchorMode>('horizontal');
  const [sourceOffset, setSourceOffset] = useState(0);
  const [targetOffset, setTargetOffset] = useState(0);
  const [cornerType, setCornerType] = useState<OrthogonalLinksOptions['cornerType']>('cubic');
  const [cornerRadius, setCornerRadius] = useState(8);
  const [straightWhenDisconnected, setDirectWhileDragging] = useState(true);

  const { paper } = usePaper('main-paper');
  const linkPreset = useMemo(
    () => buildPreset(preset, anchorMode, sourceOffset, targetOffset, cornerType, cornerRadius, straightWhenDisconnected),
    [preset, anchorMode, sourceOffset, targetOffset, cornerType, cornerRadius, straightWhenDisconnected]
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
                value={anchorMode}
                onChange={(event) => setAnchorMode(event.target.value as AnchorMode)}
              >
                {ANCHOR_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
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
                onChange={(event) => setDirectWhileDragging(event.target.checked)}
              />
              <span className="text-xs">straight when disconnected</span>
            </label>
          )}
        </div>

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
                  onChange={(event) => setCornerType(event.target.value as OrthogonalLinksOptions['cornerType'])}
                >
                  {CORNER_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
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
      <GraphProvider elements={initialElements} links={initialLinks}>
        <PresetPicker />
      </GraphProvider>
    </div>
  );
}
