import React, { useCallback, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { mvc } from '@joint/core';
import type { dia } from '@joint/core';
import { GraphProvider } from '../components/graph/graph-provider';
import { Paper } from '../components/paper/paper';
import { useCollection } from './use-collection';
import { useCell } from './use-cell';
import { useMarkup } from './use-markup';
import { usePaperEvents } from './use-paper-events';
import { ELEMENT_MODEL_TYPE } from '../models/element-model';
import type { Computed, ElementRecord } from '../types/cell.types';

// ── JointJS+ palette ────────────────────────────────────────────────────────
const JJS = {
  bg: '#131E29',
  panel: '#192531',
  panelHi: '#1F2C39',
  hairline: '#2A3845',
  ink: '#DDE6ED',
  inkDim: '#7B8A98',
  inkMute: '#566373',
  primary: '#ED2637',
  primaryGlow: '#F2545F',
  secondary: '#FF9505',
  teal: '#4ECDC4',
  amber: '#F5C518',
  lavender: '#B59CFF',
};

const SANS_FONT = '"Ppfraktionsans", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO_FONT = 'ui-monospace, "JetBrains Mono", "SF Mono", "Menlo", monospace';

interface CellHue {
  readonly fill: string;
  readonly stroke: string;
  readonly tag: string;
}

const CELL_HUES: readonly CellHue[] = [
  { fill: JJS.primary, stroke: JJS.primaryGlow, tag: 'primary' },
  { fill: JJS.secondary, stroke: '#FFB347', tag: 'secondary' },
  { fill: JJS.teal, stroke: '#7FE0D8', tag: 'teal' },
  { fill: JJS.amber, stroke: '#FFE07A', tag: 'amber' },
  { fill: JJS.lavender, stroke: '#D2C2FF', tag: 'lavender' },
];

interface ShapeData {
  readonly color: CellHue;
  readonly label: string;
}

type ShapeRecord = ElementRecord<ShapeData>;
type ComputedShapeRecord = Computed<ShapeRecord>;

const LABELS = ['Source', 'Filter', 'Branch', 'Merge', 'Sink'] as const;

const SEED_CELLS: readonly ShapeRecord[] = CELL_HUES.map((color, index) => ({
  id: `n-${index}`,
  type: ELEMENT_MODEL_TYPE,
  position: { x: 50 + index * 140, y: 60 + (index % 2 === 0 ? 0 : 100) },
  size: { width: 120, height: 70 },
  data: { color, label: LABELS[index] ?? 'Node' },
}));

const PAPER_ID = 'use-collection-watchlist-demo';

// ── Rendered element ────────────────────────────────────────────────────────
function selectShapeData(cell: ComputedShapeRecord): ShapeData {
  return cell.data;
}
function selectShapeSize(cell: ComputedShapeRecord): {
  readonly width: number;
  readonly height: number;
} {
  return cell.size;
}

const SHAPE_G_STYLE: React.CSSProperties = { cursor: 'pointer' };

function RenderShape() {
  const { selectorRef } = useMarkup();
  const data = useCell<ComputedShapeRecord, ShapeData>(selectShapeData);
  const size = useCell<ComputedShapeRecord, { width: number; height: number }>(selectShapeSize);
  return (
    <g ref={selectorRef('body')} style={SHAPE_G_STYLE}>
      <rect
        x={0}
        y={0}
        width={size.width}
        height={size.height}
        fill={data.color.fill}
        stroke={data.color.stroke}
        strokeWidth={1.5}
        rx={6}
        ry={6}
      />
      <text x={14} y={24} fill={JJS.bg} fontFamily={SANS_FONT} fontSize={14} fontWeight={600}>
        {data.label}
      </text>
      <text
        x={14}
        y={size.height - 12}
        fill={JJS.bg}
        fillOpacity={0.65}
        fontFamily={MONO_FONT}
        fontSize={9.5}
        letterSpacing="0.14em"
        fontWeight={500}
      >
        {data.color.tag.toUpperCase()}
      </text>
    </g>
  );
}

// ── Right-panel: live watchlist ─────────────────────────────────────────────
interface WatchRowProps {
  readonly cell: ComputedShapeRecord;
  readonly onRemove: (id: dia.Cell.ID) => void;
}

const ROW_ACCENT_STYLE_BASE: React.CSSProperties = { width: 4, alignSelf: 'stretch' };
const ROW_CONTENT_STYLE: React.CSSProperties = {
  flex: 1,
  padding: '12px 4px 12px 14px',
  minWidth: 0,
};

function WatchRow({ cell, onRemove }: Readonly<WatchRowProps>) {
  const { color, label } = cell.data;
  const { x, y } = cell.position;
  const { width, height } = cell.size;
  const handleRemove = useCallback(() => {
    onRemove(cell.id);
  }, [cell.id, onRemove]);
  const accentStyle: React.CSSProperties = useMemo(
    () => ({ ...ROW_ACCENT_STYLE_BASE, background: color.fill }),
    [color.fill]
  );
  return (
    <li style={ROW_STYLE}>
      <div style={accentStyle} />
      <div style={ROW_CONTENT_STYLE}>
        <div style={ROW_HEAD_STYLE}>
          <span style={ROW_LABEL_STYLE}>{label}</span>
          <span style={ROW_ID_STYLE}>#{String(cell.id)}</span>
        </div>
        <div style={ROW_METRIC_GRID}>
          <Metric label="x" value={x} />
          <Metric label="y" value={y} />
          <Metric label="w" value={width} />
          <Metric label="h" value={height} />
        </div>
      </div>
      <button
        type="button"
        onClick={handleRemove}
        style={ROW_REMOVE_BTN_STYLE}
        aria-label="Remove from watchlist"
      >
        ×
      </button>
    </li>
  );
}

interface MetricProps {
  readonly label: string;
  readonly value: number;
}

function Metric({ label, value }: Readonly<MetricProps>) {
  return (
    <div style={METRIC_STYLE}>
      <span style={METRIC_LABEL_STYLE}>{label}</span>
      <span style={METRIC_VALUE_STYLE}>{Math.round(value)}</span>
    </div>
  );
}

// ── Top-level demo ──────────────────────────────────────────────────────────
function totalArea(cells: readonly ComputedShapeRecord[]): number {
  let sum = 0;
  for (const cell of cells) {
    sum += cell.size.width * cell.size.height;
  }
  return sum;
}

function Watchlist() {
  const watchlist = useMemo<mvc.Collection<dia.Cell>>(() => new mvc.Collection<dia.Cell>([]), []);

  const [cells, setCells] = useCollection<ComputedShapeRecord>(watchlist);
  const [area] = useCollection<ComputedShapeRecord, number>(watchlist, totalArea);

  const paperEventHandlers = useMemo(
    () => ({
      'element:pointerclick': (view: dia.ElementView) => {
        const cell = view.model;
        if (watchlist.get(cell.id)) {
          watchlist.remove(cell);
        } else {
          watchlist.add(cell);
        }
      },
    }),
    [watchlist]
  );

  usePaperEvents(PAPER_ID, paperEventHandlers, [watchlist]);

  const onRemove = useCallback(
    (id: dia.Cell.ID) => {
      const cell = watchlist.get(id);
      if (cell) watchlist.remove(cell);
    },
    [watchlist]
  );

  const shuffle = useCallback(() => {
    if (cells.length === 0) return;
    setCells(
      cells.map((cell) => ({
        ...cell,
        position: {
          // eslint-disable-next-line sonarjs/pseudo-random
          x: Math.round(40 + Math.random() * 540),
          // eslint-disable-next-line sonarjs/pseudo-random
          y: Math.round(40 + Math.random() * 200),
        },
      }))
    );
  }, [cells, setCells]);

  const resizeRandom = useCallback(() => {
    if (cells.length === 0) return;
    setCells(
      cells.map((cell) => ({
        ...cell,
        size: {
          // eslint-disable-next-line sonarjs/pseudo-random
          width: 80 + Math.floor(Math.random() * 100),
          // eslint-disable-next-line sonarjs/pseudo-random
          height: 50 + Math.floor(Math.random() * 60),
        },
      }))
    );
  }, [cells, setCells]);

  const clear = useCallback(() => setCells([]), [setCells]);

  const disabled = cells.length === 0;

  return (
    <section style={STAGE_STYLE}>
      <header style={HEADER_STYLE}>
        <div style={EYEBROW_TAG_STYLE}>
          <span style={EYEBROW_DOT_STYLE} />
          <span>@joint/react · useCollection</span>
        </div>
        <h1 style={HEADING_STYLE}>
          Subscribe to any <span style={HEADING_PRIMARY_STYLE}>mvc.Collection</span> of cells —{' '}
          <em style={HEADING_EM_STYLE}>reactively</em>.
        </h1>
        <p style={SUBHEAD_STYLE}>
          Click a shape to toggle it on the watchlist. Drag a watched shape — coordinates update
          live in the panel. The setter accepts full records, so
          <span style={INLINE_CODE}> Shuffle</span> and <span style={INLINE_CODE}>Resize</span> also
          flow through <span style={INLINE_CODE}>useCollection</span>.
        </p>
      </header>

      <div style={CANVAS_PANEL_GRID}>
        <div style={PAPER_FRAME_STYLE}>
          <div style={PAPER_TOOLBAR_STYLE}>
            <span style={TOOLBAR_LABEL_STYLE}>Canvas</span>
            <span style={TOOLBAR_HINT_STYLE}>click to watch · drag to move</span>
          </div>
          <Paper id={PAPER_ID} width="100%" height={360} renderElement={RenderShape} />
        </div>

        <aside style={SIDE_PANEL_STYLE}>
          <div style={SIDE_HEAD_STYLE}>
            <span style={EYEBROW_STYLE}>Watchlist</span>
            <span style={COUNT_BADGE_STYLE}>
              <span style={COUNT_NUM_STYLE}>{String(cells.length).padStart(2, '0')}</span>
              <span style={COUNT_MAX_STYLE}> / 05</span>
            </span>
          </div>

          {cells.length === 0 ? (
            <div style={EMPTY_STYLE}>
              <span style={EMPTY_HEAD_STYLE}>Nothing watched yet.</span>
              <span style={EMPTY_HINT_STYLE}>← click any shape on the canvas</span>
            </div>
          ) : (
            <ul style={ROW_LIST_STYLE}>
              {cells.map((cell) => (
                <WatchRow key={String(cell.id)} cell={cell} onRemove={onRemove} />
              ))}
            </ul>
          )}

          <div style={SIDE_FOOTER_STYLE}>
            <div style={STAT_STYLE}>
              <span style={EYEBROW_STYLE}>Σ area</span>
              <span style={STAT_VALUE_STYLE}>
                {area.toLocaleString('en-US')}
                <span style={STAT_UNIT_STYLE}>px²</span>
              </span>
            </div>
            <div style={BUTTON_ROW_STYLE}>
              <button type="button" onClick={shuffle} style={BTN_PRIMARY_STYLE} disabled={disabled}>
                Shuffle
              </button>
              <button type="button" onClick={resizeRandom} style={BTN_STYLE} disabled={disabled}>
                Resize
              </button>
              <button type="button" onClick={clear} style={BTN_GHOST_STYLE} disabled={disabled}>
                Clear
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Demo() {
  return (
    <GraphProvider initialCells={SEED_CELLS}>
      <Watchlist />
    </GraphProvider>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const STAGE_STYLE: React.CSSProperties = {
  background: JJS.bg,
  color: JJS.ink,
  padding: '40px 44px 44px',
  minHeight: 540,
  fontFamily: SANS_FONT,
  letterSpacing: '0.005em',
};

const HEADER_STYLE: React.CSSProperties = {
  marginBottom: 28,
  maxWidth: 720,
};

const EYEBROW_TAG_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 10px',
  border: `1px solid ${JJS.hairline}`,
  background: JJS.panel,
  color: JJS.inkDim,
  fontFamily: MONO_FONT,
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 14,
};

const EYEBROW_DOT_STYLE: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: JJS.primary,
};

const HEADING_STYLE: React.CSSProperties = {
  margin: 0,
  fontFamily: SANS_FONT,
  fontWeight: 600,
  fontSize: 'clamp(24px, 3vw, 36px)',
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  color: JJS.ink,
};

const HEADING_PRIMARY_STYLE: React.CSSProperties = { color: JJS.primary };

const HEADING_EM_STYLE: React.CSSProperties = {
  fontStyle: 'italic',
  color: JJS.secondary,
  fontWeight: 500,
};

const SUBHEAD_STYLE: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  fontFamily: SANS_FONT,
  fontSize: 14.5,
  lineHeight: 1.6,
  color: JJS.inkDim,
  maxWidth: 640,
};

const INLINE_CODE: React.CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 12.5,
  color: JJS.ink,
  background: JJS.panelHi,
  padding: '1px 6px',
  borderRadius: 3,
};

const CANVAS_PANEL_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 1fr)',
  gap: 24,
  alignItems: 'stretch',
};

