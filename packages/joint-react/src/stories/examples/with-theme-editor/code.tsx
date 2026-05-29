/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import type { CSSProperties } from 'react';
import {
  type CellRecord,
  type ValidateEmbeddingContext,
  GraphProvider,
  Paper,
  HTMLBox,
  type LinkMarkerName,
  usePaperEvents,
  useGraph,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';

// ── Palette ───────────────────────────────────────────────────────────────────

interface PaletteColor {
  readonly name: string;
  readonly hex: string;
  /** CSS value to store when selected; falls back to hex when absent. */
  readonly value?: string;
}

interface PaletteGroup {
  readonly label: string;
  readonly colors: readonly PaletteColor[];
}

const PALETTE_GROUPS: readonly PaletteGroup[] = [
  {
    label: 'Tokens',
    colors: [
      { name: 'color-primary',       hex: '#293a49', value: 'var(--jj-color-primary)' },
      { name: 'color-surface',       hex: '#f5f6f8', value: 'var(--jj-color-surface)' },
      { name: 'color-shape-surface', hex: '#f0f4f7', value: 'var(--jj-color-shape-surface)' },
      { name: 'color-shape-border',  hex: '#8a9eb0', value: 'var(--jj-color-shape-border)' },
      { name: 'color-link',          hex: '#8a9eb0', value: 'var(--jj-color-link)' },
      { name: 'color-text',          hex: '#1a2733', value: 'var(--jj-color-text)' },
      { name: 'color-border',        hex: '#cfdbe4', value: 'var(--jj-color-border)' },
      { name: 'color-border-subtle', hex: '#eaf0f4', value: 'var(--jj-color-border-subtle)' },
      { name: 'color-tool',          hex: '#f5f6f8', value: 'var(--jj-color-tool)' },
      { name: 'color-tool-border',   hex: '#6f859b', value: 'var(--jj-color-tool-border)' },
    ],
  },
  {
    label: 'Light',
    colors: [
      { name: 'light-100', hex: '#f5f6f8' },
      { name: 'light-125', hex: '#f3f6f8' },
      { name: 'light-150', hex: '#f0f4f7' },
      { name: 'light-200', hex: '#eaf0f4' },
      { name: 'light-300', hex: '#e4ebf1' },
      { name: 'light-400', hex: '#dde6ed' },
      { name: 'light-500', hex: '#cfdbe4' },
      { name: 'light-600', hex: '#c1cfda' },
      { name: 'light-700', hex: '#a6b6c5' },
      { name: 'light-800', hex: '#8a9eb0' },
      { name: 'light-900', hex: '#6f859b' },
    ],
  },
  {
    label: 'Dark',
    colors: [
      { name: 'dark-900', hex: '#6f859b' },
      { name: 'dark-800', hex: '#566c81' },
      { name: 'dark-700', hex: '#425567' },
      { name: 'dark-600', hex: '#344351' },
      { name: 'dark-500', hex: '#293a49' },
      { name: 'dark-400', hex: '#253544' },
      { name: 'dark-300', hex: '#202f3e' },
      { name: 'dark-200', hex: '#1a2733' },
      { name: 'dark-100', hex: '#131e29' },
    ],
  },
  {
    label: 'Semantic',
    colors: [
      { name: 'success', hex: '#36a18b' },
      { name: 'destructive', hex: '#e03131' },
      { name: 'invalid', hex: '#868e96' },
    ],
  },
];

const PALETTE: readonly PaletteColor[] = PALETTE_GROUPS.flatMap((g) => g.colors);

function p(name: string): string {
  return PALETTE.find((c) => c.name === name)?.hex ?? name;
}

/** Returns the palette entry's stored CSS value (e.g. var(--jj-color-*) for tokens), falling back to hex. */
function pv(name: string): string {
  const color = PALETTE.find((c) => c.name === name);
  return color?.value ?? color?.hex ?? name;
}

// ── Theme definitions ─────────────────────────────────────────────────────────

type CSSVars = Record<string, string>;

const LIGHT_THEME: CSSVars = {
  // ── Tokens ──
  '--jj-color-primary':          p('dark-500'),
  '--jj-color-primary-contrast': p('light-100'),
  '--jj-color-surface':          p('light-100'),
  '--jj-color-shape-surface':    p('light-150'),
  '--jj-color-shape-border':     p('light-800'),
  '--jj-color-link':             p('light-800'),
  '--jj-color-tool':             p('light-100'),
  '--jj-color-tool-border':      p('light-900'),
  '--jj-color-text':             p('dark-200'),
  '--jj-color-border':           p('light-500'),
  '--jj-color-border-subtle':    p('light-200'),
  '--jj-color-success':          p('success'),
  '--jj-color-destructive':      p('destructive'),
  '--jj-color-valid':            p('dark-800'),
  '--jj-color-invalid':          p('invalid'),
  // ── Component ──
  '--jj-paper-color':        p('light-300'),
  '--jj-paper-grid-color':   p('light-700'),
  '--jj-link-color':         pv('color-link'),
  '--jj-link-width':         '1',
  '--jj-link-label-bg-color':     pv('color-surface'),
  '--jj-link-label-color':        pv('color-text'),
  '--jj-link-label-border-color': pv('color-link'),
  '--jj-port-color':         pv('color-surface'),
  '--jj-port-border-color':  pv('color-link'),
  '--jj-box-color':          pv('color-shape-surface'),
  '--jj-box-fg-color':     pv('color-text'),
  '--jj-box-border-color':   pv('color-shape-border'),
  '--jj-box-border-radius':  'var(--jj-radius-lg)',
};

const DARK_THEME: CSSVars = {
  // ── Tokens ──
  '--jj-color-primary':          p('light-700'),
  '--jj-color-primary-contrast': p('dark-100'),
  '--jj-color-surface':          p('dark-200'),
  '--jj-color-shape-surface':    p('dark-200'),
  '--jj-color-shape-border':     p('dark-600'),
  '--jj-color-link':             p('light-700'),
  '--jj-color-tool':             p('dark-300'),
  '--jj-color-tool-border':      p('dark-700'),
  '--jj-color-text':             p('light-100'),
  '--jj-color-border':           p('dark-400'),
  '--jj-color-border-subtle':    p('dark-300'),
  '--jj-color-success':          p('success'),
  '--jj-color-destructive':      p('destructive'),
  '--jj-color-valid':            p('dark-900'),
  '--jj-color-invalid':          p('invalid'),
  // ── Component ──
  '--jj-paper-color':        p('dark-100'),
  '--jj-paper-grid-color':   p('dark-400'),
  '--jj-link-color':         pv('color-link'),
  '--jj-link-width':         '1',
  '--jj-link-label-bg-color':     pv('color-surface'),
  '--jj-link-label-color':        pv('color-text'),
  '--jj-link-label-border-color': p('dark-600'),
  '--jj-port-color':                    p('light-100'),
  '--jj-port-border-color':             p('dark-900'),
  '--jj-port-available-color':         pv('color-primary'),
  '--jj-port-available-border-color':  pv('color-primary'),
  '--jj-port-label-color':             pv('color-text'),
  '--jj-box-color':          pv('color-shape-surface'),
  '--jj-box-fg-color':     pv('color-text'),
  '--jj-box-border-color':   pv('color-shape-border'),
  '--jj-box-border-radius':  'var(--jj-radius-lg)',
};

/** Default values mirroring styles.css :root — fallback when themeVars doesn't define a variable. */
const CSS_DEFAULTS: CSSVars = {
  // ── Tokens ──
  '--jj-color-primary':          p('dark-500'),
  '--jj-color-primary-contrast': p('light-100'),
  '--jj-color-surface':          p('light-100'),
  '--jj-color-shape-surface':    p('light-150'),
  '--jj-color-shape-border':     p('light-800'),
  '--jj-color-link':             p('light-800'),
  '--jj-color-tool':             p('light-100'),
  '--jj-color-tool-border':      p('light-900'),
  '--jj-color-text':             p('dark-200'),
  '--jj-color-border':           p('light-500'),
  '--jj-color-border-subtle':    p('light-200'),
  '--jj-color-success':          p('success'),
  '--jj-color-destructive':      p('destructive'),
  '--jj-color-valid':            p('dark-800'),
  '--jj-color-invalid':          p('invalid'),
  // ── Component ──
  '--jj-paper-color':           p('light-300'),
  '--jj-paper-grid-color':      p('light-700'),
  '--jj-paper-connecting-highlight-color': pv('color-primary'),
  '--jj-paper-embedding-highlight-color':  pv('color-primary'),
  '--jj-link-color':            pv('color-link'),
  '--jj-link-width':            '1',
  '--jj-link-dash':             'none',
  '--jj-link-line-cap':         'butt',
  '--jj-link-connecting-color': pv('color-primary'),
  '--jj-link-connecting-width':  '1.5',
  '--jj-link-connecting-dash':   '8 4',
  '--jj-link-label-bg-color':         pv('color-surface'),
  '--jj-link-label-color':            pv('color-text'),
  '--jj-link-label-font-size':        '11px',
  '--jj-link-label-font-family':      'Arial, sans-serif',
  '--jj-link-label-border-color':     pv('color-link'),
  '--jj-link-label-border-width':     '1px',
  '--jj-link-label-border-radius':    'var(--jj-radius-sm)',
  '--jj-port-color':             pv('color-surface'),
  '--jj-port-border-color':      pv('color-link'),
  '--jj-port-border-width':      '2px',
  '--jj-port-hover-color':       pv('color-shape-surface'),
  '--jj-port-hover-border-color': pv('color-link'),
  '--jj-port-hover-border-width': '4px',
  '--jj-port-available-color':        pv('color-primary'),
  '--jj-port-available-border-color': pv('color-primary'),
  '--jj-port-available-border-width': 'var(--jj-port-border-width)',
  '--jj-port-label-color':       pv('color-text'),
  '--jj-port-label-font-size':   '10px',
  '--jj-port-label-font-family': 'Arial, sans-serif',
  '--jj-box-color':                  pv('color-shape-surface'),
  '--jj-box-hover-border-color':     pv('color-primary'),
  '--jj-box-available-border-color': p('dark-800'),
  '--jj-box-fg-color':         pv('color-text'),
  '--jj-box-border-color':       pv('color-shape-border'),
  '--jj-box-border-width':       '1px',
  '--jj-box-border-radius':      'var(--jj-radius-lg)',
  '--jj-box-padding':            '8px 12px',
  '--jj-box-font-size':          '14px',
  '--jj-box-font-family':        'sans-serif',
};

// ── Form section metadata ─────────────────────────────────────────────────────

type VariableType = 'color' | 'number' | 'dimension' | 'cssvar';

interface CSVariableOption {
  readonly label: string;
  readonly value: string;
}

interface VariableDefinition {
  readonly name: string;
  readonly type: VariableType;
  readonly options?: readonly CSVariableOption[];
}

interface SectionDefinition {
  readonly title: string;
  readonly vars: readonly VariableDefinition[];
}

const RADIUS_OPTIONS: readonly CSVariableOption[] = [
  { label: 'sm · 2px', value: 'var(--jj-radius-sm)' },
  { label: 'md · 3px', value: 'var(--jj-radius-md)' },
  { label: 'lg · 4px', value: 'var(--jj-radius-lg)' },
];

const LINE_CAP_OPTIONS: readonly CSVariableOption[] = [
  { label: 'butt', value: 'butt' },
  { label: 'round', value: 'round' },
  { label: 'square', value: 'square' },
];

const SECTIONS: readonly SectionDefinition[] = [
  {
    title: 'Theme',
    vars: [
      { name: '--jj-color-primary',          type: 'color' },
      { name: '--jj-color-primary-contrast', type: 'color' },
      { name: '--jj-color-surface',          type: 'color' },
      { name: '--jj-color-shape-surface',    type: 'color' },
      { name: '--jj-color-shape-border',     type: 'color' },
      { name: '--jj-color-link',             type: 'color' },
      { name: '--jj-color-tool',             type: 'color' },
      { name: '--jj-color-tool-border',      type: 'color' },
      { name: '--jj-color-text',             type: 'color' },
      { name: '--jj-color-border',           type: 'color' },
      { name: '--jj-color-border-subtle',    type: 'color' },
      { name: '--jj-color-success',          type: 'color' },
      { name: '--jj-color-destructive',      type: 'color' },
      { name: '--jj-color-valid',            type: 'color' },
      { name: '--jj-color-invalid',          type: 'color' },
    ],
  },
  {
    title: 'Paper',
    vars: [
      { name: '--jj-paper-color',                      type: 'color' },
      { name: '--jj-paper-grid-color',                 type: 'color' },
      { name: '--jj-paper-connecting-highlight-color', type: 'color' },
      { name: '--jj-paper-embedding-highlight-color',  type: 'color' },
    ],
  },
  {
    title: 'Links',
    vars: [
      { name: '--jj-link-color',            type: 'color' },
      { name: '--jj-link-width',            type: 'number' },
      { name: '--jj-link-dash',             type: 'dimension' },
      { name: '--jj-link-line-cap',         type: 'cssvar', options: LINE_CAP_OPTIONS },
      { name: '--jj-link-connecting-color', type: 'color' },
      { name: '--jj-link-connecting-width', type: 'number' },
      { name: '--jj-link-connecting-dash',  type: 'dimension' },
    ],
  },
  {
    title: 'Labels',
    vars: [
      { name: '--jj-link-label-bg-color',      type: 'color' },
      { name: '--jj-link-label-color',         type: 'color' },
      { name: '--jj-link-label-font-size',     type: 'dimension' },
      { name: '--jj-link-label-font-family',   type: 'dimension' },
      { name: '--jj-link-label-border-color',  type: 'color' },
      { name: '--jj-link-label-border-width',  type: 'dimension' },
      { name: '--jj-link-label-border-radius', type: 'cssvar', options: RADIUS_OPTIONS },
    ],
  },
  {
    title: 'Ports',
    vars: [
      { name: '--jj-port-color',                    type: 'color' },
      { name: '--jj-port-border-color',             type: 'color' },
      { name: '--jj-port-border-width',             type: 'dimension' },
      { name: '--jj-port-hover-color',              type: 'color' },
      { name: '--jj-port-hover-border-color',       type: 'color' },
      { name: '--jj-port-hover-border-width',       type: 'dimension' },
      { name: '--jj-port-available-color',         type: 'color' },
      { name: '--jj-port-available-border-color',  type: 'color' },
      { name: '--jj-port-available-border-width',  type: 'dimension' },
      { name: '--jj-port-label-color',              type: 'color' },
      { name: '--jj-port-label-font-size',          type: 'dimension' },
      { name: '--jj-port-label-font-family',        type: 'dimension' },
    ],
  },
  {
    title: 'Elements',
    vars: [
      { name: '--jj-box-color',                  type: 'color' },
      { name: '--jj-box-hover-border-color',     type: 'color' },
      { name: '--jj-box-fg-color',               type: 'color' },
      { name: '--jj-box-available-border-color', type: 'color' },
      { name: '--jj-box-border-color',  type: 'color' },
      { name: '--jj-box-border-width',  type: 'dimension' },
      { name: '--jj-box-border-radius', type: 'cssvar', options: RADIUS_OPTIONS },
      { name: '--jj-box-padding',       type: 'dimension' },
      { name: '--jj-box-font-size',     type: 'dimension' },
      { name: '--jj-box-font-family',   type: 'dimension' },
    ],
  },
];

// ── Graph data ────────────────────────────────────────────────────────────────

interface Data {
  readonly label: string;
  readonly isContainer?: boolean;
}

const DEFAULT_LINK = { style: { targetMarker: 'arrow' as LinkMarkerName }, z: 1 };

const PORT_IN  = { cx: 0,         cy: 'calc(0.5 * h)', passive: true, label: 'in',  labelOffsetX: -5, labelOffsetY: 10 } as const;
const PORT_OUT = { cx: 'calc(w)', cy: 'calc(0.5 * h)',                label: 'out', labelOffsetX: 5, labelOffsetY: 10 } as const;

const initialCells: ReadonlyArray<CellRecord<Data>> = [
  {
    id: 'container',
    type: 'element',
    data: { label: 'Container', isContainer: true },
    attrs: {
      root: { magnet: false },
    },
    position: { x: 20, y: 80 },
    size: { width: 240, height: 180 },
    z: 0,
  },
  {
    id: 'a',
    type: 'element',
    data: { label: 'Node A' },
    position: { x: 60, y: 130 },
    portMap: { out: PORT_OUT },
    parent: 'container',
    z: 2,
  },
  {
    id: 'b',
    type: 'element',
    data: { label: 'Node B' },
    position: { x: 330, y: 130 },
    portMap: { in: PORT_IN, out: PORT_OUT },
    z: 2,
  },
  {
    id: 'c',
    type: 'element',
    data: { label: 'Node C' },
    position: { x: 530, y: 130 },
    portMap: { in: PORT_IN },
    z: 2,
  },
  {
    id: 'a-b',
    type: 'link',
    ...DEFAULT_LINK,
    source: { id: 'a', port: 'out' },
    target: { id: 'b', port: 'in' },
    labelMap: {
      main: { position: 0.5, text: 'A → B' },
    },
    z: 1,
  },
  {
    id: 'b-c',
    type: 'link',
    ...DEFAULT_LINK,
    source: { id: 'b', port: 'out' },
    target: { id: 'c', port: 'in' },
    labelMap: {
      main: { position: 0.5, text: 'B → C' },
    },
    z: 1,
  },
];


// ── Element renderer ──────────────────────────────────────────────────────────

function validateEmbedding({ parent }: ValidateEmbeddingContext): boolean {
  return Boolean((parent.model.prop('data') as Data | undefined)?.isContainer);
}

const CONTAINER_STYLE: CSSProperties = {
  borderStyle: 'dashed',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
};

const RenderContainer = memo(function RenderContainer({ data }: Readonly<{ data: Data }>) {
  return <HTMLBox useModelGeometry style={CONTAINER_STYLE}>{data.label}</HTMLBox>;
});

const RenderElement = memo(function RenderElement({ data }: Readonly<{ data: Data }>) {
  return <HTMLBox>{data.label}</HTMLBox>;
});

function renderElement(data: Data) {
  if (data.isContainer) return <RenderContainer data={data} />;
  return <RenderElement data={data} />;
}

// ── Diagram ───────────────────────────────────────────────────────────────────

const INTERACTIVE_OPTIONS = { labelMove: true } as const;
const PAPER_HEIGHT = 560;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

interface DiagramProps {
  readonly zoom: number;
}

function Diagram({ zoom }: Readonly<DiagramProps>) {
  const { setCell } = useGraph<CellRecord<Data>>();

  usePaperEvents({
    'blank:pointerdblclick': (_event, x, y) => {
      setCell({
        id: `node-${Date.now()}`,
        type: 'element',
        data: { label: 'New Node' },
        position: { x, y },
        portMap: { in: PORT_IN, out: PORT_OUT },
        z: 2,
      });
    },
    'link:contextmenu': (linkView, event_, _x, _y) => {
      const labelNode = (event_.target as Element | null)?.closest('[label-idx]');
      if (!labelNode) return;
      const labelIndex = Number.parseInt(labelNode.getAttribute('label-idx') ?? '', 10);
      if (Number.isNaN(labelIndex)) return;
      event_.preventDefault();
      setCell(String(linkView.model.id), (previous) => {
        const rawLabelMap = (previous as { labelMap?: Record<string, unknown> }).labelMap;
        if (!rawLabelMap) return previous;
        const keys = Object.keys(rawLabelMap);
        if (labelIndex >= keys.length) return previous;
        const labelKey = keys[labelIndex];
        const labelMap = Object.fromEntries(
          Object.entries(rawLabelMap).filter(([key]) => key !== labelKey)
        );
        return { ...previous, labelMap } as CellRecord<Data>;
      });
    },
    'link:pointerdblclick': (linkView, _event, x, y) => {
      const totalLength = linkView.getConnectionLength();
      const closestLength = linkView.getClosestPointLength({ x, y });
      const position = totalLength > 0 ? closestLength / totalLength : 0.5;
      const labelKey = `label-${Date.now()}`;
      setCell(String(linkView.model.id), (previous) => {
        const linkRecord = previous as CellRecord<Data> & { labelMap?: Record<string, unknown> };
        return {
          ...linkRecord,
          labelMap: { ...linkRecord.labelMap, [labelKey]: { position, text: 'New Label' } },
        };
      });
    },
  });

  return (
    <Paper
      className={PAPER_CLASSNAME}
      style={{ height: PAPER_HEIGHT }}
      renderElement={renderElement}
      defaultLink={DEFAULT_LINK}
      interactive={INTERACTIVE_OPTIONS}
      embeddingMode
      validateEmbedding={validateEmbedding}
      transform={`scale(${zoom})`}
    />
  );
}

// ── Color Select ──────────────────────────────────────────────────────────────

interface ColorSelectProps {
  readonly value: string;
  readonly onChange: (hex: string) => void;
  readonly isDark: boolean;
}

function ColorSelect({ value, onChange, isDark }: Readonly<ColorSelectProps>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = PALETTE.find((c) => (c.value ?? c.hex) === value);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event_: MouseEvent) => {
      if (!containerRef.current?.contains(event_.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const triggerBg = isDark ? '#2a2a3d' : '#ffffff';
  const triggerBorder = isDark ? '#585b70' : 'rgba(0,0,0,0.18)';
  const triggerColor = isDark ? '#cdd6f4' : '#1f2937';
  const dropdownBg = isDark ? '#2a2a3d' : '#ffffff';
  const groupLabelColor = isDark ? '#585b70' : '#c1cfda';
  const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const selectedBg = isDark ? 'rgba(137,180,250,0.15)' : 'rgba(67,110,210,0.1)';

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          width: '100%', padding: '3px 7px',
          border: `1px solid ${triggerBorder}`, borderRadius: 5,
          background: triggerBg, color: triggerColor,
          cursor: 'pointer', fontSize: 11,
        }}
      >
        <span style={{
          width: 14, height: 14, borderRadius: 3, flexShrink: 0,
          backgroundColor: current?.hex ?? value, border: '1px solid rgba(0,0,0,0.2)',
        }} />
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current?.name ?? value}
        </span>
        <span style={{ fontSize: 8, opacity: 0.5, flexShrink: 0 }}>{'▾'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0,
          zIndex: 200, maxHeight: 220, overflowY: 'auto',
          backgroundColor: dropdownBg,
          border: `1px solid ${triggerBorder}`,
          borderRadius: 8,
          boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
        }}>
          {PALETTE_GROUPS.map((group) => (
            <div key={group.label}>
              <div style={{
                padding: '5px 8px 2px',
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: groupLabelColor,
              }}>
                {group.label}
              </div>
              {group.colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => { onChange(color.value ?? color.hex); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '4px 8px',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: (color.value ?? color.hex) === value ? selectedBg : 'transparent',
                    color: triggerColor,
                  }}
                  onMouseEnter={(event_) => {
                    if ((color.value ?? color.hex) !== value) (event_.currentTarget as HTMLButtonElement).style.background = hoverBg;
                  }}
                  onMouseLeave={(event_) => {
                    (event_.currentTarget as HTMLButtonElement).style.background = (color.value ?? color.hex) === value ? selectedBg : 'transparent';
                  }}
                >
                  <span style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    backgroundColor: color.hex, border: '1px solid rgba(0,0,0,0.2)',
                  }} />
                  <span style={{ fontSize: 11, flex: 1 }}>{color.name}</span>
                  <span style={{ fontSize: 10, opacity: 0.4, fontFamily: 'monospace', flexShrink: 0 }}>{color.hex}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Form Panel ────────────────────────────────────────────────────────────────

interface VariableControlProps {
  readonly cssVariable: VariableDefinition;
  readonly value: string;
  readonly isDark: boolean;
  readonly inputBg: string;
  readonly inputBorder: string;
  readonly inputColor: string;
  readonly onSet: (name: string, value: string) => void;
}

function VariableControl({ cssVariable, value, isDark, inputBg, inputBorder, inputColor, onSet }: Readonly<VariableControlProps>) {
  const sharedInputStyle = {
    flex: 1, minWidth: 0, padding: '3px 7px',
    border: `1px solid ${inputBorder}`, borderRadius: 5,
    fontSize: 11, backgroundColor: inputBg, color: inputColor, outline: 'none',
  };

  if (cssVariable.type === 'color') {
    return (
      <ColorSelect
        value={value}
        onChange={(hex) => onSet(cssVariable.name, hex)}
        isDark={isDark}
      />
    );
  }

  if (cssVariable.type === 'cssvar') {
    return (
      <select
        value={value}
        onChange={(event_) => onSet(cssVariable.name, event_.target.value)}
        style={{ ...sharedInputStyle, cursor: 'pointer' }}
      >
        {cssVariable.options?.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={cssVariable.type === 'number' ? 'number' : 'text'}
      value={value}
      min={cssVariable.type === 'number' ? 0.5 : undefined}
      max={cssVariable.type === 'number' ? 10 : undefined}
      step={cssVariable.type === 'number' ? 0.5 : undefined}
      onChange={(event_) => onSet(cssVariable.name, event_.target.value)}
      style={sharedInputStyle}
    />
  );
}

interface FormPanelProps {
  readonly themeVars: CSSVars;
  readonly overrides: CSSVars;
  readonly isDark: boolean;
  readonly onSet: (name: string, value: string) => void;
  readonly onReset: (name: string) => void;
  readonly onResetAll: () => void;
}

function FormPanel({ themeVars, overrides, isDark, onSet, onReset, onResetAll }: Readonly<FormPanelProps>) {
  const bg = isDark ? 'rgba(30,30,46,0.97)' : 'rgba(255,255,255,0.97)';
  const border = isDark ? '#45475a' : '#dde6ed';
  const headingColor = isDark ? '#cdd6f4' : '#1a2733';
  const subtleColor = isDark ? '#a6adc8' : '#6b7280';
  const divider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const inputBg = isDark ? '#2a2a3d' : '#ffffff';
  const inputBorder = isDark ? '#585b70' : 'rgba(0,0,0,0.18)';
  const inputColor = isDark ? '#cdd6f4' : '#1f2937';

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div style={{
      width: '100%',
      marginTop: 12,
      backgroundColor: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: headingColor, letterSpacing: '-0.01em' }}>
          CSS Variables
        </span>
        {hasOverrides && (
          <button
            type="button"
            onClick={onResetAll}
            style={{
              fontSize: 10, padding: '2px 7px', cursor: 'pointer',
              border: `1px solid ${inputBorder}`, borderRadius: 6,
              background: 'transparent', color: subtleColor,
            }}
          >
            Reset all
          </button>
        )}
      </div>

      {/* Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {SECTIONS.map((section, sectionIndex) => {
        const isLeftColumn = sectionIndex % 2 === 0;
        const lastRowStart = SECTIONS.length % 2 === 0 ? SECTIONS.length - 2 : SECTIONS.length - 1;
        const isLastRow = sectionIndex >= lastRowStart;
        return (
        <div
          key={section.title}
          style={{
            padding: '8px 14px',
            borderRight: isLeftColumn ? `1px solid ${divider}` : undefined,
            borderBottom: isLastRow ? undefined : `1px solid ${divider}`,
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 700, color: subtleColor,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
          }}>
            {section.title}
          </div>

          {section.vars.map((cssVariable) => {
            const value = overrides[cssVariable.name] ?? themeVars[cssVariable.name] ?? CSS_DEFAULTS[cssVariable.name] ?? '';
            const isOverridden = cssVariable.name in overrides;

            const displayLabel = cssVariable.name.replace(/^--jj-/, '');

            return (
              <div key={cssVariable.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <label
                  title={cssVariable.name}
                  style={{
                    width: 155, flexShrink: 0, fontSize: 11, color: subtleColor,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {displayLabel}
                  {isOverridden && (
                    <span style={{ marginLeft: 3, fontSize: 9, color: '#89b4fa' }}>●</span>
                  )}
                </label>

                <VariableControl
                  cssVariable={cssVariable}
                  value={value}
                  isDark={isDark}
                  inputBg={inputBg}
                  inputBorder={inputBorder}
                  inputColor={inputColor}
                  onSet={onSet}
                />

                {isOverridden && (
                  <button
                    type="button"
                    onClick={() => onReset(cssVariable.name)}
                    title={`Reset to ${themeVars[cssVariable.name]}`}
                    style={{
                      fontSize: 9, padding: '2px 4px', cursor: 'pointer',
                      border: `1px solid ${inputBorder}`, borderRadius: 4,
                      background: 'transparent', color: subtleColor, lineHeight: 1, flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      );
      })}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [overrides, setOverrides] = useState<CSSVars>({});
  const [zoom, setZoom] = useState(1);

  const themeVars = isDark ? DARK_THEME : LIGHT_THEME;

  const effectiveVars = useMemo(
    () => ({ ...themeVars, ...overrides }),
    [themeVars, overrides]
  );

  const toggleTheme = useCallback(() => setIsDark((previous) => !previous), []);
  const zoomIn    = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 10) / 10)), []);
  const zoomOut   = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 10) / 10)), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  const setVariable = useCallback((name: string, value: string) => {
    setOverrides((previous) => ({ ...previous, [name]: value }));
  }, []);

  const resetVariable = useCallback((name: string) => {
    setOverrides((previous) =>
      Object.fromEntries(Object.entries(previous).filter(([key]) => key !== name))
    );
  }, []);

  const resetAll = useCallback(() => setOverrides({}), []);

  const toggleButtonStyle = useMemo(() => ({
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: 6,
    padding: '5px 14px',
    cursor: 'pointer' as const,
    borderRadius: 20,
    border: 'none' as const,
    fontSize: 13,
    fontWeight: 500,
    background: isDark ? '#313244' : '#e0e7ff',
    color: isDark ? '#cdd6f4' : '#4338ca',
    transition: 'background 0.2s, color 0.2s',
  }), [isDark]);

  const zoomButtonStyle = useMemo(() => ({
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: 26, height: 26,
    cursor: 'pointer' as const,
    borderRadius: 6,
    border: `1px solid ${isDark ? '#585b70' : 'rgba(0,0,0,0.18)'}`,
    background: isDark ? '#313244' : '#e0e7ff',
    color: isDark ? '#cdd6f4' : '#4338ca',
    fontSize: 15, fontWeight: 700,
  }), [isDark]);

  const zoomLabelStyle = useMemo(() => ({
    minWidth: 40, textAlign: 'center' as const,
    fontSize: 12, cursor: 'pointer' as const,
    color: isDark ? '#a6adc8' : '#6b7280',
    fontVariantNumeric: 'tabular-nums' as const,
  }), [isDark]);

  const dividerStyle = useMemo(() => ({
    width: 1, height: 20,
    background: isDark ? '#45475a' : '#dde6ed',
  }), [isDark]);

  return (
    <div style={effectiveVars as CSSProperties}>
      <div style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onClick={toggleTheme} style={toggleButtonStyle}>
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
        <div style={dividerStyle} />
        <button type="button" onClick={zoomOut} style={zoomButtonStyle} title="Zoom out">−</button>
        <button type="button" onClick={resetZoom} style={zoomLabelStyle} title="Reset zoom">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={zoomIn} style={zoomButtonStyle} title="Zoom in">+</button>
      </div>
      <GraphProvider initialCells={initialCells}>
        <Diagram zoom={zoom} />
      </GraphProvider>
      <FormPanel
        themeVars={themeVars}
        overrides={overrides}
        isDark={isDark}
        onSet={setVariable}
        onReset={resetVariable}
        onResetAll={resetAll}
      />
    </div>
  );
}
