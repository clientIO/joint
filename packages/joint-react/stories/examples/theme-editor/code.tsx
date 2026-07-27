/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import type { CSSProperties } from 'react';
import {
  type CellRecord,
  type ValidateEmbeddingParams,
  GraphProvider,
  Paper,
  HTMLBox,
  type LinkMarkerName,
  useGraph,
} from '@joint/react';

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
  '--jj-link-width':         '2',
  '--jj-link-label-bg-color':     p('light-200'),
  '--jj-link-label-color':        pv('color-text'),
  '--jj-link-label-border-color': p('light-700'),
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
  '--jj-link-width':            '2',
  '--jj-link-dash':             'none',
  '--jj-link-line-cap':         'butt',
  '--jj-link-connecting-color': pv('color-link'),
  '--jj-link-connecting-width':  '2',
  '--jj-link-connecting-dash':   '8 4',
  '--jj-link-label-bg-color':         p('light-200'),
  '--jj-link-label-color':            pv('color-text'),
  '--jj-link-label-font-size':        '10px',
  '--jj-link-label-font-family':      'Arial, sans-serif',
  '--jj-link-label-border-color':     p('light-700'),
  '--jj-link-label-border-width':     '2px',
  '--jj-link-label-border-radius':    'var(--jj-radius-sm)',
  '--jj-port-color':             pv('color-surface'),
  '--jj-port-border-color':      pv('color-link'),
  '--jj-port-border-width':      '2px',
  '--jj-port-hover-color':       pv('color-shape-surface'),
  '--jj-port-hover-border-color': pv('color-link'),
  '--jj-port-hover-border-width': '4px',
  '--jj-port-available-color':        p('dark-800'),
  '--jj-port-available-border-color': p('dark-800'),
  '--jj-port-available-border-width': 'var(--jj-port-border-width)',
  '--jj-port-label-color':       p('light-900'),
  '--jj-port-label-font-size':   '10px',
  '--jj-port-label-font-family': 'Arial, sans-serif',
  '--jj-box-color':                  pv('color-shape-surface'),
  '--jj-box-hover-border-color':     pv('color-primary'),
  '--jj-box-available-border-color': p('dark-800'),
  '--jj-box-fg-color':         pv('color-text'),
  '--jj-box-border-color':       pv('color-shape-border'),
  '--jj-box-border-width':       '2px',
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