const PAPER_FRAME_STYLE: React.CSSProperties = {
  position: 'relative',
  border: `1px solid ${JJS.hairline}`,
  background: JJS.panel,
  display: 'flex',
  flexDirection: 'column',
};

const PAPER_TOOLBAR_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderBottom: `1px solid ${JJS.hairline}`,
  background: JJS.panelHi,
};

const TOOLBAR_LABEL_STYLE: React.CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 10.5,
  letterSpacing: '0.18em',
  color: JJS.inkDim,
  textTransform: 'uppercase',
};

const TOOLBAR_HINT_STYLE: React.CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 10.5,
  color: JJS.inkMute,
  letterSpacing: '0.04em',
};

const SIDE_PANEL_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: JJS.panel,
  border: `1px solid ${JJS.hairline}`,
  minHeight: 360,
};

const SIDE_HEAD_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: '16px 18px',
  borderBottom: `1px solid ${JJS.hairline}`,
  background: JJS.panelHi,
};

const EYEBROW_STYLE: React.CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 10.5,
  letterSpacing: '0.18em',
  color: JJS.inkDim,
  textTransform: 'uppercase',
};

const COUNT_BADGE_STYLE: React.CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 17,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
};

const COUNT_NUM_STYLE: React.CSSProperties = {
  color: JJS.primary,
  fontVariantNumeric: 'tabular-nums',
};

