import {
  type DiaCellAttributes,
  GraphProvider,
  Paper,
  HTMLBox,
  ElementModel,
  LinkModel,
  useGraph,
} from '@joint/react';
import {
  elementAttributes,
  elementPort,
  linkAttributes,
  linkLabel,
  linkStyle,
} from '@joint/react/presets';
import { PAPER_CLASSNAME, PRIMARY, SECONDARY } from 'storybook-config/theme';
import '../index.css';

// ── Custom element with native JointJS `ports` in defaults ──────────────

class PortsElement extends ElementModel {
  defaults() {
    return {
      ...super.defaults(),
      type: 'PortsElement',
      ports: {
        groups: {
          in: {
            position: { name: 'left' },
            ...elementPort({ width: 10, height: 10, color: SECONDARY, passive: true }),
          },
          out: {
            position: { name: 'right' },
            ...elementPort({ width: 10, height: 10, color: PRIMARY }),
          },
        },
        items: [
          { id: 'in1', group: 'in' },
          { id: 'out1', group: 'out' },
        ],
      },
    };
  }
}

// ── Custom element with `portMap` in defaults ───────────────────────────

class PortMapElement extends ElementModel {
  defaults() {
    return elementAttributes({
      ...super.defaults(),
      type: 'PortMapElement',
      portMap: {
        in: { cx: 0, cy: '50%', width: 10, height: 10, color: SECONDARY, passive: true },
        out: { cx: '100%', cy: '50%', width: 10, height: 10, color: PRIMARY },
      },
    });
  }
}

// ── Custom link with native JointJS `labels` in defaults ────────────────

class LabelsLink extends LinkModel {
  defaults() {
    return {
      ...super.defaults(),
      type: 'LabelsLink',
      labels: [
        {
          ...linkLabel({ text: 'native', fontSize: 10, backgroundBorderRadius: 4 }),
          position: { distance: 0.5 },
        },
      ],
      attrs: linkStyle({ color: SECONDARY, targetMarker: 'arrow' }),
    };
  }
}

// ── Custom link with `labelMap` in defaults ─────────────────────────────

class LabelMapLink extends LinkModel {
  defaults() {
    return linkAttributes({
      ...super.defaults(),
      type: 'LabelMapLink',
      labelMap: {
        main: { text: 'labelMap', fontSize: 10, backgroundBorderRadius: 4 },
      },
      style: { color: PRIMARY, targetMarker: 'arrow' },
    });
  }
}

// ── Data ────────────────────────────────────────────────────────────────

interface NodeData {
  readonly label: string;
}

const initialCells: readonly DiaCellAttributes[] = [
  {
    id: 'a',
    type: 'PortsElement',
    data: { label: 'Ports (native)' },
    position: { x: 50, y: 50 },
    size: { width: 140, height: 60 },
  },
  {
    id: 'b',
    type: 'PortsElement',
    data: { label: 'Ports (native)' },
    position: { x: 50, y: 160 },
    size: { width: 140, height: 60 },
  },
  {
    id: 'c',
    type: 'PortMapElement',
    data: { label: 'PortMap' },
    position: { x: 350, y: 50 },
    size: { width: 140, height: 60 },
  },
  {
    id: 'd',
    type: 'PortMapElement',
    data: { label: 'PortMap' },
    position: { x: 350, y: 160 },
    size: { width: 140, height: 60 },
  },
  {
    id: 'a-c',
    type: 'LabelsLink',
    source: { id: 'a', port: 'out1' },
    target: { id: 'c', port: 'in' },
  },
  {
    id: 'b-d',
    type: 'LabelMapLink',
    source: { id: 'b', port: 'out1' },
    target: { id: 'd', port: 'in' },
  },
];

// ── Component ───────────────────────────────────────────────────────────

const JSON_VIEWER_STYLE = { fontSize: 10 } as const;
const CELL_NAMESPACE = { PortsElement, PortMapElement, LabelsLink, LabelMapLink };

function renderElement({ label }: Readonly<NodeData>) {
  return <HTMLBox useModelGeometry>{label}</HTMLBox>;
}

function JSONViewer() {
  const { graph } = useGraph();
  const json = graph.toJSON({
    cellAttributes: {
      ignoreDefaults: true,
      ignoreEmptyAttributes: () => true,
    },
  });
  return <pre style={JSON_VIEWER_STYLE}>{JSON.stringify(json, null, 2)}</pre>;
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells} cellNamespace={CELL_NAMESPACE}>
      <Paper className={PAPER_CLASSNAME} height={300} renderElement={renderElement} />
      <JSONViewer />
    </GraphProvider>
  );
}
