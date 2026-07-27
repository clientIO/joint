import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type MouseEvent } from 'react';
import {
  GraphProvider,
  Paper,
  HTMLBox,
  useCell,
  useMarkup,
  usePaper,
  selectElementSize,
  linkRoutingStraight,
  linkRoutingOrthogonal,
  linkRoutingSmooth,
  type CellRecord,
  type ElementPort,
  type LinkRecord,
  type LinkRoutingStraightOptions,
  type LinkRoutingOrthogonalOptions,
  type LinkRoutingSmoothOptions,
  type LinkMode,
} from '@joint/react';
import type { dia } from '@joint/core';

// Colors — unified dark diagram palette.
const PRIMARY = '#ED2637';
const NODE_FILL = '#1c2836';
const NODE_STROKE = '#3c4f63';
const TEXT_COLOR = '#DDE6ED';

// ── Data ────────────────────────────────────────────────────────────────────

interface NodeData {
  readonly label: string;
  readonly type?: 'svg';
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
  return (
    <HTMLBox useModelGeometry className="jj-node">
      {label}
    </HTMLBox>
  );
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
        fill={NODE_FILL}
        stroke={NODE_STROKE}
        strokeWidth={1.5}
      />
      <text
        x={width / 2}
        y={(height - 40) / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={TEXT_COLOR}
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
        stroke={NODE_FILL}
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

  // Changing the routing preset rewrites the paper options but does not re-route
  // links that are already drawn, so request an explicit connection update.
  useEffect(() => {
    for (const link of paper?.model.getLinks() ?? []) {
      const linkView = paper?.findViewByModel(link) as dia.LinkView | null;
      linkView?.requestConnectionUpdate();
    }
  }, [linkPreset, paper]);

  const handlePreset = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setPreset(event.currentTarget.value as PresetName);
  }, []);
  const handleMode = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setLinkMode(event.target.value as LinkMode);
  }, []);
  const handleSourceOffset = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSourceOffset(Number(event.target.value));
  }, []);
  const handleTargetOffset = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setTargetOffset(Number(event.target.value));
  }, []);
  const handleStraightWhenDisconnected = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setStraightWhenDisconnected(event.target.checked);
  }, []);
  const handlePerpendicular = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPerpendicular(event.target.checked);
  }, []);
  const handleCornerType = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setCornerType(event.target.value as LinkRoutingOrthogonalOptions['cornerType']);
  }, []);
  const handleCornerRadius = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCornerRadius(Number(event.target.value));
  }, []);

  return (
    <div className="flex size-full flex-col">
      <div className="jj-controls m-3">
        <div className="jj-field">
          <span className="jj-label">Preset</span>
          {PRESET_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              value={name}
              className={`jj-btn jj-btn--sm${preset === name ? ' jj-btn--primary' : ''}`}
              onClick={handlePreset}
            >
              {name}
            </button>
          ))}
        </div>

        {preset !== 'straight' && (
          <label className="jj-field">
            <span className="jj-label">Mode</span>
            <select className="jj-select" value={linkMode} onChange={handleMode}>
              {ANCHOR_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="jj-field">
          <span className="jj-label">Source offset</span>
          <input
            className="jj-input w-16"
            type="number"
            value={sourceOffset}
            onChange={handleSourceOffset}
          />
        </label>
        <label className="jj-field">
          <span className="jj-label">Target offset</span>
          <input
            className="jj-input w-16"
            type="number"
            value={targetOffset}
            onChange={handleTargetOffset}
          />
        </label>

        {preset !== 'straight' && (
          <label className="jj-field">
            <input
              type="checkbox"
              checked={straightWhenDisconnected}
              onChange={handleStraightWhenDisconnected}
            />
            <span className="jj-label">Straight when disconnected</span>
          </label>
        )}

        {preset === 'straight' && (
          <label className="jj-field">
            <input type="checkbox" checked={perpendicular} onChange={handlePerpendicular} />
            <span className="jj-label">Perpendicular</span>
          </label>
        )}

        {preset === 'orthogonal' && (
          <>
            <label className="jj-field">
              <span className="jj-label">Corner</span>
              <select className="jj-select" value={cornerType} onChange={handleCornerType}>
                {CORNER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="jj-field">
              <span className="jj-label">Radius</span>
              <input
                className="jj-input w-16"
                type="number"
                value={cornerRadius}
                onChange={handleCornerRadius}
              />
            </label>
          </>
        )}
      </div>
      <Paper
        id="main-paper"
        className="min-h-0 flex-1"
        renderElement={RenderElement}
        defaultLink={createLink}
        linkRouting={linkPreset}
      />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <PresetPicker />
    </GraphProvider>
  );
}