const COUNT_MAX_STYLE: React.CSSProperties = { color: JJS.inkMute };

const EMPTY_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: '36px 22px',
  color: JJS.ink,
  flex: 1,
};

const EMPTY_HEAD_STYLE: React.CSSProperties = {
  fontFamily: SANS_FONT,
  fontWeight: 600,
  fontSize: 16,
  color: JJS.ink,
};

const EMPTY_HINT_STYLE: React.CSSProperties = {
  color: JJS.inkDim,
  fontSize: 13,
  marginTop: 6,
  fontFamily: MONO_FONT,
};

const ROW_LIST_STYLE: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  flex: 1,
  overflowY: 'auto',
};

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  borderBottom: `1px solid ${JJS.hairline}`,
  background: 'transparent',
};

const ROW_HEAD_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: 8,
};

const ROW_LABEL_STYLE: React.CSSProperties = {
  fontFamily: SANS_FONT,
  fontWeight: 600,
  fontSize: 14,
  color: JJS.ink,
};

const ROW_ID_STYLE: React.CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 10,
  color: JJS.inkMute,
  letterSpacing: '0.08em',
};

const ROW_METRIC_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 0,
};

const METRIC_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  paddingRight: 6,
};

const METRIC_LABEL_STYLE: React.CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 9,
  letterSpacing: '0.14em',
  color: JJS.inkMute,
  textTransform: 'uppercase',
};

