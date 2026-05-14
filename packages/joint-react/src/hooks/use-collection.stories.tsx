import { useCallback, useMemo } from 'react';
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

const JJS = {
  bg: '#131E29',
  ink: '#DDE6ED',
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

function selectShapeData(cell: ComputedShapeRecord): ShapeData {
  return cell.data;
}
function selectShapeSize(cell: ComputedShapeRecord): {
  readonly width: number;
  readonly height: number;
} {
  return cell.size;
}

function RenderShape() {
  const { selectorRef } = useMarkup();
  const data = useCell<ComputedShapeRecord, ShapeData>(selectShapeData);
  const size = useCell<ComputedShapeRecord, { width: number; height: number }>(selectShapeSize);
  return (
    <g ref={selectorRef('body')} className="cursor-pointer">
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

interface WatchRowProps {
  readonly cell: ComputedShapeRecord;
  readonly onRemove: (id: dia.Cell.ID) => void;
}

function WatchRow({ cell, onRemove }: Readonly<WatchRowProps>) {
  const { color, label } = cell.data;
  const { x, y } = cell.position;
  const { width, height } = cell.size;
  const handleRemove = useCallback(() => {
    onRemove(cell.id);
  }, [cell.id, onRemove]);
  const accentStyle = useMemo(() => ({ background: color.fill }), [color.fill]);
  return (
    <li className="flex items-stretch border-b border-[#2A3845] bg-transparent">
      <div className="w-1 self-stretch" style={accentStyle} />
      <div className="min-w-0 flex-1 py-3 pr-1 pl-3.5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-sans text-sm font-semibold text-[#DDE6ED]">{label}</span>
          <span className="font-mono text-[10px] tracking-[0.08em] text-[#566373]">
            #{String(cell.id)}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-0">
          <Metric label="x" value={x} />
          <Metric label="y" value={y} />
          <Metric label="w" value={width} />
          <Metric label="h" value={height} />
        </div>
      </div>
      <button
        type="button"
        onClick={handleRemove}
        className="w-9.5 cursor-pointer border-0 border-l border-[#2A3845] bg-transparent font-sans text-lg text-[#566373]"
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
    <div className="flex flex-col items-start pr-1.5">
      <span className="font-mono text-[9px] tracking-[0.14em] text-[#566373] uppercase">
        {label}
      </span>
      <span className="mt-0.5 font-mono text-xs text-[#DDE6ED] tabular-nums">
        {Math.round(value)}
      </span>
    </div>
  );
}

function totalArea(cells: readonly ComputedShapeRecord[]): number {
  let sum = 0;
  for (const cell of cells) {
    sum += cell.size.width * cell.size.height;
  }
  return sum;
}

function Watchlist() {
  const collection = useMemo<mvc.Collection<dia.Cell>>(() => new mvc.Collection<dia.Cell>([]), []);

  const [cells, setCells] = useCollection<ComputedShapeRecord>(collection);
  const [area] = useCollection<ComputedShapeRecord, number>(collection, totalArea);

  const paperEventHandlers = useMemo(
    () => ({
      'element:pointerclick': (view: dia.ElementView) => {
        const cell = view.model;
        if (collection.get(cell.id)) {
          collection.remove(cell);
        } else {
          collection.add(cell);
        }
      },
    }),
    [collection]
  );

  usePaperEvents(PAPER_ID, paperEventHandlers, [collection]);

  const onRemove = useCallback(
    (id: dia.Cell.ID) => {
      const cell = collection.get(id);
      if (cell) collection.remove(cell);
    },
    [collection]
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
    <section className="min-h-135 bg-[#131E29] px-11 pt-10 pb-11 font-sans tracking-[0.005em] text-[#DDE6ED]">
      <header className="mb-7 max-w-180">
        <div className="mb-3.5 inline-flex items-center gap-2 border border-[#2A3845] bg-[#192531] px-2.5 py-1 font-mono text-[11px] tracking-[0.06em] text-[#7B8A98] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ED2637]" />
          <span>@joint/react · useCollection</span>
        </div>
        <h1 className="m-0 font-sans text-[clamp(24px,3vw,36px)] leading-[1.15] font-semibold tracking-[-0.01em] text-[#DDE6ED]">
          Subscribe to any <span className="text-[#ED2637]">mvc.Collection</span> of cells —{' '}
          <em className="font-medium text-[#FF9505] italic">reactively</em>.
        </h1>
        <p className="mt-2.5 mb-0 max-w-160 font-sans text-[14.5px] leading-[1.6] text-[#7B8A98]">
          Click a shape to toggle it on the watchlist. Drag a watched shape — coordinates update
          live in the panel. The setter accepts full records, so
          <span className="rounded-[3px] bg-[#1F2C39] px-1.5 py-px font-mono text-[12.5px] text-[#DDE6ED]">
            {' '}
            Shuffle
          </span>{' '}
          and{' '}
          <span className="rounded-[3px] bg-[#1F2C39] px-1.5 py-px font-mono text-[12.5px] text-[#DDE6ED]">
            Resize
          </span>{' '}
          also flow through{' '}
          <span className="rounded-[3px] bg-[#1F2C39] px-1.5 py-px font-mono text-[12.5px] text-[#DDE6ED]">
            useCollection
          </span>
          .
        </p>
      </header>

      <div className="grid items-stretch gap-6 grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="relative flex flex-col border border-[#2A3845] bg-[#192531]">
          <div className="flex items-center justify-between border-b border-[#2A3845] bg-[#1F2C39] px-3.5 py-2.5">
            <span className="font-mono text-[10.5px] tracking-[0.18em] text-[#7B8A98] uppercase">
              Canvas
            </span>
            <span className="font-mono text-[10.5px] tracking-[0.04em] text-[#566373]">
              click to watch · drag to move
            </span>
          </div>
          <Paper id={PAPER_ID} width="100%" height={360} renderElement={RenderShape} />
        </div>

        <aside className="flex min-h-90 flex-col border border-[#2A3845] bg-[#192531]">
          <div className="flex items-baseline justify-between border-b border-[#2A3845] bg-[#1F2C39] px-4.5 py-4">
            <span className="font-mono text-[10.5px] tracking-[0.18em] text-[#7B8A98] uppercase">
              Watchlist
            </span>
            <span className="font-mono text-[17px] font-semibold tabular-nums">
              <span className="text-[#ED2637] tabular-nums">
                {String(cells.length).padStart(2, '0')}
              </span>
              <span className="text-[#566373]"> / 05</span>
            </span>
          </div>

          {cells.length === 0 ? (
            <div className="flex flex-1 flex-col items-start px-5.5 py-9 text-[#DDE6ED]">
              <span className="font-sans text-base font-semibold text-[#DDE6ED]">
                Nothing watched yet.
              </span>
              <span className="mt-1.5 font-mono text-[13px] text-[#7B8A98]">
                ← click any shape on the canvas
              </span>
            </div>
          ) : (
            <ul className="m-0 flex-1 list-none overflow-y-auto p-0">
              {cells.map((cell) => (
                <WatchRow key={String(cell.id)} cell={cell} onRemove={onRemove} />
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3 border-t border-[#2A3845] bg-[#1F2C39] px-4.5 pt-3.5 pb-4">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10.5px] tracking-[0.18em] text-[#7B8A98] uppercase">
                Σ area
              </span>
              <span className="font-mono text-lg tracking-[0.01em] text-[#FF9505] tabular-nums">
                {area.toLocaleString('en-US')}
                <span className="ml-1 text-[11px] text-[#566373]">px²</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={shuffle}
                disabled={disabled}
                className="cursor-pointer rounded border border-[#ED2637] bg-[#ED2637] px-3.5 py-2 font-sans text-xs font-semibold tracking-[0.04em] text-[#DDE6ED] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Shuffle
              </button>
              <button
                type="button"
                onClick={resizeRandom}
                disabled={disabled}
                className="cursor-pointer rounded border border-[#2A3845] bg-transparent px-3.5 py-2 font-sans text-xs font-semibold tracking-[0.04em] text-[#DDE6ED] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Resize
              </button>
              <button
                type="button"
                onClick={clear}
                disabled={disabled}
                className="cursor-pointer rounded border border-transparent bg-transparent px-3.5 py-2 font-sans text-xs font-semibold tracking-[0.04em] text-[#7B8A98] disabled:cursor-not-allowed disabled:opacity-50"
              >
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

const meta: Meta<typeof Demo> = {
  title: 'Hooks/useCollection',
  component: Demo,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {};
