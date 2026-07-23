import type { ElementRecord, LinkRecord } from '@joint/react';
import {
  GraphProvider,
  Paper,
  HTMLBox,
  ElementModel,
  LinkModel,
  useGraph,
  elementAttributes,
  elementPort,
  linkAttributes,
  linkLabel,
  linkStyle,
} from '@joint/react';

const PRIMARY = '#ED2637';
const SECONDARY = '#FF9505';

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

type CustomCellRecord =
  | ElementRecord<unknown, 'PortsElement' | 'PortMapElement'>
  | LinkRecord<unknown, 'LabelsLink' | 'LabelMapLink'>;

const CELL_NAMESPACE = { PortsElement, PortMapElement, LabelsLink, LabelMapLink };

const initialCells: readonly CustomCellRecord[] = [
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

function renderElement({ label }: Readonly<NodeData>) {
  return (
    <HTMLBox useModelGeometry className="jj-node">
      {label}
    </HTMLBox>
  );
}

// Shows the models serialize back to full cells — ports and labels included —
// even though each record above only declared minimal data.
function JSONViewer() {
  const { exportToJSON } = useGraph();
  return (
    <pre className="m-0 max-h-40 shrink-0 overflow-auto border-t border-hairline bg-surface p-3 font-mono text-[10px] leading-relaxed text-ink-muted">
      {JSON.stringify(exportToJSON(), null, 2)}
    </pre>
  );
}

export default function App() {
  return (
    <GraphProvider initialCells={initialCells} cellNamespace={CELL_NAMESPACE}>
      <div className="flex size-full flex-col">
        <Paper className="min-h-0 flex-1" renderElement={renderElement} />
        <JSONViewer />
      </div>
    </GraphProvider>
  );
}
