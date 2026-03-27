
import { PAPER_CLASSNAME, BG } from 'storybook-config/theme';
import type { dia } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  Paper,
  useElementSize,
  useFlatElementData,
  useFlatLinkData,
  type FlatElementData,
  type FlatLinkData,
  type RenderElement,
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
        args: { startAngle: 180 - (inputPorts.length - 1) * STEP / 2, step: STEP },
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
        args: { startAngle: 360 - (outputPorts.length - 1) * STEP / 2, step: STEP },
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

const initialElements: Record<string, FlatElementData<NativeElementUserData>> = {
  'node-1': {
    data: { color: INDIGO, label: 'Source', inputPorts: ['in-1', 'in-2'], outputPorts: ['out-1', 'out-2', 'out-3'] },
    x: 50,
    y: 100,
    width: 160,
    height: 100,
  },
  'node-2': {
    data: { color: VIOLET, label: 'Transform', inputPorts: ['in-1', 'in-2'], outputPorts: ['out-1', 'out-2'] },
    x: 380,
    y: 50,
    width: 160,
    height: 100,
  },
  'node-3': {
    data: { color: INDIGO, label: 'Sink', inputPorts: ['in-1', 'in-2', 'in-3'], outputPorts: ['out-1'] },
    x: 380,
    y: 250,
    width: 160,
    height: 100,
  },
};

const initialLinks: Record<string, FlatLinkData> = {
  'link-1': {
    source: 'node-1',
    sourcePort: 'out-1',
    target: 'node-2',
    targetPort: 'in-1',
  },
  'link-2': {
    source: 'node-1',
    sourcePort: 'out-2',
    target: 'node-3',
    targetPort: 'in-1',
  },
  'link-3': {
    source: 'node-1',
    sourcePort: 'out-3',
    target: 'node-3',
    targetPort: 'in-2',
  },
  'link-4': {
    source: 'node-2',
    sourcePort: 'out-1',
    target: 'node-3',
    targetPort: 'in-3',
  },
  'link-5': {
    source: 'node-2',
    sourcePort: 'out-2',
    target: 'node-1',
    targetPort: 'in-2',
  },
};

function Node({ color, label }: Readonly<{ color: string; label: string }>) {
  const { width, height } = useElementSize();
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
    (data) => <Node color={data.color} label={data.label} />,
    [],
  );

  return (
    <Paper
      className={PAPER_CLASSNAME}
      height={420}
      renderElement={renderElement}
      linkPinning={false}
      style={{ backgroundColor: BG }}
      drawGrid={false}
    />
  );
}

export default function App() {
  const elementMappers = useFlatElementData<FlatElementData<NativeElementUserData>>({
    mapAttributes: ({ attributes, data }) => {
      const userData = data.data as NativeElementUserData | undefined;
      const ports = buildNativePorts(userData?.inputPorts, userData?.outputPorts);
      if (!ports) return attributes;
      return { ...attributes, ports };
    }
  }, []);

  const linkMappers = useFlatLinkData<FlatLinkData>({
    defaults: {
      color: EMERALD
    }
  });

  return (
    <GraphProvider
      elements={initialElements}
      links={initialLinks}
      {...elementMappers}
      {...linkMappers}
    >
      <Main />
    </GraphProvider>
  );
}