const METRIC_VALUE_STYLE: React.CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 12.5,
  color: JJS.ink,
  fontVariantNumeric: 'tabular-nums',
  marginTop: 2,
};

const ROW_REMOVE_BTN_STYLE: React.CSSProperties = {
  background: 'transparent',
  color: JJS.inkMute,
  border: 0,
  borderLeft: `1px solid ${JJS.hairline}`,
  width: 38,
  cursor: 'pointer',
  fontSize: 18,
  fontFamily: SANS_FONT,
};

const SIDE_FOOTER_STYLE: React.CSSProperties = {
  borderTop: `1px solid ${JJS.hairline}`,
  padding: '14px 18px 16px',
  background: JJS.panelHi,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const STAT_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
};

const STAT_VALUE_STYLE: React.CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 18,
  color: JJS.secondary,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.01em',
};

const STAT_UNIT_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: JJS.inkMute,
  marginLeft: 4,
};

const BUTTON_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const BTN_BASE: React.CSSProperties = {
  padding: '8px 14px',
  fontFamily: SANS_FONT,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  borderRadius: 4,
  border: '1px solid transparent',
};

const BTN_PRIMARY_STYLE: React.CSSProperties = {
  ...BTN_BASE,
  background: JJS.primary,
  color: JJS.ink,
  border: `1px solid ${JJS.primary}`,
};

const BTN_STYLE: React.CSSProperties = {
  ...BTN_BASE,
  background: 'transparent',
  color: JJS.ink,
  border: `1px solid ${JJS.hairline}`,
};

const BTN_GHOST_STYLE: React.CSSProperties = {
  ...BTN_BASE,
  background: 'transparent',
  color: JJS.inkDim,
};

const meta: Meta<typeof Demo> = {
  title: 'Hooks/useCollection',
  component: Demo,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {};
