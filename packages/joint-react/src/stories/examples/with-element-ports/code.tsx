/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { LIGHT, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import '../index.css';
import { V } from '@joint/core';
import {
  GraphProvider,
  Paper,
  useGraph,
  type ElementRecord,
  type ElementPort,
  type LinkRecord,
  useElements,
  HTMLBox,
} from '@joint/react';
import { linkRoutingSmooth } from '@joint/react/presets';

const SMOOTH_LINKS = linkRoutingSmooth();

const SECONDARY = '#6366f1';

// Custom path shapes — computed from width/height so they scale with port size.
function trianglePath(w: number, h: number) {
  const hw = w / 2;
  const hh = h / 2;
  return `M ${-hw} ${-hh} L ${hw} 0 L ${-hw} ${hh} Z`;
}

function roundedRectPath(w: number, h: number) {
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

/** Resolve custom shape names to SVG paths based on port size. */
function resolveShape(shape: string, w: number, h: number): string {
  if (shape === 'triangle') return trianglePath(w, h);
  if (shape === 'rounded-rect') return roundedRectPath(w, h);
  return shape;
}

// --- Data types ---

interface PortNodeData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

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

function getShapeLabel(shape: string): string {
  return SHAPE_OPTIONS.find((o) => o.value === shape)?.label ?? 'Path';
}

const PORT_SIZE = 16;

const initialElements: Record<string, ElementRecord<PortNodeData>> = {
  'node-1': {
    data: { label: 'Node 1', color: PRIMARY },
    position: { x: 50, y: 100 },
    size: {
      width: 140,
      height: 80,
    },
    portStyle: { width: PORT_SIZE, height: PORT_SIZE, color: SECONDARY },
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
  'node-2': {
    data: { label: 'Node 2', color: SECONDARY },
    position: { x: 350, y: 100 },
    size: {
      width: 140,
      height: 80,
    },
    portStyle: { width: PORT_SIZE, height: PORT_SIZE, color: PRIMARY },
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
};

const initialLinks: Record<string, LinkRecord> = {
  'link-1': {
    source: { id: 'node-1', port: 'out-1' },
    target: { id: 'node-2', port: 'in-1' },
    z: -1,
  },
  'link-2': {
    source: { id: 'node-1', port: 'out-2' },
    target: { id: 'node-2', port: 'in-2' },
    z: -1,
  },
};

// --- Styles ---

const inputStyle = {
  padding: '6px 10px',
  border: '1px solid rgba(0, 0, 0, 0.15)',
  borderRadius: 8,
  fontSize: 12,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  color: '#1f2937',
  outline: 'none',
};

const labelStyle = {
  width: 45,
  fontSize: 11,
  color: '#6b7280',
  fontWeight: 500,
} as const;

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
} as const;

// --- Port Controls ---

interface PortControlProps {
  readonly elementId: string;
  readonly portId: string;
  readonly port: ElementPort;
}

function PortControl({ elementId, portId, port }: Readonly<PortControlProps>) {
  const { setElement } = useGraph();

  const updatePort = (updates: Partial<ElementPort>) => {
    setElement(elementId, (previous) => {
      const element = previous as ElementRecord;
      return {
        ...element,
        portMap: element.portMap ? { ...element.portMap, [portId]: { ...element.portMap[portId], ...updates } } : element.portMap,
      };
    });
  };

  return (
    <div
      style={{
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 8,
      }}
    >
      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 12 }}>
        {portId}
        <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: 11 }}>
          {getShapeLabel(port.shape ?? 'ellipse')}
        </span>
      </div>

      {/* Color */}
      <div style={rowStyle}>
        <label style={labelStyle}>Color</label>
        <input
          type="color"
          value={port.color ?? '#333333'}
          onChange={(event) => updatePort({ color: event.target.value })}
          style={{
            width: 36,
            height: 28,
            border: 'none',
            cursor: 'pointer',
            borderRadius: 6,
            padding: 0,
          }}
        />
      </div>

      {/* Shape */}
      <div style={rowStyle}>
        <label style={labelStyle}>Shape</label>
        <select
          value={port.shape ?? 'ellipse'}
          onChange={(event) => {
            const shape = resolveShape(event.target.value, port.width ?? PORT_SIZE, port.height ?? PORT_SIZE);
            updatePort({ shape });
          }}
          style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
        >
          {SHAPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Size */}
      <div style={rowStyle}>
        <label style={labelStyle}>Size</label>
        <input
          type="number"
          value={port.width ?? 16}
          onChange={(event) => updatePort({ width: Number(event.target.value) })}
          style={{ ...inputStyle, width: 55 }}
          min={4}
          max={40}
        />
        <span style={{ fontSize: 11, color: '#9ca3af' }}>&times;</span>
        <input
          type="number"
          value={port.height ?? 16}
          onChange={(event) => updatePort({ height: Number(event.target.value) })}
          style={{ ...inputStyle, width: 55 }}
          min={4}
          max={40}
        />
      </div>

      {/* Label */}
      <div style={rowStyle}>
        <label style={labelStyle}>Label</label>
        <input
          type="text"
          value={port.label ?? ''}
          onChange={(event) => updatePort({ label: event.target.value || undefined })}
          style={{ ...inputStyle, flex: 1 }}
          placeholder="None"
        />
      </div>

      {/* Label Position */}
      <div style={rowStyle}>
        <label style={labelStyle}>Pos</label>
        <select
          value={port.labelPosition ?? 'outside'}
          onChange={(event) => updatePort({ labelPosition: event.target.value })}
          style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
        >
          {LABEL_POSITION_OPTIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </div>

      {/* Label Offset X */}
      <div style={rowStyle}>
        <label style={labelStyle}>dx</label>
        <input
          type="checkbox"
          checked={port.labelOffsetX !== undefined}
          onChange={(event) => updatePort({ labelOffsetX: event.target.checked ? 0 : undefined })}
          style={{ accentColor: PRIMARY }}
        />
        <input
          type="number"
          value={port.labelOffsetX ?? 0}
          disabled={port.labelOffsetX === undefined}
          onChange={(event) => updatePort({ labelOffsetX: Number(event.target.value) })}
          style={{ ...inputStyle, flex: 1, opacity: port.labelOffsetX === undefined ? 0.4 : 1 }}
        />
      </div>

      {/* Label Offset Y */}
      <div style={rowStyle}>
        <label style={labelStyle}>dy</label>
        <input
          type="checkbox"
          checked={port.labelOffsetY !== undefined}
          onChange={(event) => updatePort({ labelOffsetY: event.target.checked ? 0 : undefined })}
          style={{ accentColor: PRIMARY }}
        />
        <input
          type="number"
          value={port.labelOffsetY ?? 0}
          disabled={port.labelOffsetY === undefined}
          onChange={(event) => updatePort({ labelOffsetY: Number(event.target.value) })}
          style={{ ...inputStyle, flex: 1, opacity: port.labelOffsetY === undefined ? 0.4 : 1 }}
        />
      </div>
    </div>
  );
}

