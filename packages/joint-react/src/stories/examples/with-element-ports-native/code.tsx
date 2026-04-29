import { PAPER_CLASSNAME, PAPER_STYLE } from 'storybook-config/theme';
import type { dia } from '@joint/core';
import '../index.css';
import {
  type CellRecord,
  GraphProvider,
  useCell,
  Paper,
  type RenderElement,
  selectElementSize,
} from '@joint/react';
import { useCallback } from 'react';

// Element palette
const INDIGO = '#4f46e5';
const VIOLET = '#7c3aed';
const SLATE = '#334155';

// Link palette (distinct from elements)
const EMERALD = '#10b981';

// Port colors
const PORT_IN = '#818cf8';
const PORT_OUT = '#a78bfa';

interface NativeElementUserData {
  readonly [key: string]: unknown;
  readonly color: string;
  readonly label: string;
  readonly inputPorts?: readonly string[];
  readonly outputPorts?: readonly string[];
}

const PORT_CIRCLE = {
  r: 'calc(s / 2)',
  magnet: true,
  strokeWidth: 1.5,
} as const;

const STEP = 30;

function buildNativePorts(inputPorts?: readonly string[], outputPorts?: readonly string[]) {
  if (!inputPorts && !outputPorts) return;
  const groups: Record<string, dia.Element.PortGroup> = {};
  const items: dia.Element.Port[] = [];

  if (inputPorts) {
    groups.in = {
      position: {
        name: 'ellipseSpread',
        args: { startAngle: 180 - ((inputPorts.length - 1) * STEP) / 2, step: STEP },
      },
      size: { width: 14, height: 14 },
      label: {
        position: { name: 'radialOriented', args: { offset: 12 } },
        markup: [{ tagName: 'text', selector: 'label' }],
      },
      attrs: {
        circle: { ...PORT_CIRCLE, fill: PORT_IN, stroke: '#e0e7ff' },
        label: { fill: SLATE, fontSize: 10, fontFamily: 'sans-serif' },
      },
    };
    for (const id of inputPorts) {
      items.push({ id, group: 'in', attrs: { label: { text: id, fill: '#cbd5e1' } } });
    }
  }

  if (outputPorts) {
    groups.out = {
      position: {
        name: 'ellipseSpread',
        args: { startAngle: 360 - ((outputPorts.length - 1) * STEP) / 2, step: STEP },
      },
      size: { width: 14, height: 14 },
      label: {
        position: { name: 'radialOriented', args: { offset: 12 } },
        markup: [{ tagName: 'text', selector: 'label' }],
      },
      attrs: {
        circle: { ...PORT_CIRCLE, fill: PORT_OUT, stroke: '#ede9fe' },
        label: { fill: SLATE, fontSize: 10, fontFamily: 'sans-serif' },
      },
    };
    for (const id of outputPorts) {
      items.push({ id, group: 'out', attrs: { label: { text: id, fill: '#cbd5e1' } } });
    }
  }

  return { groups, items };
}

const initialCells: ReadonlyArray<CellRecord<NativeElementUserData>> = [
  {
    id: 'node-1',
    type: 'element',
    data: {
      color: INDIGO,
      label: 'Source',
      inputPorts: ['in-1', 'in-2'],
      outputPorts: ['out-1', 'out-2', 'out-3'],
    },
    position: { x: 50, y: 100 },
    size: { width: 160, height: 100 },
    ports: buildNativePorts(['in-1', 'in-2'], ['out-1', 'out-2', 'out-3']),
  },
  {
    id: 'node-2',
    type: 'element',
    data: {
      color: VIOLET,
      label: 'Transform',
      inputPorts: ['in-1', 'in-2'],
      outputPorts: ['out-1', 'out-2'],
    },
    position: { x: 380, y: 50 },
    size: { width: 160, height: 100 },
    ports: buildNativePorts(['in-1', 'in-2'], ['out-1', 'out-2']),
  },
  {
    id: 'node-3',
    type: 'element',
    data: {
      color: INDIGO,
      label: 'Sink',
      inputPorts: ['in-1', 'in-2', 'in-3'],
      outputPorts: ['out-1'],
    },
    position: { x: 380, y: 250 },
    size: { width: 160, height: 100 },
    ports: buildNativePorts(['in-1', 'in-2', 'in-3'], ['out-1']),
  },
  {
    id: 'link-1',
    type: 'link',
    source: { id: 'node-1', port: 'out-1' },
    target: { id: 'node-2', port: 'in-1' },
    style: { color: EMERALD },
  },
  {
    id: 'link-2',
    type: 'link',
    source: { id: 'node-1', port: 'out-2' },
    target: { id: 'node-3', port: 'in-1' },
    style: { color: EMERALD },
  },
  {
    id: 'link-3',
    type: 'link',
    source: { id: 'node-1', port: 'out-3' },
    target: { id: 'node-3', port: 'in-2' },
    style: { color: EMERALD },
  },
  {
    id: 'link-4',
    type: 'link',
    source: { id: 'node-2', port: 'out-1' },
    target: { id: 'node-3', port: 'in-3' },
    style: { color: EMERALD },
  },
  {
    id: 'link-5',
    type: 'link',
    source: { id: 'node-2', port: 'out-2' },
    target: { id: 'node-1', port: 'in-2' },
    style: { color: EMERALD },
  },
];

function Node({ color, label }: Readonly<{ color: string; label: string }>) {
  const { width, height } = useCell(selectElementSize);
  const cx = width / 2;
  const cy = height / 2;
  return (
    <>
      <defs>
        <radialGradient id={`grad-${label}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="black" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={cx} ry={cy} fill={color} />
      <ellipse cx={cx} cy={cy} rx={cx} ry={cy} fill={`url(#grad-${label})`} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="15"
        fontFamily="sans-serif"
        fontWeight="600"
      >
        {label}
      </text>
    </>
  );
}

function Main() {
  const renderElement: RenderElement<NativeElementUserData> = useCallback(
    (data) => (data ? <Node color={data.color} label={data.label} /> : null),
    []
  );

  return (
    <Paper
      className={PAPER_CLASSNAME}
      height={420}
      renderElement={renderElement}
      linkPinning={false}
      style={PAPER_STYLE}
      drawGrid={false}
    />
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells}>
      <Main />
    </GraphProvider>
  );
}
