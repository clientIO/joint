/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { V } from '@joint/core';
import {
  type CellRecord,
  type Computed,
  type ElementPort,
  type ElementRecord,
  GraphProvider,
  HTMLBox,
  Paper,
  linkRoutingSmooth,
  useCells,
  useGraph,
} from '@joint/react';

// Colors — unified dark diagram palette.
const OUTPUT_PORT_COLOR = '#FF9505';
const INPUT_PORT_COLOR = '#ED2637';
// Port labels have no stylesheet fill of their own, so they need an explicit
// light color to stay readable on the dark canvas.
const PORT_LABEL_COLOR = '#DDE6ED';

const PORT_SIZE = 16;

const SMOOTH_LINKS = linkRoutingSmooth();

// Custom path shapes — computed from width/height so they scale with port size.
function trianglePath(w: number, h: number): string {
  const hw = w / 2;
  const hh = h / 2;
  return `M ${-hw} ${-hh} L ${hw} 0 L ${-hw} ${hh} Z`;
}

function roundedRectPath(w: number, h: number): string {
  return V.rectToPath({
    x: -w / 2,
    y: -h / 2,
    width: w,
    height: h,
    rx: Math.min(w, h) / 4,
    ry: Math.min(w, h) / 4,
  });
}

const SHAPE_OPTIONS = [
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'rect', label: 'Rectangle' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'rounded-rect', label: 'Rounded Rect' },
] as const;

const LABEL_POSITION_OPTIONS = [
  'outside',
  'inside',
  'outsideOriented',
  'insideOriented',
  'left',
  'right',
  'top',
  'bottom',
] as const;

/** Resolve custom shape names to SVG paths based on port size. */
function resolveShape(shape: string, w: number, h: number): string {
  if (shape === 'triangle') return trianglePath(w, h);
  if (shape === 'rounded-rect') return roundedRectPath(w, h);
  return shape;
}

function getShapeLabel(shape: string): string {
  return SHAPE_OPTIONS.find((option) => option.value === shape)?.label ?? 'Path';
}

interface PortNodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialCells: ReadonlyArray<CellRecord<PortNodeData>> = [
  {
    id: 'node-1',
    type: 'element',
    data: { label: 'Node 1' },
    position: { x: 50, y: 100 },
    size: { width: 140, height: 80 },
    portStyle: {
      width: PORT_SIZE,
      height: PORT_SIZE,
      color: OUTPUT_PORT_COLOR,
      labelColor: PORT_LABEL_COLOR,
    },
    portMap: {
      'out-1': {
        cx: 'calc(w)',
        cy: 'calc(0.33 * h)',
        label: 'Out 1',
        shape: resolveShape('rounded-rect', PORT_SIZE, PORT_SIZE),
        labelOffsetY: -15,
      },
      'out-2': {
        cx: 'calc(w)',
        cy: 'calc(0.66 * h)',
        label: 'Out 2',
        labelOffsetX: 10,
        labelOffsetY: 15,
      },
    },
  },
  {
    id: 'node-2',
    type: 'element',
    data: { label: 'Node 2' },
    position: { x: 350, y: 100 },
    size: { width: 140, height: 80 },
    portStyle: {
      width: PORT_SIZE,
      height: PORT_SIZE,
      color: INPUT_PORT_COLOR,
      labelColor: PORT_LABEL_COLOR,
    },
    portMap: {
      'in-1': {
        cx: 0,
        cy: 'calc(0.33 * h)',
        shape: 'rect',
        label: 'In 1',
        labelOffsetY: -15,
      },
      'in-2': {
        cx: 0,
        cy: 'calc(0.66 * h)',
        shape: resolveShape('triangle', PORT_SIZE, PORT_SIZE),
        label: 'In 2',
        labelOffsetY: 15,
      },
    },
  },
  {
    id: 'link-1',
    type: 'link',
    source: { id: 'node-1', port: 'out-1' },
    target: { id: 'node-2', port: 'in-1' },
    z: -1,
  },
  {
    id: 'link-2',
    type: 'link',
    source: { id: 'node-1', port: 'out-2' },
    target: { id: 'node-2', port: 'in-2' },
    z: -1,
  },
];

interface PortControlProps {
  readonly elementId: string;
  readonly portId: string;
  readonly port: ElementPort;
  /** Element-level port color, used when the port has no color of its own. */
  readonly defaultColor: string;
}