// --- Element Port Controls ---

interface ElementPortControlsProps {
  readonly id: string;
  readonly element: ElementRecord<PortNodeData>;
}

function ElementPortControls({ id, element }: Readonly<ElementPortControlsProps>) {
  const portEntries = Object.entries(element.portMap ?? {});
  const { label } = element.data ?? { label: '' };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 13 }}>
        {label}
        <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: 11 }}>
          {portEntries.length} port{portEntries.length === 1 ? '' : 's'}
        </span>
      </div>

      {portEntries.map(([portId, port]) => (
        <PortControl key={portId} elementId={id} portId={portId} port={port} />
      ))}
    </div>
  );
}

function RenderElement(data: { label: string }) {
  return <HTMLBox useModelGeometry>{data.label}</HTMLBox>;
}

// --- Main ---

function Main() {
  const elements = useElements<PortNodeData>();

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: 400, position: 'relative' }}>
      <Paper
        renderElement={RenderElement}
        className={PAPER_CLASSNAME}
        height={400}
        snapLinks={true}
        linkPinning={false}
        {...SMOOTH_LINKS}
      />

      {/* Control Panel */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          top: 16,
          bottom: 16,
          width: 260,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            fontSize: 13,
            fontWeight: 700,
            color: '#1f2937',
            letterSpacing: '-0.01em',
          }}
        >
          Port Properties
        </div>

        {[...elements.entries()].map(([id, element]) => (
          <ElementPortControls key={id} id={id} element={element} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider
      initialElements={initialElements}
      initialLinks={initialLinks}
    >
      <Main />
    </GraphProvider>
  );
}