function validateEmbedding({ parent }: ValidateEmbeddingParams): boolean {
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
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

// Intentional inline background: theming the paper surface via `--jj-paper-color`
// is the point of this demo, so it must win over the storybook's transparent paper.
const paperStyle = { backgroundColor: 'var(--jj-paper-color)' } as const;

interface DiagramProps {
  readonly zoom: number;
}

function Diagram({ zoom }: Readonly<DiagramProps>) {
  const { setCell } = useGraph<CellRecord<Data>>();

  return (
    <Paper
      className="min-w-0 flex-1"
      style={paperStyle}
      renderElement={renderElement}
      defaultLink={DEFAULT_LINK}
      interactive={INTERACTIVE_OPTIONS}
      embeddingMode
      validateEmbedding={validateEmbedding}
      transform={`scale(${zoom})`}
      onBlankPointerDblClick={({ x, y }) => {
        setCell({
          id: `node-${Date.now()}`,
          type: 'element',
          data: { label: 'New Node' },
          position: { x, y },
          portMap: { in: PORT_IN, out: PORT_OUT },
          z: 2,
        });
      }}
      onLinkContextMenu={({ view, event }) => {
        const labelNode = (event.target as Element | null)?.closest('[label-idx]');
        if (!labelNode) return;
        const labelIndex = Number.parseInt(labelNode.getAttribute('label-idx') ?? '', 10);
        if (Number.isNaN(labelIndex)) return;
        event.preventDefault();
        setCell(String(view.model.id), (previous) => {
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
      }}
      onLinkPointerDblClick={({ view, x, y }) => {
        const totalLength = view.getConnectionLength();
        const closestLength = view.getClosestPointLength({ x, y });
        const position = totalLength > 0 ? closestLength / totalLength : 0.5;
        const labelKey = `label-${Date.now()}`;
        setCell(String(view.model.id), (previous) => {
          const linkRecord = previous as CellRecord<Data> & { labelMap?: Record<string, unknown> };
          return {
            ...linkRecord,
            labelMap: { ...linkRecord.labelMap, [labelKey]: { position, text: 'New Label' } },
          };
        });
      }}
    />
  );
}

// ── Color Select ──────────────────────────────────────────────────────────────

interface ColorSelectProps {
  readonly value: string;
  readonly onChange: (hex: string) => void;
}

function ColorSelect({ value, onChange }: Readonly<ColorSelectProps>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = PALETTE.find((color) => (color.value ?? color.hex) === value);

  const toggleOpen = useCallback(() => setOpen((previous) => !previous), []);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <button type="button" className="jj-select flex w-full items-center gap-2" onClick={toggleOpen}>
        <span
          className="size-3.5 shrink-0 rounded-[3px] border border-black/20"
          style={{ backgroundColor: current?.hex ?? value }}
        />
        <span className="min-w-0 flex-1 truncate text-left">{current?.name ?? value}</span>
        <span className="shrink-0 text-[8px] opacity-50">▾</span>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-[200] mt-[3px] max-h-56 overflow-y-auto rounded-[--radius-control] border border-hairline-strong bg-surface-2 shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
          {PALETTE_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-2 pb-0.5 pt-2 text-[9px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                {group.label}
              </div>
              {group.colors.map((color) => {
                const colorValue = color.value ?? color.hex;
                const isSelected = colorValue === value;
                return (
                  <button
                    key={color.name}
                    type="button"
                    className={`flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-white/5 ${
                      isSelected ? 'bg-brand/15' : ''
                    }`}
                    onClick={() => {
                      onChange(colorValue);
                      setOpen(false);
                    }}
                  >
                    <span
                      className="size-3.5 shrink-0 rounded-[3px] border border-black/20"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="flex-1 text-[11px] text-ink">{color.name}</span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-faint">{color.hex}</span>
                  </button>
                );
              })}
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
  readonly onSet: (name: string, value: string) => void;
}

function VariableControl({ cssVariable, value, onSet }: Readonly<VariableControlProps>) {
  if (cssVariable.type === 'color') {
    return <ColorSelect value={value} onChange={(hex) => onSet(cssVariable.name, hex)} />;
  }

  if (cssVariable.type === 'cssvar') {
    return (
      <select
        className="jj-select min-w-0 flex-1 text-[11px]"
        value={value}
        onChange={(event) => onSet(cssVariable.name, event.target.value)}
      >
        {cssVariable.options?.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  const isNumber = cssVariable.type === 'number';
  return (
    <input
      className="jj-input min-w-0 flex-1 text-[11px]"
      type={isNumber ? 'number' : 'text'}
      value={value}
      min={isNumber ? 0.5 : undefined}
      max={isNumber ? 10 : undefined}
      step={isNumber ? 0.5 : undefined}
      onChange={(event) => onSet(cssVariable.name, event.target.value)}
    />
  );
}

interface FormPanelProps {
  readonly themeVars: CSSVars;
  readonly overrides: CSSVars;
  readonly onSet: (name: string, value: string) => void;
  readonly onReset: (name: string) => void;
  readonly onResetAll: () => void;
}

function FormPanel({ themeVars, overrides, onSet, onReset, onResetAll }: Readonly<FormPanelProps>) {
  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
        <span className="text-[12px] font-semibold text-ink">CSS Variables</span>
        {hasOverrides && (
          <button type="button" className="jj-btn jj-btn--ghost jj-btn--sm" onClick={onResetAll}>
            Reset all
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-4 last:mb-0">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-faint">
              {section.title}
            </div>

            {section.vars.map((cssVariable) => {
              const value =
                overrides[cssVariable.name] ??
                themeVars[cssVariable.name] ??
                CSS_DEFAULTS[cssVariable.name] ??
                '';
              const isOverridden = cssVariable.name in overrides;
              const themeValue = themeVars[cssVariable.name] ?? CSS_DEFAULTS[cssVariable.name] ?? '';

              return (
                <div key={cssVariable.name} className="mb-1.5 flex items-center gap-2">
                  <label
                    title={cssVariable.name}
                    className="flex w-[128px] shrink-0 items-center gap-1 text-[11px] text-ink-muted"
                  >
                    <span className="min-w-0 truncate">{cssVariable.name.replace(/^--jj-/, '')}</span>
                    {isOverridden && <span className="shrink-0 text-brand">●</span>}
                  </label>

                  <VariableControl cssVariable={cssVariable} value={value} onSet={onSet} />

                  {isOverridden && (
                    <button
                      type="button"
                      className="jj-btn jj-btn--ghost jj-btn--sm shrink-0"
                      title={`Reset to ${themeValue}`}
                      onClick={() => onReset(cssVariable.name)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [overrides, setOverrides] = useState<CSSVars>({});
  const [zoom, setZoom] = useState(1);
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  const themeVars = isDark ? DARK_THEME : LIGHT_THEME;

  const effectiveVars = useMemo(
    () => ({
      ...themeVars,
      ...overrides,
      ...(isThemeChanging ? { '--jj-transition-duration': '0' } : {}),
    }),
    [themeVars, overrides, isThemeChanging]
  );

  const toggleTheme = useCallback(() => {
    setIsThemeChanging(true);
    setIsDark((previous) => !previous);
  }, []);

  useEffect(() => {
    if (!isThemeChanging) return;
    const frameId = requestAnimationFrame(() => setIsThemeChanging(false));
    return () => cancelAnimationFrame(frameId);
  }, [isThemeChanging]);
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

  return (
    <div className="flex size-full" style={effectiveVars as CSSProperties}>
      <GraphProvider initialCells={initialCells}>
        <Diagram zoom={zoom} />
      </GraphProvider>

      <aside className="flex w-[340px] shrink-0 flex-col border-l border-hairline bg-surface">
        <div className="flex items-center gap-2 border-b border-hairline p-3">
          <button type="button" className="jj-btn jj-btn--sm" onClick={toggleTheme}>
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="jj-btn jj-btn--ghost jj-btn--sm"
              onClick={zoomOut}
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              className="jj-btn jj-btn--ghost jj-btn--sm min-w-[52px]"
              onClick={resetZoom}
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="jj-btn jj-btn--ghost jj-btn--sm"
              onClick={zoomIn}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>

        <FormPanel
          themeVars={themeVars}
          overrides={overrides}
          onSet={setVariable}
          onReset={resetVariable}
          onResetAll={resetAll}
        />
      </aside>
    </div>
  );
}