function PortControl({ elementId, portId, port, defaultColor }: Readonly<PortControlProps>) {
  const { setCell, isElement } = useGraph();

  const updatePort = (updates: Partial<ElementPort>) => {
    setCell(elementId, (previous) => {
      if (!isElement(previous)) return previous;
      return {
        ...previous,
        portMap: previous.portMap
          ? { ...previous.portMap, [portId]: { ...previous.portMap[portId], ...updates } }
          : previous.portMap,
      };
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-control border border-hairline bg-surface-2/60 p-3">
      <div className="text-xs font-semibold text-ink">
        {portId}
        <span className="ml-1.5 font-normal text-ink-faint">{getShapeLabel(port.shape ?? 'ellipse')}</span>
      </div>

      <label className="jj-field w-full">
        <span className="jj-label w-12 shrink-0">Color</span>
        <input
          type="color"
          className="jj-input h-8 w-12 shrink-0 cursor-pointer p-1"
          value={port.color ?? defaultColor}
          onChange={(event) => updatePort({ color: event.target.value })}
        />
      </label>

      <label className="jj-field w-full">
        <span className="jj-label w-12 shrink-0">Shape</span>
        <select
          className="jj-select flex-1"
          value={port.shape ?? 'ellipse'}
          onChange={(event) => {
            const shape = resolveShape(
              event.target.value,
              port.width ?? PORT_SIZE,
              port.height ?? PORT_SIZE
            );
            updatePort({ shape });
          }}
        >
          {SHAPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="jj-field w-full">
        <span className="jj-label w-12 shrink-0">Size</span>
        <input
          type="number"
          className="jj-input w-16"
          value={port.width ?? PORT_SIZE}
          onChange={(event) => updatePort({ width: Number(event.target.value) })}
          min={4}
          max={40}
        />
        <span className="text-ink-faint">&times;</span>
        <input
          type="number"
          className="jj-input w-16"
          value={port.height ?? PORT_SIZE}
          onChange={(event) => updatePort({ height: Number(event.target.value) })}
          min={4}
          max={40}
        />
      </label>

      <label className="jj-field w-full">
        <span className="jj-label w-12 shrink-0">Label</span>
        <input
          type="text"
          className="jj-input flex-1"
          value={port.label ?? ''}
          onChange={(event) => updatePort({ label: event.target.value || undefined })}
          placeholder="None"
        />
      </label>

      <label className="jj-field w-full">
        <span className="jj-label w-12 shrink-0">Pos</span>
        <select
          className="jj-select flex-1"
          value={port.labelPosition ?? 'outside'}
          onChange={(event) => updatePort({ labelPosition: event.target.value })}
        >
          {LABEL_POSITION_OPTIONS.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
      </label>

      <label className="jj-field w-full">
        <span className="jj-label w-12 shrink-0">dx</span>
        <input
          type="checkbox"
          className="accent-brand"
          checked={port.labelOffsetX !== undefined}
          onChange={(event) => updatePort({ labelOffsetX: event.target.checked ? 0 : undefined })}
        />
        <input
          type="number"
          className="jj-input flex-1 disabled:opacity-40"
          value={port.labelOffsetX ?? 0}
          disabled={port.labelOffsetX === undefined}
          onChange={(event) => updatePort({ labelOffsetX: Number(event.target.value) })}
        />
      </label>

      <label className="jj-field w-full">
        <span className="jj-label w-12 shrink-0">dy</span>
        <input
          type="checkbox"
          className="accent-brand"
          checked={port.labelOffsetY !== undefined}
          onChange={(event) => updatePort({ labelOffsetY: event.target.checked ? 0 : undefined })}
        />
        <input
          type="number"
          className="jj-input flex-1 disabled:opacity-40"
          value={port.labelOffsetY ?? 0}
          disabled={port.labelOffsetY === undefined}
          onChange={(event) => updatePort({ labelOffsetY: Number(event.target.value) })}
        />
      </label>
    </div>
  );
}

interface ElementPortControlsProps {
  readonly id: string;
  readonly element: Computed<ElementRecord<PortNodeData>>;
}

function ElementPortControls({ id, element }: Readonly<ElementPortControlsProps>) {
  const portEntries = Object.entries(element.portMap ?? {});
  const label = element.data?.label ?? '';
  const defaultColor = element.portStyle?.color ?? OUTPUT_PORT_COLOR;

  return (
    <div className="flex flex-col gap-2.5 border-b border-hairline px-4 py-3">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        {label}
        <span className="jj-chip">
          {portEntries.length} port{portEntries.length === 1 ? '' : 's'}
        </span>
      </div>

      {portEntries.map(([portId, port]) => (
        <PortControl
          key={portId}
          elementId={id}
          portId={portId}
          port={port}
          defaultColor={defaultColor}
        />
      ))}
    </div>
  );
}

function RenderElement({ label }: Readonly<PortNodeData>) {
  return (
    <HTMLBox useModelGeometry className="jj-node">
      {label}
    </HTMLBox>
  );
}

function Main() {
  const cells = useCells();
  const elements = cells.filter(
    (cell): cell is Computed<ElementRecord<PortNodeData>> => cell.type === 'element'
  );

  return (
    <div className="relative size-full">
      <Paper
        className="size-full"
        renderElement={RenderElement}
        snapLinks
        linkPinning={false}
        linkRouting={SMOOTH_LINKS}
      />

      <div className="absolute right-3 top-3 bottom-3 w-64 overflow-y-auto rounded-panel border border-hairline-strong bg-surface/90 backdrop-blur">
        <div className="border-b border-hairline px-4 pt-4 pb-3 text-[13px] font-bold text-ink">
          Port Properties
        </div>

        {elements.map((element) => (
          <ElementPortControls key={String(element.id)} id={String(element.id)} element={element} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
